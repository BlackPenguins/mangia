import express from 'express';
import { addTag, deleteRecipe, deleteTag, insertRecipe, selectAllRecipes, selectimportFailureURLs, selectRecipeByID, selectTags, updateRecipe } from  '#root/database/recipes.js';
import { breakdownIngredient, createIngredients, createSteps, importRecipe } from '#root/scrapers/RecipeImporter.js';
import { deleteStepsByRecipeID, selectStepsByRecipeID } from  '#root/database/step.js';
import { deleteIngredient, deleteIngredientsByRecipeID, insertIngredient, selectIngredientByIngredientID, selectIngredientsByRecipeID, updateIngredient } from  '#root/database/ingredient.js';

import Tesseract, { createWorker } from 'tesseract.js';
import multer from 'multer';
import Jimp from "jimp";

import fileType from "file-type";

import { deleteWithRecipeID, selectByRecipeID } from  '#root/database/menu.js';
import { insertTag, selectTagByName } from  '#root/database/tags.js';

import fs from 'fs';
import { checkAdminMiddleware } from './auth.js';
import { insertIngredientTag, selectIngredientTagByName, selectIngredientTagsByRecipeID } from  '#root/database/ingredientTags.js';
import { withDateDetails } from './menu.js';
import { deletePrimaryThumbnail, deleteThumbnail, deleteThumbnailsForRecipe, insertThumbnail, selectAllThumbnails } from  '#root/database/thumbnails.js';
import { convertToTeaspoons } from './shoppingListItem.js';
import { deleteStepGroupByRecipeID, selectStepGroupsByRecipeID } from '#root/database/stepGroup.js';

export const THUMBNAIL_DIRECTORY = './images/thumbnails';
const LARGE_PREFIX = 'large_';

const thumbnailStorageEngine = multer.diskStorage({
	destination: (req, file, callback) => {

		fs.mkdirSync(THUMBNAIL_DIRECTORY, { recursive: true });
		callback(null, THUMBNAIL_DIRECTORY);
	},
	filename: (req, file, callback) => {
		const recipeID = req.params.recipeID;
		const originalFileName = file.originalname;
		const randomSuffix = Math.floor(Math.random() * 10000);
		const originalFileExt = originalFileName.substring(originalFileName.lastIndexOf('.'));
		callback(null, `${LARGE_PREFIX}recipe_${recipeID}_${randomSuffix}${originalFileExt}`);
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

const upload = multer({ storage: thumbnailStorageEngine, limits: { fileSize: 25 * 1024 * 1024 } });
const uploadAttachments = multer({ storage: attachmentStorageEngine, limits: { fileSize: 25 * 1024 * 1024 } });

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

const getImportFailureURLs = async (req, res) => {
	const urls = await selectimportFailureURLs();
	res.status(200).json(urls);
};

const getRecipeHandler = async (req, res) => {
	const recipe = await buildFullRecipe(req.params.recipeID);

	if (!recipe) {
		res.status(500).json({ message: "Recipe doesn't exist!" });
	} else {
		res.status(200).json(recipe);
	}
};

const buildFullRecipe = async (recipeID) => {
	const recipe = await selectRecipeByID(recipeID);

	if (!recipe) {
		return null;
	} else {
		const recipeWithThumbnails = await addThumbnails(recipe);
		const stepGroups = await selectStepGroupsByRecipeID(recipeID);

		recipeWithThumbnails.stepGroups = [];
		for (const stepGroup of stepGroups) {
			const stepGroupID = stepGroup.StepGroupID;
			const newStepGroup = {};
			newStepGroup.id = stepGroupID;
			newStepGroup.header = stepGroup.Header;
			newStepGroup.steps = stepGroup.Steps;
			recipeWithThumbnails.stepGroups.push(newStepGroup);
		}

		const history = await selectByRecipeID(recipeID);

		recipeWithThumbnails.history = [];
		for (const historyItem of history) {
			if (!historyItem.IsSkipped && !historyItem.IsLeftovers) {
				recipeWithThumbnails.history.push(withDateDetails(historyItem.Day, historyItem));
			}
		}

		const attachmentDirectory = `./images/attachments/${recipeID}`;
		recipeWithThumbnails.attachments = (fs.existsSync(attachmentDirectory) && fs.readdirSync(attachmentDirectory)) || [];

		await addIngredientsToRecipe(recipeWithThumbnails);

		return recipeWithThumbnails;
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
			isMissingUnits: ingredient.IsMissingUnits,
			calculatedAmount: extractedAmount,
			calculatedValue: extractedName,
			ingredientDepartment: ingredient.IngredientDepartment,
			ingredientDepartmentPosition: ingredient.IngredientDepartmentPosition,
		});
	}
};

export const addThumbnails = async (recipe) => {
	const recipeID = recipe.RecipeID;

	const thumbnails = await selectAllThumbnails(recipeID);

	return {
		thumbnails,
		...recipe,
	};
};

export const addIngredientTags = async (recipe) => {
	const recipeID = recipe.RecipeID;

	const ingredientTags = (await selectIngredientTagsByRecipeID(recipeID)).map( i => i.IngredientTagID);

	return {
		ingredientTags,
		...recipe,
	};
}


const getAllRecipes = (req, res) => {
	const selectPromise = selectAllRecipes();

	selectPromise.then(
		async (result) => {
			const recipeWithThumbnails = await Promise.all(result.map((r) => addThumbnails(r)));
			res.status(200).json(recipeWithThumbnails);
		},
		(error) => {
			res.status(500).json({ message: error });
		}
	);
};

const importRecipeProcessor = async (req, res) => {
	let url = req.body.url;
	let replaceRecipeID = req.body.replaceRecipeID;
	try {
		const importResponse = await importRecipe(url, replaceRecipeID);
		res.status(200).json(importResponse);
	} catch (e) {
		res.status(200).json({ success: false });
	}
};

const uploadImage = async (req, res) => {
	const recipeID = req.params.recipeID;
	const isPrimary = req.body.isPrimary;
	console.log(`Upload a thumbnail for recipe ${recipeID}]`);

	let success = false;
	if (req.file) {
		const beforeImageFileName = req.file.filename;
		const afterImageFileName = beforeImageFileName.replace(LARGE_PREFIX, '');

		console.log(`Before Image Name [${beforeImageFileName}] Primary [${isPrimary}]`);
		console.log(`After Image Name [${afterImageFileName}]`);

		if( isPrimary == "true") {
	 		await deletePrimaryThumbnail(recipeID);
		}

		success = await resizeThumbnail(res, recipeID, THUMBNAIL_DIRECTORY, beforeImageFileName, afterImageFileName, isPrimary);
	} else {
		console.log('No file was uploaded.');
	}

	if( success ) {
		res.status(200).json({});
	}
};

export const resizeThumbnail = async (res, recipeID, sourceDirectory, beforeImageFileName, afterImageFileName, isPrimary) => {
	fs.mkdirSync(sourceDirectory, { recursive: true });
	
	const beforeImageFile = `${sourceDirectory}/${beforeImageFileName}`;
	const afterImageFile = `${THUMBNAIL_DIRECTORY}/${afterImageFileName}`;

	const buffer = fs.readFileSync(beforeImageFile);
	
	if( buffer.length === 0) {
		console.log("File had no content.")
		return;
	}

	const type = await fileType.fromBuffer(buffer);

	if( !type) {
		console.log("Could not get file type. Using the original image." );
		await insertThumbnail(recipeID, beforeImageFile, isPrimary);
	} else {
		if (beforeImageFile === afterImageFile) {
			console.error('Input and output of thumbnail resize was same path.');
			return;
		}

		try {
			const image = await Jimp.read(beforeImageFile);

			if( isPrimary == "true" ) {
				// Lo-res the primary thumbnail
				image.resize(Jimp.AUTO, 320);
			}

			await image.writeAsync(afterImageFile);

			fs.unlink(beforeImageFile, (err) => {
				if (err) {
					console.error('Error deleting the file:', err);
				}
			});

			await insertThumbnail(recipeID, afterImageFileName, isPrimary);
			return true;
		} catch( e ) {
			console.log("Could not upload image: " + e);
			res.status(500).json({ message: "An error has occurred during image upload! " + e.message });
			return false;
		}
	}
};

const uploadAttachment = async (req, res) => {
	const recipeID = req.params.recipeID;

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
		preheat: req.body.preheat,
		prepTime: req.body.prepTime,
		defrost: req.body.defrost,
		page: req.body.page,
		notes: req.body.notes,
		dayPrep: req.body.dayPrep,
		rating: req.body.rating,
		url: req.body.url,
		isActive: true,
		IsNewArrival: true,
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

const addTagToRecipe = async (req, res) => {
	// Either isNewValue is true, and only a name is passed in
	// Or isNewValue is false, and an id and name is passed in (then we only use the id)
	const recipeID = req.params.recipeID;
	const tagName = req.body.name;
	const isNewValue = req.body.isNewValue;
	let tagID = req.body.id;

	console.log(`Incoming Add Tag Recipe for ${recipeID}`, req.body);

	if( isNewValue ) {
		const createdTag = await insertTag({ Name: tagName });
		tagID = createdTag.id;
	}

	const recipeTags = await selectTags(recipeID);
	const recipeTagExists = recipeTags.some((recipeTag) => recipeTag.TagID === tagID);

	if (recipeTagExists) {
		console.log('THIS ALREADY EXISTS');
	} else {
		await addTag(recipeID, tagID);
	}
	res.status(200).json({ success: true });
};

const deleteThumbnailHandler = (req, res) => {
	const thumbnailID = req.params.thumbnailID;
	console.log(`Incoming Delete Thumbnail for ${thumbnailID}`);

	const deleteThumbnailPromise = deleteThumbnail(thumbnailID);

	deleteThumbnailPromise.then(
		(result) => {
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

	if (req.body.protein != undefined) {
		updatedRecipe.protein = req.body.protein;
	}

	if (req.body.preheat != undefined) {
		updatedRecipe.preheat = req.body.preheat || 0;
	}

	if (req.body.prepTime != undefined) {
		updatedRecipe.prepTime = req.body.prepTime;
	}

	if (req.body.defrost != undefined) {
		updatedRecipe.defrost = req.body.defrost;
	}

	if (req.body.description != undefined) {
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

	if (req.body.dayPrep != undefined) {
		updatedRecipe.dayPrep = req.body.dayPrep;
	}

	if (req.body.rating) {
		updatedRecipe.rating = req.body.rating;
	}

	if (req.body.url != undefined) {
		updatedRecipe.url = req.body.url;
	}

	let recipe = null;

	if (Object.keys(updatedRecipe).length) {
		console.log(` Update Recipe for ${recipeID}`, updatedRecipe);
		recipe = await updateRecipe(updatedRecipe, recipeID);
	}

	await updateStepsAndIngredients(req.body, recipeID);

	const finalRecipe = await buildFullRecipe(recipeID);
	res.status(200).json({ success: true, finalRecipe });
};

const updateIngredientProcessor = async (req, res) => {
	const ingredientID = req.params.ingredientID;
	console.log(`Incoming Update Ingredient for ${ingredientID}`, req.body);

	const ingredientValue = req.body.value;
	const ingredientTag = req.body?.ingredientTag;

	const updatedIngredient = {};

	if (ingredientValue) {
		updatedIngredient.Name = ingredientValue;
	}

	if (ingredientTag) {
		// Either isNewValue is true, and only a name is passed in
		// Or isNewValue is false, and an id and name is passed in (then we only use the id)
		const tagName = ingredientTag.name;
		const isNewValue = ingredientTag.isNewValue;

		let tagID;
		if( isNewValue ) {
			const createdTag = await insertIngredientTag({ Name: tagName.trim() });
			tagID = createdTag.id;
		} else if( ingredientTag.id == null ) {
			tagID = null;
		} else {
			tagID = ingredientTag.id;
		}
		
		updatedIngredient.IngredientTagID = tagID;
	}

	// Update the ingredient with the tag
	console.log(` Update Ingredient for ${ingredientID}`, updatedIngredient);
	const recipe = await updateIngredient(updatedIngredient, ingredientID);

	await validateAndUpdateMissingUnits(ingredientID);
	res.status(200).json({ success: true, updatedIngredient });
};

const validateAndUpdateMissingUnits = async(ingredientID) => {
	const ingredient = await selectIngredientByIngredientID(ingredientID);

	const updatedIngredient = {};

	if( ingredient.IngredientTagID == null ) {
		// No tag, nothing to track in shopping list, units don't matter
		updatedIngredient.IsMissingUnits = false;
	} else {
		const { extractedAmount } = breakdownIngredient(ingredient.Name);
		const converted = convertToTeaspoons(extractedAmount);
		updatedIngredient.IsMissingUnits = converted.isMissingUnits;
	}

	await updateIngredient(updatedIngredient, ingredientID);

}
const addIngredientProcessor = async (req, res) => {
	const name = req.body.name;
	const recipeID = req.params.recipeID;

	const newIngredient = {
		Name: name,
		RecipeID: recipeID,
	};
	console.log(`Incoming Insert Ingredient for`, newIngredient);

	await insertIngredient(newIngredient);
	res.status(200).json({ success: true });
};

const removeIngredientProcessor = async (req, res) => {
	const ingredientID = req.params.ingredientID;

	console.log(`Incoming Delete Ingredient for`, ingredientID);

	await deleteIngredient(ingredientID);
	res.status(200).json({ success: true });
};

const updateStepsAndIngredients = async (body, recipeID) => {
	const updatedRecipe = {};

	// Now that we updated the recipe we can add in the data that is joined with the RECIPE table
	if (body.ingredients) {
		updatedRecipe.ingredients = body.ingredients;

		// Cache the tags for the ingredients so we can re-add them after we delete the ingredients
		const ingredients = await selectIngredientsByRecipeID(recipeID);
		const tagCache = {};

		for (const ingredient of ingredients) {
			const tagID = ingredient.IngredientTagID;
			if (tagID) {
				tagCache[ingredient.Name] = tagID;
			}
		}

		await deleteIngredientsByRecipeID(recipeID);
		await createIngredients(recipeID, updatedRecipe, tagCache);
	}

	if (body.stepGroups) {
		updatedRecipe.stepGroups = body.stepGroups;
		await deleteStepsByRecipeID(recipeID);
		await deleteStepGroupByRecipeID(recipeID);
		await createSteps(recipeID, updatedRecipe);
	}
};

const referenceStorageEngine = multer.diskStorage({
	destination: (req, file, callback) => {
		callback(null, './images');
	},
	filename: (req, file, callback) => {
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
	await deleteStepGroupByRecipeID(recipeID);
	await deleteThumbnailsForRecipe(recipeID);
	await deleteRecipe(recipeID);
	res.status(200).json(recipeID);
};

let progress = 0;
const router = express.Router();

router.get('/api/recipes/parseTextProgress', getParseTextProgress);
router.get('/api/recipes/:recipeID/tags', getTagsForRecipe);
router.get('/api/recipes/:recipeID', getRecipeHandler);
router.get('/api/recipe/importFailureURLs', getImportFailureURLs);
router.get('/api/recipes', getAllRecipes);
router.post('/api/recipes/import', [checkAdminMiddleware], importRecipeProcessor);
router.delete('/api/recipes/image/:thumbnailID', [checkAdminMiddleware], deleteThumbnailHandler);
router.post('/api/recipes/image/:recipeID', [checkAdminMiddleware, upload.single('imageFile')], uploadImage);
router.post('/api/recipes/attachments/:recipeID', [checkAdminMiddleware, uploadAttachments.single('imageFile')], uploadAttachment);
router.put('/api/recipes', [checkAdminMiddleware], addRecipe);
router.post('/api/recipes/:recipeID/addTag', [checkAdminMiddleware], addTagToRecipe);
router.post('/api/recipes/:recipeID/removeTag', [checkAdminMiddleware], removeTagFromRecipe);
router.patch('/api/recipes/:recipeID', [checkAdminMiddleware], updateRecipeProcessor);
router.patch('/api/recipes/:recipeID/ingredient/:ingredientID', [checkAdminMiddleware], updateIngredientProcessor);
router.delete('/api/recipes/:recipeID/ingredient/:ingredientID', [checkAdminMiddleware], removeIngredientProcessor);
router.put('/api/recipes/:recipeID/ingredient', [checkAdminMiddleware], addIngredientProcessor);
router.post('/api/recipeOCR', [checkAdminMiddleware], uploadImportFile.single('importFile'), uploadOCR);
router.post('/api/recipes/:recipeID/parseText', [checkAdminMiddleware], parseText);
router.delete('/api/recipes/:recipeID', [checkAdminMiddleware], deleteRecipeProcessor);

export default router;
