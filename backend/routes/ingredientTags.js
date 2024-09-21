import express from 'express';
import { insertIngredientTag, selectAllIngredientTags, updateIngredientTag } from '../database/ingredientTags.js';
import { selectAllStores } from '../database/store.js';
import { checkAdminMiddleware } from './auth.js';
import { getPricesForStore } from './shoppingListItem.js';

const getAllIngredientTagsHandler = (req, res) => {
	const selectPromise = selectAllIngredientTags();

	selectPromise.then(
		async (result) => {
			const ingredientsWithPrices = [];

			for (const r of result) {
				ingredientsWithPrices.push({
					...r,
					prices: await getPricesForStore(r.IngredientTagID),
				});
			}

			const storesFromDB = await selectAllStores();
			const stores = storesFromDB.map((s) => ({
				storeID: s.StoreID,
				storeName: s.Name,
			}));

			const response = {
				stores,
				ingredientsWithPrices,
			};

			res.status(200).json(response);
		},
		(error) => {
			res.status(500).json({ message: error });
		}
	);
};

const addIngredientTagHandler = (req, res) => {
	// We need a middleman object so the person using the API can't change whichever columns they want
	const newIngredientTag = {
		name: req.body.name,
	};

	// We can pass an object as long as the properties of the object match the column names in the DB table
	const insertPromise = insertIngredientTag(newIngredientTag);

	insertPromise.then(
		(result) => {
			res.status(200).json({ success: true, result });
		},
		(error) => {
			res.status(500).json({ message: error });
		}
	);
};

const updateIngredientHandler = (req, res) => {
	const ingredientTagID = req.body.id;
	const ingredientDepartmentID = req.body.departmentID;
	const ingredientTagName = req.body.name;

	const update = {};

	if (ingredientDepartmentID) {
		update.IngredientDepartmentID = ingredientDepartmentID;
	}

	if (ingredientTagName) {
		update.Name = ingredientTagName;
	}

	console.log(`Updating Ingredient Tag [${ingredientTagID}]`, update);

	// We can pass an object as long as the properties of the object match the column names in the DB table
	const insertPromise = updateIngredientTag(ingredientTagID, update);

	insertPromise.then(
		(result) => {
			res.status(200).json({ success: true, result });
		},
		(error) => {
			res.status(500).json({ message: error });
		}
	);
};

const router = express.Router();

router.get('/api/ingredientTags', getAllIngredientTagsHandler);
router.patch('/api/ingredientTags', checkAdminMiddleware, updateIngredientHandler);
router.put('/api/ingredientTags', checkAdminMiddleware, addIngredientTagHandler);

export default router;
