import express from 'express';
import { selectByWeekID } from  '#root/database/menu.js';
import { deleteShoppingListItems, insertShoppingListItem, selectAllShoppingListItem, updateShoppingListItemAsChecked } from  '#root/database/shoppingListItem.js';
import { selectAllStores, selectPrices } from  '#root/database/store.js';
import { getOrInsertWeek } from  '#root/database/week.js';
import { checkAdminMiddleware } from './auth.js';
import { getMenuForWeekOffset } from './menu.js';
import { getFractionForDisplay, getSummarizedIngredientQuantity, consolidateIngredients } from '#root/scrapers/RecipeImporter.js';
import { selectLatestByStore } from '#root/database/ingredientAvailabilty.js';

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
			availability: await getAvailability(shoppingListItem.IngredientTagID),
		});
	}

	const storesFromDB = await selectAllStores();
	const stores = storesFromDB.map((s) => ({
		storeID: s.StoreID,
		storeName: s.Name,
		storeColor: s.Color,
		storeColor2: s.Color2
	}));

	const departmentsWithIngredients = groupByDepartment(ingredientsWithPrices);

	const response = {
		stores,
		departments: departmentsWithIngredients,
	};

	return response;
};

export const getAvailability = async (ingredientTagID) => {
	const availabilityFromDB = await selectLatestByStore(ingredientTagID);

	// const result = availabilityFromDB.reduce((final, row) => {
	// 	const storeId = row.StoreID;
	// 	const count = row['COUNT(IsAvailable)'];

	// 	if (!final[storeId]) {
	// 		final[storeId] = {
	// 		countAvailable: 0,
	// 		countUnavailable: 0
	// 		};
	// 	}

	// 	if (row.IsAvailable === 1) {
	// 		final[storeId].countAvailable = count;
	// 	} else {
	// 		final[storeId].countUnavailable = count;
	// 	}

	// 	return final;
	// }, {});

	const result = availabilityFromDB.reduce((final, row) => {
		const storeId = row.StoreID;
		final[storeId] = { isAvailable: row.IsAvailable };

		return final;
	}, {});

	return result;
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
	const consolidatedIngredients = consolidateIngredients(ingredients);

	for (const ingredient of consolidatedIngredients) {
		ingredient.finalValue = getSummarizedIngredientQuantity(ingredient);
	}

	return consolidatedIngredients;
};


const router = express.Router();

router.get('/api/shoppingListItem', getShoppingListItemsHandler);
router.patch('/api/shoppingListItem/checked', checkAdminMiddleware, updateCheckedHandler);
router.post('/api/shoppingListItem/build', checkAdminMiddleware, buildShoppingListHandler);

export default router;
