import { match } from 'assert';
import { deleteIngredientsByRecipeID, insertIngredient } from '../database/ingredient.js';
import { deleteRecipe, insertRecipe, selectRecipeByName, updateRecipe } from '../database/recipes.js';
import { deleteStepsByRecipeID, insertStep } from '../database/step.js';
import { scrape } from '../scrapers/ScraperFactory.js';

export const importRecipe = async (url, currentRecipeID) => {
	const importResponse = {};

	const recipeObject = await scrape(url);

	console.log(`Importing recipe for URL [${url}] CurrentRecipeID[${currentRecipeID}]`);

	if (!recipeObject.success) {
		importResponse.success = false;
		importResponse.status = `Failed to parse recipe from the URL "${url}"`;
	} else {
		const recipeName = recipeObject.name;
		const ingredientsToAdd = recipeObject.ingredients;
		const stepsToAdd = recipeObject.steps;

		const recipeToAdd = {
			name: recipeObject.name,
			description: recipeObject.description,
		};

		if (!currentRecipeID) {
			const recipeExists = await selectRecipeByName(recipeName);

			if (recipeExists) {
				console.error(`Recipe with name [${recipeName}] already exists.`, recipeExists);
				importResponse.success = false;
				importResponse.status = `Recipe with name "${recipeName}" already exists.`;
				return importResponse;
			}
		}

		let recipeID = 0;

		try {
			if (currentRecipeID) {
				recipeID = currentRecipeID;
				console.log('Deleting previous ingredients for recipe.');
				await deleteIngredientsByRecipeID(recipeID);
				await deleteStepsByRecipeID(recipeID);
				console.log('Updating an existing recipe.', recipeToAdd);
				await updateRecipe(recipeToAdd, recipeID);
			} else {
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
			if (!currentRecipeID) {
				deleteIngredientsByRecipeID(recipeID);
				deleteStepsByRecipeID(recipeID);
				deleteRecipe(recipeID);
			}

			importResponse.success = false;
			importResponse.status = errorStack;
		}
	}

	return importResponse;
};

const createRecipe = async (recipe, url) => {
	console.log(`Insert recipe with name [${recipe.name}] and description [${recipe.description}]`);

	const recipeToInsert = {
		name: recipe.name,
		description: recipe.description,
		url,
	};

	const newRecipe = await insertRecipe(recipeToInsert);

	return newRecipe?.id;
};

export const breakdownIngredient = (ingredient) => {
	const dumbRe = /([\d\/]+\s\w+)\s+(.*)/;
	const smarterRe = /([\d\/\s]+\s(?:cup|teaspoon|tsp|tb|tablespoon|pound|ounce)?(?:s)?)(.*)/;

	let extractedAmount = 0;
	let extractedName = '';

	if (ingredient) {
		const matches = ingredient.match(smarterRe);

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
export const createIngredients = async (recipeID, recipe) => {
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

				const ingredientToInsert = {
					Name: formattedIngredient,
					recipeID,
				};

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
