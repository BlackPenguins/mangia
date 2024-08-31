import express from 'express';
import { addTag, deleteRecipe, deleteTag, insertRecipe, selectAllRecipes, selectRecipeByID, selectTags, updateRecipe } from '../database/recipes.js';
import { breakdownIngredient, createIngredients, createSteps, importRecipe } from '../scrapers/RecipeImporter.js';
import { deleteStepsByRecipeID, selectStepsByRecipeID } from '../database/step.js';
import { deleteIngredientsByRecipeID, selectIngredientsByRecipeID, updateIngredient } from '../database/ingredient.js';

import Tesseract, { createWorker } from 'tesseract.js';
import multer from 'multer';
import sharp from 'sharp';
import { deleteWithRecipeID, selectByRecipeID } from '../database/menu.js';
import { insertTag, selectTagByName } from '../database/tags.js';

import fs from 'fs';
import { checkAdminMiddleware } from './auth.js';
import { insertIngredientTag, selectIngredientTagByName } from '../database/ingredientTags.js';
import { withDateDetails } from './menu.js';

export const THUMBNAIL_DIRECTORY = './images/thumbnails';
const LARGE_PREFIX = 'large_';

const thumbnailStorageEngine = multer.diskStorage({
	destination: (req, file, callback) => {
		callback(null, THUMBNAIL_DIRECTORY);
	},
	filename: (req, file, callback) => {
		const recipeID = req.params.recipeID;
		console.log(file);
		const originalFileName = file.originalname;
		const originalFileExt = originalFileName.substring(originalFileName.lastIndexOf('.'));
		callback(null, `${LARGE_PREFIX}recipe_${recipeID}${originalFileExt}`);
	},
});

const attachmentStorageEngine = multer.diskStorage({
	destination: (req, file, callback) => {
		const recipeID = req.params.recipeID;
		const directory = `./images/attachments/${recipeID}`;
		if (!fs.existsSync(directory)) {
			fs.mkdirSync(directory, { recursive: true });
		}

		callback(null, directory);
	},
	filename: (req, file, callback) => {
		callback(null, file.originalname);
	},
});

const upload = multer({ storage: thumbnailStorageEngine, limits: { fileSize: '50MB' } });
const uploadAttachments = multer({ storage: attachmentStorageEngine, limits: { fileSize: '50MB' } });

const getTagsForRecipe = (req, res) => {
	const recipeID = req.params.recipeID;

	const foundTagPromise = selectTags(recipeID);

	foundTagPromise.then(
		async (result) => {
			res.status(200).json(result);
		},
		(error) => {
			res.status(500).json({ message: error });
		}
	);
};

const getRecipe = async (req, res) => {
	const recipe = await selectRecipeByID(req.params.recipeID);

	if (!recipe) {
		res.status(500).json({ message: "Recipe doesn't exist!" });
	} else {
		const steps = await selectStepsByRecipeID(req.params.recipeID);

		recipe.steps = [];
		for (const step of steps) {
			recipe.steps.push({
				stepNumber: step.StepNumber,
				instruction: step.Instruction,
			});
		}

		const history = await selectByRecipeID(req.params.recipeID);

		recipe.history = [];
		for (const historyItem of history) {
			if (!historyItem.IsSkipped && !historyItem.IsLeftovers) {
				recipe.history.push(withDateDetails(historyItem.Day, historyItem));
			}
		}

		const attachmentDirectory = `./images/attachments/${req.params.recipeID}`;
		recipe.attachments = (fs.existsSync(attachmentDirectory) && fs.readdirSync(attachmentDirectory)) || [];

		console.log(recipe.attachments);

		await addIngredientsToRecipe(recipe);

		res.status(200).json(recipe);
	}
};

export const addIngredientsToRecipe = async (recipe) => {
	const ingredients = await selectIngredientsByRecipeID(recipe.RecipeID);

	recipe.ingredients = [];
	for (const ingredient of ingredients) {
		const { extractedAmount, extractedName } = breakdownIngredient(ingredient?.Name);

		recipe.ingredients.push({
			ingredientID: ingredient.IngredientID,
			name: ingredient.Name,
			tagName: ingredient.TagName,
			tagID: ingredient.IngredientTagID,
			calculatedAmount: extractedAmount,
			calculatedValue: extractedName,
			ingredientDepartment: ingredient.IngredientDepartment,
			ingredientDepartmentPosition: ingredient.IngredientDepartmentPosition,
		});
	}
};
const getAllRecipes = (req, res) => {
	const selectPromise = selectAllRecipes();

	selectPromise.then(
		(result) => {
			res.status(200).json(result);
		},
		(error) => {
			res.status(500).json({ message: error });
		}
	);
};

const importRecipeProcessor = async (req, res) => {
	let url = req.body.url;
	let currentRecipeID = req.body.currentRecipeID;
	const importResponse = await importRecipe(url, currentRecipeID);
	res.status(200).json(importResponse);
};

const uploadImage = async (req, res) => {
	const recipeID = req.params.recipeID;
	console.log(req.file, recipeID);

	if (req.file) {
		const beforeImageFileName = req.file.filename;
		const afterImageFileName = beforeImageFileName.replace(LARGE_PREFIX, '');

		resizeThumbnail(recipeID, THUMBNAIL_DIRECTORY, beforeImageFileName, afterImageFileName);
	}

	res.status(200).json({});
};

export const resizeThumbnail = async (recipeID, sourceDirectory, beforeImageFileName, afterImageFileName) => {
	const beforeImageFile = `${sourceDirectory}/${beforeImageFileName}`;
	const afterImageFile = `${THUMBNAIL_DIRECTORY}/${afterImageFileName}`;

	if (beforeImageFile === afterImageFile) {
		console.error('Input and output of thumbnail resize was same path.');
		return;
	}

	const image = sharp(beforeImageFile);
	const metadata = await image.metadata();

	image.resize({ height: 500, fit: 'outside' }); // Resize to 500 px

	// Dynamically set quality based on the format
	switch (metadata.format) {
		case 'jpeg':
		case 'jpg':
			image.jpeg({ quality: 100 });
			break;
		case 'png':
			image.png({ compressionLevel: 0 });
			break;
		case 'webp':
			image.webp({ quality: 100 });
			break;
		case 'tiff':
			image.tiff({ quality: 100 });
			break;
		default:
			console.warn(`Unknown or unsupported format: ${metadata.format}`);
			break;
	}

	await image.toFile(afterImageFile);

	console.log('Deleting thumbnail: ' + beforeImageFile);
	fs.unlink(beforeImageFile, (err) => {
		if (err) {
			console.error('Error deleting the file:', err);
		}
	});

	const updatedRecipe = {};
	updatedRecipe.image = afterImageFileName;

	await updateRecipe(updatedRecipe, recipeID);
};

const uploadAttachment = async (req, res) => {
	const recipeID = req.params.recipeID;
	console.log(req.file, recipeID);

	console.log(` Update Attachment for ${recipeID}`);

	res.status(200).json('NONE');
};

const addRecipe = (req, res) => {
	console.log('Incoming New Recipe', req.body);
	// We need a middleman object so the person using the API can't change whichever columns they want
	const newRecipe = {
		name: req.body.name,
		description: req.body.description,
		category: req.body.category,
		protein: req.body.protein,
		defrost: req.body.defrost,
		page: req.body.page,
		notes: req.body.notes,
		dayPrep: req.body.dayPrep,
		rating: req.body.rating,
		url: req.body.url,
		isActive: req.body.isActive,
	};

	const bookID = req.body.bookID;

	if (bookID !== 0) {
		newRecipe.bookID = bookID;
	}

	// We can pass an object as long as the properties of the object match the column names in the DB table
	const insertPromise = insertRecipe(newRecipe);

	insertPromise.then(
		(result) => {
			const recipeID = result.id;
			updateStepsAndIngredients(req.body, recipeID);
			res.status(200).json({ recipeID });
		},
		(error) => {
			console.log('err', error);
			res.status(500).json({ message: error });
		}
	);
};

const addTagToRecipe = (req, res) => {
	const recipeID = req.params.recipeID;
	const tagName = req.body.tagName;
	console.log(`Incoming Add Tag Recipe for ${recipeID}`, req.body);

	const foundTagPromise = selectTagByName(tagName);

	foundTagPromise.then(
		async (result) => {
			let tagID;
			console.log('RES', result);
			if (result.length === 0) {
				console.log('NO TAG, creating');
				const createdTag = await insertTag({ Name: tagName });
				console.log('CREated', createdTag);
				tagID = createdTag.id;
			} else {
				console.log('TAG found');
				tagID = result[0].TagID;
			}

			const recipeTags = await selectTags(recipeID);
			const recipeTagExists = recipeTags.some((recipeTag) => recipeTag.TagID === tagID);

			if (recipeTagExists) {
				console.log('THIS ALREADY EXISTS');
			} else {
				await addTag(recipeID, tagID);
			}
			res.status(200).json(result);
		},
		(error) => {
			res.status(500).json({ message: error });
		}
	);
};

const removeTagFromRecipe = (req, res) => {
	const recipeID = req.params.recipeID;
	const tagID = req.body.tagID;
	console.log(`Incoming Delete Tag Recipe for ${recipeID}`, req.body);

	const deleteTagPromise = deleteTag(recipeID, tagID);

	deleteTagPromise.then(
		(result) => {
			res.status(200).json(result);
		},
		(error) => {
			res.status(500).json({ message: error });
		}
	);
};

const updateRecipeProcessor = async (req, res) => {
	const recipeID = req.params.recipeID;
	console.log(`Incoming Update Recipe for ${recipeID}`, req.body);

	// We need a middleman object so the person using the API can't change whichever columns they want
	const updatedRecipe = {};

	if (req.body.name) {
		updatedRecipe.name = req.body.name;
	}

	if (req.body.category) {
		updatedRecipe.category = req.body.category;
	}

	if (req.body.isActive != undefined) {
		updatedRecipe.IsActive = req.body.isActive ? 1 : 0;
	}

	if (req.body.protein) {
		updatedRecipe.protein = req.body.protein;
	}

	if (req.body.defrost) {
		updatedRecipe.defrost = req.body.defrost;
	}

	if (req.body.description) {
		updatedRecipe.description = req.body.description;
	}

	if (req.body.bookID) {
		updatedRecipe.bookID = req.body.bookID;

		if (updatedRecipe.bookID === 0) {
			updatedRecipe.bookID = null;
		}
	}

	if (req.body.page) {
		updatedRecipe.page = req.body.page;
	}

	if (req.body.notes !== undefined) {
		updatedRecipe.notes = req.body.notes;
	}

	if (req.body.dayPrep) {
		updatedRecipe.dayPrep = req.body.dayPrep;
	}

	if (req.body.rating) {
		updatedRecipe.rating = req.body.rating;
	}

	if (req.body.url) {
		updatedRecipe.url = req.body.url;
	}

	console.log(` Update Recipe for ${recipeID}`, updatedRecipe);
	const recipe = await updateRecipe(updatedRecipe, recipeID);

	updateStepsAndIngredients(req.body, recipeID);
	res.status(200).json({ success: true, recipe });
};

const updateIngredientProcessor = async (req, res) => {
	const ingredientID = req.params.ingredientID;
	console.log(`Incoming Update Ingredient for ${ingredientID}`, req.body);

	const ingredientValue = req.body.value;
	const tagName = req.body?.tagName;

	const updatedIngredient = {};

	if (ingredientValue) {
		updatedIngredient.Name = ingredientValue;
	}

	if (tagName) {
		let tagID = null;

		const foundTagResults = await selectIngredientTagByName(tagName);

		if (foundTagResults.length === 0) {
			const createdTag = await insertIngredientTag({ Name: tagName.trim() });
			tagID = createdTag.id;
		} else {
			tagID = foundTagResults[0].IngredientTagID;
		}
		updatedIngredient.IngredientTagID = tagID;
	} else if (tagName !== undefined) {
		// Remove the tag if its falsy but it was still included in the body
		updatedIngredient.IngredientTagID = null;
	}

	// Update the ingredient with the tag
	console.log(` Update Ingredient for ${ingredientID}`, updatedIngredient);
	const recipe = await updateIngredient(updatedIngredient, ingredientID);
	res.status(200).json({ success: true, updatedIngredient });
};

const updateStepsAndIngredients = async (body, recipeID) => {
	const updatedRecipe = {};

	// Now that we updated the recipe we can add in the data that is joined with the RECIPE table
	if (body.ingredients) {
		updatedRecipe.ingredients = body.ingredients;
		await deleteIngredientsByRecipeID(recipeID);
		await createIngredients(recipeID, updatedRecipe);
	}

	if (body.steps) {
		updatedRecipe.steps = body.steps;
		await deleteStepsByRecipeID(recipeID);
		await createSteps(recipeID, updatedRecipe);
	}
};

const referenceStorageEngine = multer.diskStorage({
	destination: (req, file, callback) => {
		callback(null, './images');
	},
	filename: (req, file, callback) => {
		console.log(file);
		callback(null, file.originalname);
	},
});

const uploadImportFile = multer({ storage: referenceStorageEngine, limits: { fileSize: '50MB' } });

const uploadOCR = (req, res) => {
	console.log('FILE', req.file.filename);
	Tesseract.recognize(`./images/${req.file.filename}`, 'eng', { logger: (m) => console.log(m) }).then(({ data: { text } }) => {
		console.log(text);
	});
};

const getParseTextProgress = async (req, res) => {
	res.status(200).json({ progress });
};

const parseText = async (req, res) => {
	const recipeID = req.params.recipeID;
	const file = req.body.attachment;
	const imageFile = `./images/attachments/${recipeID}/${file}`;

	progress = 0;

	console.log('PARSING FILE'.imageFile);

	const worker = await createWorker('eng', 1, {
		logger: (m) => {
			if (m.status === 'recognizing text') {
				progress = m.progress;
			}
			console.log(m);
		},
	});

	const {
		data: { text },
	} = await worker.recognize(imageFile);

	console.log('RETURNING', text);
	res.status(200).json({ text });
};

const deleteRecipeProcessor = async (req, res) => {
	const recipeID = req.params.recipeID;
	await deleteWithRecipeID(recipeID);
	await deleteIngredientsByRecipeID(recipeID);
	await deleteStepsByRecipeID(recipeID);
	await deleteRecipe(recipeID);
	res.status(200).json(recipeID);
};

let progress = 0;
const router = express.Router();

router.get('/api/recipes/parseTextProgress', getParseTextProgress);
router.get('/api/recipes/:recipeID/tags', getTagsForRecipe);
router.get('/api/recipes/:recipeID', getRecipe);
router.get('/api/recipes', getAllRecipes);
router.post('/api/recipes/import', [checkAdminMiddleware], importRecipeProcessor);
router.post('/api/recipes/image/:recipeID', [checkAdminMiddleware, upload.single('imageFile')], uploadImage);
router.post('/api/recipes/attachments/:recipeID', [checkAdminMiddleware, uploadAttachments.single('imageFile')], uploadAttachment);
router.put('/api/recipes', [checkAdminMiddleware], addRecipe);
router.post('/api/recipes/:recipeID/addTag', [checkAdminMiddleware], addTagToRecipe);
router.post('/api/recipes/:recipeID/removeTag', [checkAdminMiddleware], removeTagFromRecipe);
router.patch('/api/recipes/:recipeID', [checkAdminMiddleware], updateRecipeProcessor);
router.patch('/api/recipes/:recipeID/ingredient/:ingredientID', [checkAdminMiddleware], updateIngredientProcessor);
router.post('/api/recipeOCR', [checkAdminMiddleware], uploadImportFile.single('importFile'), uploadOCR);
router.post('/api/recipes/:recipeID/parseText', [checkAdminMiddleware], parseText);
router.delete('/api/recipes/:recipeID', [checkAdminMiddleware], deleteRecipeProcessor);

export default router;
