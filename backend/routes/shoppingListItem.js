import express from 'express';
import { deleteShoppingListItems, insertShoppingListItem, selectAllShoppingListItem, updateShoppingListItemAsChecked } from '../database/shoppingListItem.js';
import { selectAllStores, selectPrices } from '../database/store.js';
import { checkAdminMiddleware } from './auth.js';
import { getMenuForWeekOffset } from './menu.js';

const getCurrentWeekID = async () => {
	const data = await getMenuForWeekOffset(0);
	const menuDays = data.days;
	const firstMenuDay = menuDays[0];
	const weekID = firstMenuDay.weekID;

	return {
		weekID,
		menuDays,
	};
};
const getShoppingListItemsHandler = async (req, res) => {
	const { weekID } = await getCurrentWeekID();

	const shoppingListItems = selectAllShoppingListItem(weekID);

	shoppingListItems.then(
		async (result) => {
			const ingredientsWithPrices = [];

			for (const r of result) {
				const pricesForStoresFromDB = await selectPrices(r.IngredientTagID);

				let lowestPriceStoreID = null;
				let lowestPrice = null;
				let pricesForStores = [];

				for (const priceFromDB of pricesForStoresFromDB) {
					if (lowestPriceStoreID == null || priceFromDB.Price < lowestPrice) {
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

				ingredientsWithPrices.push({
					amount: r.Amount,
					name: r.TagName,
					isChecked: r.IsChecked,
					recipeCount: r.RecipeCount,
					shoppingListItemID: r.ShoppingListItemID,
					ingredientTagID: r.IngredientTagID,
					department: r.Department,
					departmentPosition: r.DepartmentPosition,
					prices: pricesForStores,
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

			res.status(200).json(response);
		},
		(error) => {
			res.status(500).json({ message: error });
		}
	);
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
		(result) => {
			res.status(200).json({ success: true, result });
		},
		(error) => {
			res.status(500).json({ message: error });
		}
	);
};

const buildShoppingListHandler = async (req, res) => {
	const { weekID, menuDays } = await getCurrentWeekID();

	// Wipe out the list first
	await deleteShoppingListItems(weekID);

	// Build the new list with that week's items
	const recipes = menuDays.filter((m) => m.recipe).map((m) => m.recipe);

	let ingredients = [];
	let ingredientTotals = [];

	if (recipes.length > 0) {
		ingredients = recipes.flatMap((r) => r.ingredients);

		ingredientTotals = sumIngredients(ingredients);

		for (const ingredient of ingredientTotals) {
			const newShoppingListItem = {
				WeekID: weekID,
				Amount: ingredient.finalValue.trim(),
				IngredientTagID: ingredient.tagID,
				IsChecked: 0,
				RecipeCount: ingredient.recipeCount,
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
			// It can be tracked
			if (ingredient.calculatedAmount) {
				const converted = convertToTeaspoons(ingredient.calculatedAmount);

				const foundTotalIndex = finalIngredients.findIndex((i) => i.name === ingredient.tagName && i.wholeUnits === converted.wholeUnits);

				if (foundTotalIndex === -1) {
					finalIngredients.push({
						name: ingredient.tagName,
						tagID: ingredient.tagID,
						value: converted.amount,
						wholeUnits: converted.wholeUnits,
						unit: converted.unit,
						recipeCount: 1,
						ingredientDepartment: ingredient.ingredientDepartment,
						ingredientDepartmentPosition: ingredient.ingredientDepartmentPosition,
					});
				} else {
					finalIngredients[foundTotalIndex].value += converted.amount;
					finalIngredients[foundTotalIndex].recipeCount++;
				}
			} else {
				console.log('NOT FOUND ', ingredient);
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

	// const testFinalIngredients = [
	// 	{
	// 		name: 'Egg',
	// 		value: 1,
	// 		wholeUnits: false,
	// 	},
	// 	{
	// 		name: 'Egg',
	// 		value: 3,
	// 		wholeUnits: false,
	// 	},
	// 	{
	// 		name: 'Egg',
	// 		value: 6,
	// 		wholeUnits: false,
	// 	},
	// 	{
	// 		name: 'Egg',
	// 		value: 7,
	// 		wholeUnits: false,
	// 	},
	// 	{
	// 		name: 'Egg',
	// 		value: 12,
	// 		wholeUnits: false,
	// 	},
	// 	{
	// 		name: 'Egg',
	// 		value: 16,
	// 		wholeUnits: false,
	// 	},
	// 	{
	// 		name: 'Egg',
	// 		value: 24,
	// 		wholeUnits: false,
	// 	},
	// 	{
	// 		name: 'Egg',
	// 		value: 32,
	// 		wholeUnits: false,
	// 	},
	// 	{
	// 		name: 'Egg',
	// 		value: 36,
	// 		wholeUnits: false,
	// 	},
	// 	{
	// 		name: 'Egg',
	// 		value: 48,
	// 		wholeUnits: false,
	// 	},
	// 	{
	// 		name: 'Egg',
	// 		value: 60,
	// 		wholeUnits: false,
	// 	},
	// 	{
	// 		name: 'Egg',
	// 		value: 64,
	// 		wholeUnits: false,
	// 	},
	// 	{
	// 		name: 'Egg',
	// 		value: 72,
	// 		wholeUnits: false,
	// 	},
	// 	{
	// 		name: 'Egg',
	// 		value: 80,
	// 		wholeUnits: false,
	// 	},
	// 	{
	// 		name: 'Egg',
	// 		value: 84,
	// 		wholeUnits: false,
	// 	},
	// 	{
	// 		name: 'Egg',
	// 		value: 96,
	// 		wholeUnits: false,
	// 	},
	// 	{
	// 		name: 'Egg',
	// 		value: 100,
	// 		wholeUnits: false,
	// 	},
	// 	{
	// 		name: 'Egg',
	// 		value: 712,
	// 		wholeUnits: false,
	// 	},
	// 	{
	// 		name: 'Egg',
	// 		value: 52,
	// 		wholeUnits: false,
	// 	},
	// ];

	for (const finalIngredient of finalIngredients) {
		if (!finalIngredient.wholeUnits) {
			let convertedValue = '';
			let totalCups = '';
			let leftOverCups = '';
			let teaspoonAmount = finalIngredient.value;
			if (teaspoonAmount >= 48) {
				totalCups = Math.round(teaspoonAmount / 48);
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
						convertedValue += ' ' + leftOverCups + ' tsp';
					} else {
						convertedValue += ' ' + Math.round(leftOverCups / 3) + ' tb';
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

		console.log(`---------------${finalIngredient.value} ====> ${finalIngredient.finalValue}`);
	}

	return finalIngredients;
};

const convertToTeaspoons = (value) => {
	if (!value) {
		return `UNCONVERTED`;
	}

	const smarterRe = /([\d\/\s]+)\s*(cup|teaspoon|tsp|tb|tablespoon|pound|ounce)?(?:s)?/;

	const matches = value.match(smarterRe);

	const amount = matches[1]?.trim();
	const measurement = matches[2]?.trim();

	console.log(`Amount [${amount}] Measurement [${measurement}]`);

	let baseTeaspoons = 0;
	let baseMultiplier = 0;

	let isWholeUnit = false;
	let unit = null;

	switch (measurement) {
		case 'cup':
			baseTeaspoons = 48;
			break;
		case 'tb':
		case 'tablespoon':
			baseTeaspoons = 3;
			break;
		case 'tsp':
		case 'teaspoon':
			baseTeaspoons = 1;
			break;
		case 'ounce':
			isWholeUnit = true;
			unit = 'ounce';
			break;
		case 'pound':
			isWholeUnit = true;
			unit = 'pound';
			break;
		default:
			isWholeUnit = true;
			unit = '';
	}

	switch (amount) {
		case '1/2':
			baseMultiplier = 0.5;
			break;
		case '1/4':
			baseMultiplier = 0.25;
			break;
		case '1/3':
			baseMultiplier = 0.33333333;
			break;
		case '2/3':
			baseMultiplier = 0.66666666;
			break;
		case '1/8':
			baseMultiplier = 0.125;
			break;
		case '3/4':
			baseMultiplier = 0.75;
			break;
		default:
			baseMultiplier = amount;
	}

	if (isWholeUnit) {
		return { wholeUnits: true, unit, amount: parseFloat(baseMultiplier) };
	} else {
		return { wholeUnits: false, amount: parseFloat(baseTeaspoons * baseMultiplier) };
	}
};

const router = express.Router();

router.get('/api/shoppingListItem', getShoppingListItemsHandler);
router.patch('/api/shoppingListItem/checked', checkAdminMiddleware, updateCheckedHandler);
router.post('/api/shoppingListItem/build', checkAdminMiddleware, buildShoppingListHandler);

export default router;
