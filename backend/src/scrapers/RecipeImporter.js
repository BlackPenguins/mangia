import { deleteIngredientsByRecipeID, insertIngredient } from  '#root/database/ingredient.js';
import { deleteRecipe, insertImportFailureURL, insertRecipe, selectRecipeByName, updateRecipe } from  '#root/database/recipes.js';
import { deleteStepsByRecipeID, insertStep } from  '#root/database/step.js';
import { scrape } from '#root/scrapers/ScraperFactory.js';

export const INGREDIENT_REGEX = /([\d\/\s]+\s(?:cup|teaspoon|tablespoon|tbsp|pound|ounce|tsp|oz|lb|tb)?(?:s)?)(.*)/i;
export const INGREDIENT_EXTRACT_REGEX = /([\d\/\s]+)\s*(cup|teaspoon|tablespoon|tbsp|pound|ounce|tsp|oz|lb|tb)?(?:s)?/i;

export const importRecipe = async (url) => {
	const importResponse = {};

	let scrapeSuccess = false;

	try {
		const recipeObject = await scrape(url);
		scrapeSuccess = recipeObject.success;

		console.log(`Importing recipe for URL [${url}]`);

		if (!scrapeSuccess) {
			importResponse.success = false;
			importResponse.status = `Failed to parse recipe from the URL "${url}"`;
			await insertImportFailureURL(url);
		} else {
			const recipeName = recipeObject.name;

			const recipeToAdd = {
				name: recipeObject.name,
				description: recipeObject.description,
			};

			const recipeExists = await selectRecipeByName(recipeName);

			if (recipeExists) {
				console.error(`Recipe with name [${recipeName}] already exists.`);
				importResponse.success = false;
				importResponse.status = `Recipe with name "${recipeName}" already exists.`;
				return importResponse;
			}

			let recipeID = 0;

			try {
				recipeID = await createRecipe(recipeToAdd, url);
				console.log(`Created a new recipe with ID [${recipeID}].`);

				await createIngredients(recipeID, recipeObject);
				await createSteps(recipeID, recipeObject);

				importResponse.success = true;
				importResponse.recipeID = recipeID;
			} catch (e) {
				const errorStack = e.stack;
				console.error(`SOMETHING BAD HAPPENED DURING IMPORT OF RECIPE #${recipeID}`, e);

				// Cleanup the bad inserts
				if (!currentRecipeID) {
					deleteIngredientsByRecipeID(recipeID);
					deleteStepsByRecipeID(recipeID);
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

	return newRecipe?.id;
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
		for (const ingredient of recipe.ingredients) {
			if (ingredient) {
				let formattedIngredient = ingredient;

				// TODO: Remove unrelated words to create a record in ITEM table, which is used to aggregate the same ingredients and add them together
				// Phase 1 will just be listing the ingredients in the shopping list though
				const unrelatedWords = ['diced', 'crushed', 'finely', 'grated', 'beaten', 'sliced', 'freshly', 'ground'];
				formattedIngredient = formattedIngredient.replace('0.25', '1/4');
				formattedIngredient = formattedIngredient.replace('0.5', '1/2');
				formattedIngredient = formattedIngredient.replace('0.75', '3/4');
				formattedIngredient = formattedIngredient.replace('0.125', '1/8');
				formattedIngredient = formattedIngredient.replace('½', '1/2');
				formattedIngredient = formattedIngredient.replace('¼', '1/4');
				formattedIngredient = formattedIngredient.replace('⅓', '1/3');
				formattedIngredient = formattedIngredient.replace('⅓', '2/3');
				formattedIngredient = formattedIngredient.replace('⅓', '2/3');
				formattedIngredient = formattedIngredient.replace('⅓', '1/8');
				formattedIngredient = formattedIngredient.replace('⅓', '3/4');
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
	} catch (e) {
		console.log('An error occurred while creating ingredients', e);
	}
};

export const createSteps = async (recipeID, recipe) => {
	try {
		const re = /([\d\/]+\s\w+)\s+(.*)/;

		let stepNumber = 1;
		for (const step of recipe.steps) {
			if (step) {
				const ingredientToInsert = {
					stepNumber,
					instruction: step,
					recipeID,
				};

				await insertStep(ingredientToInsert);
				console.log(`Insert step [${stepNumber}] with instruction [${step}]`);
				stepNumber++;
			}
		}
	} catch (e) {
		console.log('An error occurred creating steps', e);
	}
};
