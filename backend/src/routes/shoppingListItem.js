import express from 'express';
import { selectByWeekID } from  '#root/database/menu.js';
import { deleteShoppingListItems, insertShoppingListItem, selectAllShoppingListItem, updateShoppingListItemAsChecked } from  '#root/database/shoppingListItem.js';
import { selectAllStores, selectPrices } from  '#root/database/store.js';
import { getOrInsertWeek } from  '#root/database/week.js';
import { checkAdminMiddleware } from './auth.js';
import { getMenuForWeekOffset } from './menu.js';
import { INGREDIENT_EXTRACT_REGEX } from '#root/scrapers/RecipeImporter.js';

const getShoppingListItemsHandler = async (req, res) => {
	const shoppingList = await getCurrentShoppingList();

	if (shoppingList) {
		res.status(200).json(shoppingList);
	} else {
		res.status(500).json({ message: 'Could not find shopping list.' });
	}
};

const getCurrentShoppingList = async () => {
	const { weekID } = await getOrInsertWeek(0);

	const shoppingListItems = await selectAllShoppingListItem(weekID);

	const ingredientsWithPrices = [];

	for (const shoppingListItem of shoppingListItems) {
		ingredientsWithPrices.push({
			amount: shoppingListItem.Amount,
			name: shoppingListItem.TagName,
			isChecked: shoppingListItem.IsChecked,
			recipeCount: shoppingListItem.RecipeCount,
			recipeNames: shoppingListItem.RecipeNames,
			isMissingUnits: shoppingListItem.IsMissingUnits,
			shoppingListItemID: shoppingListItem.ShoppingListItemID,
			ingredientTagID: shoppingListItem.IngredientTagID,
			department: shoppingListItem.Department,
			departmentPosition: shoppingListItem.DepartmentPosition,
			prices: await getPricesForStore(shoppingListItem.IngredientTagID),
		});
	}

	const storesFromDB = await selectAllStores();
	const stores = storesFromDB.map((s) => ({
		storeID: s.StoreID,
		storeName: s.Name,
	}));

	const departmentsWithIngredients = groupByDepartment(ingredientsWithPrices);

	const response = {
		stores,
		departments: departmentsWithIngredients,
	};

	return response;
};

export const getPricesForStore = async (ingredientTagID) => {
	const pricesForStoresFromDB = await selectPrices(ingredientTagID);

	let lowestPriceStoreID = null;
	let lowestPrice = null;
	let pricesForStores = [];

	for (const priceFromDB of pricesForStoresFromDB) {
		// No lowest yet, or a non-zero number less than the lowest
		if (priceFromDB.Price && (lowestPriceStoreID == null || priceFromDB.Price < lowestPrice)) {
			lowestPrice = priceFromDB.Price;
			lowestPriceStoreID = priceFromDB.StoreID;
		}

		pricesForStores.push({
			ingredientTagPriceID: priceFromDB.IngredientTagPriceID,
			storeID: priceFromDB.StoreID,
			price: priceFromDB.Price,
		});
	}

	let store = pricesForStores.find((p) => p.storeID == lowestPriceStoreID);

	if (store) {
		store.isLowest = true;
	}

	return pricesForStores;
};

function groupByDepartment(ingredients) {
	// Step 1: Group by department and collect ingredients
	const grouped = ingredients.reduce((departments, ingredient) => {
		const key = ingredient.department || 'Unknown';
		if (!departments[key]) {
			departments[key] = {
				department: key,
				position: ingredient.departmentPosition,
				ingredients: [],
			};
		}

		departments[key].ingredients.push(ingredient);
		return departments;
	}, {});

	// Step 2: Convert the grouped object to an array
	const result = Object.keys(grouped).map((department) => grouped[department]);

	// Step 3: Sort the result array by position
	result.sort((a, b) => {
		if (a.position === null) return 1;
		if (b.position === null) return -1;
		return a.position - b.position;
	});

	return result;
}

const updateCheckedHandler = (req, res) => {
	const shoppingListItemID = req.body.shoppingListItemID;
	const isChecked = req.body.isChecked;
	// We can pass an object as long as the properties of the object match the column names in the DB table
	const insertPromise = updateShoppingListItemAsChecked(shoppingListItemID, isChecked);

	insertPromise.then(
		async (result) => {
			const shoppingList = await getCurrentShoppingList();
			res.status(200).json({ success: true, shoppingList });
		},
		(error) => {
			res.status(500).json({ message: error });
		}
	);
};

const buildShoppingListHandler = async (req, res) => {
	console.log('Building shopping list.');
	const { weekID, startDate } = await getOrInsertWeek(0);

	// Wipe out the list first
	await deleteShoppingListItems(weekID);

	const menuDays = (await getMenuForWeekOffset(weekID, startDate)).days;

	// Build the new list with that week's items
	const recipes = menuDays.filter((m) => m.recipe && !m.isSkipped && !m.isLeftovers).map((m) => m.recipe);

	let ingredients = [];
	let ingredientTotals = [];

	if (recipes.length > 0) {
		ingredients = recipes
		.flatMap((r) => r.ingredients
			.map( i => ({
				...i,
				recipeName: r.Name
			}))
		);

		ingredientTotals = sumIngredients(ingredients);

		for (const ingredient of ingredientTotals) {
			const newShoppingListItem = {
				WeekID: weekID,
				Amount: ingredient.finalValue.trim(),
				IngredientTagID: ingredient.tagID,
				IsChecked: 0,
				RecipeCount: ingredient.recipeCount,
				IsMissingUnits: ingredient.isMissingUnits,
				RecipeNames: ingredient.recipeNames
			};
			await insertShoppingListItem(newShoppingListItem);
		}
	}

	res.status(200).json({ success: true, ingredientTotals });
};

const sumIngredients = (ingredients) => {
	const finalIngredients = [];

	for (const ingredient of ingredients) {
		if (ingredient.tagID != null) {
			const converted = convertToTeaspoons(ingredient.calculatedAmount);

			const foundTotalIndex = finalIngredients.findIndex((i) => i.name === ingredient.tagName && i.wholeUnits === converted.wholeUnits);

			console.log("INGERED", ingredient );
			if (foundTotalIndex === -1) {
				finalIngredients.push({
					name: ingredient.tagName,
					tagID: ingredient.tagID,
					value: converted.amount,
					wholeUnits: converted.wholeUnits,
					unit: converted.unit,
					isMissingUnits: converted.isMissingUnits,
					recipeCount: 1,
					ingredientDepartment: ingredient.ingredientDepartment,
					ingredientDepartmentPosition: ingredient.ingredientDepartmentPosition,
					recipeNames: ingredient.recipeName
				});
			} else {
				finalIngredients[foundTotalIndex].value += converted.amount;
				finalIngredients[foundTotalIndex].recipeCount++;
				finalIngredients[foundTotalIndex].recipeNames += `, ${ingredient.recipeName}`
			}
		}
	}

	// 1 TB =  3 TSP
	// 1/4 CUP = 12 TSP
	// 1/3 CUP = 16 TSP
	// 1/2 CUP = 24 TSP
	// 2/3 CUP = 32 TSP
	// 3/4 CUP = 36 TSP
	//   1 CUP = 48 TSP

	for (const finalIngredient of finalIngredients) {
		if (!finalIngredient.wholeUnits) {
			let convertedValue = '';
			let totalCups = '';
			let leftOverCups = '';
			let teaspoonAmount = finalIngredient.value;
			if (teaspoonAmount >= 48) {
				totalCups = Math.floor(teaspoonAmount / 48);
				leftOverCups = teaspoonAmount % 48;
				convertedValue = totalCups;
			} else {
				leftOverCups = teaspoonAmount;
			}

			if (leftOverCups > 0) {
				if (leftOverCups < 12) {
					if (totalCups > 0) {
						convertedValue += ' cups ';
					}

					if (leftOverCups < 2) {
						if (leftOverCups === 0.25) {
							leftOverCups = '1/4';
						} else if (leftOverCups === 0.5) {
							leftOverCups = '1/2';
						}

						convertedValue += ' ' + leftOverCups + ' teaspoon';
					} else {
						convertedValue += ' ' + Math.round(leftOverCups / 3) + ' tablespoon';
					}
				} else if (leftOverCups < 16) {
					convertedValue += ' 1/4 cup';
				} else if (leftOverCups < 24) {
					convertedValue += ' 1/3 cup';
				} else if (leftOverCups < 32) {
					convertedValue += ' 1/2 cup';
				} else if (leftOverCups < 36) {
					convertedValue += ' 2/3 cup';
				} else if (leftOverCups < 48) {
					convertedValue += ' 3/4 cup';
				}
			} else {
				convertedValue += ' cups';
			}

			finalIngredient.finalValue = convertedValue;
		} else {
			finalIngredient.finalValue = `${finalIngredient.value} ${finalIngredient.unit}`;
		}
	}

	return finalIngredients;
};

export const convertToTeaspoons = (value) => {
	if (!value) {
		return {
			unit: '',
			amount: 1,
			wholeUnits: true,
			isMissingUnits: true
		};
	}

	const matches = value.match(INGREDIENT_EXTRACT_REGEX);

	const amount = matches[1]?.trim();
	const measurement = matches[2]?.trim().toLowerCase();

	let baseTeaspoons = 0;

	let isWholeUnit = false;
	let unit = null;

	switch (measurement) {
		case 'cup':
			baseTeaspoons = 48;
			break;
		case 'tb':
		case 'tablespoon':
		case 'tbsp':
			baseTeaspoons = 3;
			break;
		case 'tsp':
		case 'teaspoon':
			baseTeaspoons = 1;
			break;
		case 'ounce':
		case 'oz':
			isWholeUnit = true;
			unit = 'ounce';
			break;
		case 'pound':
		case 'lb':
			isWholeUnit = true;
			unit = 'pound';
			break;
		default:
			isWholeUnit = true;
			unit = '';
	}

	let totalBaseMultiplier = 0;
	const splitAmounts = amount.split(' ');

	// If we have 1/4 - then  our multiplier is 0.25
	// If we have 1 1/4, then our multiplier is 1.25 (1 + 0.25)
	// If we have 2 1/4, then our multiplier is 2.25 (2 + 0.25)
	// We need to traverse each piece of the amount
	for (const splitAmount of splitAmounts) {
		totalBaseMultiplier += getMultiplier(splitAmount);
	}

	let convert;
	if (isWholeUnit) {
		convert = { isMissingUnits: false, wholeUnits: true, unit, amount: parseFloat(totalBaseMultiplier) };
	} else {
		convert = { isMissingUnits: false, wholeUnits: false, amount: parseFloat(baseTeaspoons * totalBaseMultiplier) };
	}

	console.log(`IncomingValue [${value}] Amount [${amount}] Measurement [${measurement}] TotalMultipler[${totalBaseMultiplier}] Final [${convert.amount}]`);

	return convert;
};

const getMultiplier = (amount) => {
	switch (amount) {
		case '1/2':
			return 0.5;
		case '1/4':
			return 0.25;
		case '1/3':
			return 0.33333333;
		case '2/3':
			return 0.66666666;
		case '1/8':
			return 0.125;
		case '3/4':
			return 0.75;
		default:
			return parseInt(amount);
	}
};

const router = express.Router();

router.get('/api/shoppingListItem', getShoppingListItemsHandler);
router.patch('/api/shoppingListItem/checked', checkAdminMiddleware, updateCheckedHandler);
router.post('/api/shoppingListItem/build', checkAdminMiddleware, buildShoppingListHandler);

export default router;
