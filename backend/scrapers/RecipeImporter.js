import { match } from 'assert';
import { deleteIngredientsByRecipeID, insertIngredient } from '../database/ingredient.js';
import { deleteRecipe, insertRecipe, selectRecipeByName } from '../database/recipes.js';
import { deleteStepsByRecipeID, insertStep } from '../database/step.js';
import { scrape } from '../scrapers/ScraperFactory.js';

export const importRecipe = async (url) => {
	const importResponse = {};

	const recipeObject = await scrape(url);

	if (!recipeObject.success) {
		importResponse.success = false;
		importResponse.status = `Failed to parse recipe from the URL "${url}"`;
	} else {
		const recipeName = recipeObject.name;

		const recipeExists = await selectRecipeByName(recipeName);

		if (recipeExists) {
			console.error(`Recipe with name [${recipeName}] already exists.`, recipeExists);
			importResponse.success = false;
			importResponse.status = `Recipe with name "${recipeName}" already exists.`;
		} else {
			let recipeID = 0;

			try {
				recipeID = await createRecipe(recipeObject, url);
				await createIngredients(recipeID, recipeObject);
				await createSteps(recipeID, recipeObject);

				importResponse.success = true;
				importResponse.recipeID = recipeID;
			} catch (e) {
				const errorStack = e.stack;
				console.error(`SOMETHING BAD HAPPENED DURING IMPORT OF RECIPE #${recipeID}\n${errorStack}`);

				// Cleanup the bad inserts
				deleteIngredientsByRecipeID(recipeID);
				deleteStepsByRecipeID(recipeID);
				deleteRecipe(recipeID);

				importResponse.success = false;
				importResponse.status = errorStack;
			}
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

export const createIngredients = async (recipeID, recipe) => {
	const re = /([\d\/]+\s\w+)\s+(.*)/;

	for (const ingredient of recipe.ingredients) {
		if (ingredient) {
			const matches = ingredient.match(re);

			let amount = 0;
			let rawName = '';

			if (ingredient.indexOf('0') === 0) {
				rawName = ingredient.substr(2);
			} else if (!matches) {
				rawName = ingredient;
			} else {
				amount = matches[1];
				rawName = matches[2];
			}

			// TODO: Remove unrelated words to create a record in ITEM table, which is used to aggregate the same ingredients and add them together
			// Phase 1 will just be listing the ingredients in the shopping list though
			const unrelatedWords = ['diced', 'crushed', 'finely', 'grated', 'beaten', 'sliced', 'freshly', 'ground'];
			const ingredientToInsert = {
				amount,
				rawName,
				recipeID,
			};

			await insertIngredient(ingredientToInsert);

			console.log(`Insert ingredient with amount [${amount}] and rawName [${rawName}] for recipeID[${recipeID}]`);
		}
	}
};

export const createSteps = async (recipeID, recipe) => {
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
};
