import { deleteIngredientsByRecipeID, insertIngredient } from  '#root/database/ingredient.js';
import { deleteRecipe, insertImportFailureURL, insertRecipe, selectRecipeByName, updateRecipe } from  '#root/database/recipes.js';
import { deleteStepsByRecipeID, insertStep } from  '#root/database/step.js';
import { deleteStepGroupByRecipeID, insertStepGroup } from '#root/database/stepGroup.js';
import { deleteThumbnailsForRecipe } from '#root/database/thumbnails.js';
import { resizeThumbnail, THUMBNAIL_DIRECTORY } from '#root/routes/recipes.js';
import { scrape } from '#root/scrapers/ScraperFactory.js';
import fs from "fs";
import https from "https";
import path from "path";

export const INGREDIENT_REGEX = /([\d\/\s]+\s(?:cup|c|teaspoon|tablespoon|tbsp|pound|ounce|tsp|oz|lb|tb)?(?:s)?)(.*)/i;
export const INGREDIENT_EXTRACT_REGEX = /([\d\/\s]+)\s*(cup|c|teaspoon|tablespoon|tbsp|pound|ounce|tsp|oz|lb|tb)?(?:s)?/i;

export const importRecipe = async (url, replaceRecipeID) => {

	const importResponse = {};

	let scrapeSuccess = false;

	try {
		const recipeObject = await scrape(url);
		scrapeSuccess = recipeObject.success;

		console.log(`Importing recipe for URL [${url}] for recipe ID [${replaceRecipeID}]`);

		if (!scrapeSuccess) {
			importResponse.success = false;
			importResponse.status = `Failed to parse recipe from the URL "${url}"`;
			await insertImportFailureURL(url);
		} else {
			let recipeID = 0;
			try {
				if( replaceRecipeID != null ) {
					// Replacing an existing one (the Import button in the Edit page)
					recipeID = replaceRecipeID;

					deleteIngredientsByRecipeID(recipeID);
					deleteStepsByRecipeID(recipeID);
					deleteStepGroupByRecipeID(recipeID);
					deleteThumbnailsForRecipe(recipeID);
				} else {
					// Adding a new recipe
					const recipeName = recipeObject.name.substring(0,49).replaceAll("&amp;", "&");

					const recipeToAdd = {
						name: recipeName,
						description: recipeObject.description,
						image: recipeObject.image
					};

					const recipeExists = await selectRecipeByName(recipeName);

					if (recipeExists) {
						console.error(`Recipe with name [${recipeName}] already exists.`);
						importResponse.success = false;
						importResponse.status = `Recipe with name "${recipeName}" already exists.`;
						return importResponse;
					}

					recipeID = await createRecipe(recipeToAdd, url);
					console.log(`Created a new recipe with ID [${recipeID}].`);
				}

				await createIngredients(recipeID, recipeObject);
				await createSteps(recipeID, recipeObject);

				importResponse.success = true;
				importResponse.recipeID = recipeID;
			} catch (e) {
				const errorStack = e.stack;
				console.error(`SOMETHING BAD HAPPENED DURING IMPORT OF RECIPE #${recipeID}`, e);

				// Cleanup the bad inserts
				if (!recipeID) {
					deleteIngredientsByRecipeID(recipeID);
					deleteStepsByRecipeID(recipeID);
					deleteStepGroupByRecipeID(recipeID);
					deleteThumbnailsForRecipe(recipeID);
					deleteRecipe(recipeID);
				}

				importResponse.success = false;
				importResponse.status = errorStack;
			}
		}
	} catch (error) {
		console.log('ERR', error);
		scrapeSuccess = false;
	}

	return importResponse;
};

const createRecipe = async (recipe, url) => {
	console.log(`Insert recipe with name [${recipe.name}] and description [${recipe.description}]`);

	const recipeToInsert = {
		name: recipe.name,
		description: recipe.description,
		url,
		IsActive: 1,
		IsNewArrival: 1,
	};

	const newRecipe = await insertRecipe(recipeToInsert);
	const newID = newRecipe?.id;

	if( recipe.image) {
		fs.mkdirSync(THUMBNAIL_DIRECTORY, { recursive: true });

		const newFileName = `download-${newID}.jpg`;
		const afterName = `recipeDownloaded-${newID}.jpg`;
		const filePath = path.join(THUMBNAIL_DIRECTORY, newFileName);
		const downloadedPath = await downloadImage(recipe.image, filePath);

		if( downloadedPath != null ) {
			await resizeThumbnail(null, newID, THUMBNAIL_DIRECTORY, newFileName, afterName, true);
		}
	}

	return newRecipe?.id;
};

const downloadImage = (url, filePath) => {
  return new Promise((resolve) => {
	let parsedUrl;
    try {
      parsedUrl = new URL(url); // will throw on invalid URL
    } catch (err) {
      console.log(`Invalid URL: ${url}`);
      resolve(null);
      return;
    }

    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        console.log(`Could not download image [${url}]. Status: ${res.statusCode}`);
        resolve(null);
        return;
      }

      const file = fs.createWriteStream(filePath);
      res.pipe(file);

      file.on("finish", () => {
        file.close(() => resolve(filePath));
      });

      file.on("error", (err) => {
        fs.unlink(filePath, () => resolve(null));
      });
    }).on("error", (err) => {
      console.log("HTTPS error:", err);
      resolve(null);
    });
  });
};

export const breakdownIngredient = (ingredient) => {

	let extractedAmount = 0;
	let extractedName = '';

	if (ingredient) {
		const matches = ingredient.match(INGREDIENT_REGEX);

		if (ingredient.indexOf('0') === 0) {
			extractedName = ingredient.substr(2).trim();
		} else if (!matches) {
			extractedName = ingredient?.trim();
		} else {
			extractedAmount = matches[1]?.trim();
			extractedName = matches[2]?.trim();
		}
	}

	return { extractedAmount, extractedName };
};
export const createIngredients = async (recipeID, recipe, tagCache) => {
	try {
		if( recipe.ingredients ) {
			for (const ingredient of recipe.ingredients) {
				if (ingredient) {
					let formattedIngredient = ingredient;

					// TODO: Remove unrelated words to create a record in ITEM table, which is used to aggregate the same ingredients and add them together
					// Phase 1 will just be listing the ingredients in the shopping list though
					const unrelatedWords = ['diced', 'crushed', 'chopped', 'finely', 'grated', 'beaten', 'sliced', 'freshly', 'ground'];
					formattedIngredient = formattedIngredient.replace('0.25', '1/4');
					formattedIngredient = formattedIngredient.replace('0.5', '1/2');
					formattedIngredient = formattedIngredient.replace('0.75', '3/4');
					formattedIngredient = formattedIngredient.replace('0.125', '1/8');
					formattedIngredient = formattedIngredient.replace('½', '1/2');
					formattedIngredient = formattedIngredient.replace('¼', '1/4');
					formattedIngredient = formattedIngredient.replace('¾', '3/4');
					formattedIngredient = formattedIngredient.replace('⅓', '1/3');
					formattedIngredient = formattedIngredient.replace('▢', '');

					const ingredientToInsert = {
						Name: formattedIngredient,
						recipeID,
					};

					if (tagCache) {
						const cachedTagID = tagCache[formattedIngredient];
						if (cachedTagID) {
							ingredientToInsert.IngredientTagID = cachedTagID;
						}
					}

					await insertIngredient(ingredientToInsert);

					console.log(`Insert ingredient with amount Name [${formattedIngredient}] for recipeID[${recipeID}]`);
				}
			}
		}
	} catch (e) {
		console.log('An error occurred while creating ingredients', e);
	}
};

export const createSteps = async (recipeID, recipe) => {
	try {
		const re = /([\d\/]+\s\w+)\s+(.*)/;

		for (const stepGroup of recipe.stepGroups) {
			if (stepGroup) {
				const cleanStep = stepGroup.steps.replaceAll("&nbsp;", "");
				await insertStepGroup({
					RecipeID: recipeID,
					Position: stepGroup.position,
					Header: stepGroup.header,
					Steps: cleanStep
				});
			}
		}
	} catch (e) {
		console.log('An error occurred creating steps', e);
	}
};
