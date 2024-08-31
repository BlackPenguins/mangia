import express from 'express';
import { insertPrices, insertStore, selectAllStores, selectPrices, updatePrices, updateStore } from '../database/store.js';
import { checkAdminMiddleware } from './auth.js';

const getAllStoresHandler = (req, res) => {
	const selectPromise = selectAllStores();

	selectPromise.then(
		(result) => {
			res.status(200).json(result);
		},
		(error) => {
			res.status(500).json({ message: error });
		}
	);
};

const getPricesHandler = (req, res) => {
	const ingredientTagID = req.query.ingredientTagID;

	const selectPromise = selectPrices(ingredientTagID);

	selectPromise.then(
		(result) => {
			res.status(200).json(result);
		},
		(error) => {
			res.status(500).json({ message: error });
		}
	);
};

const addStoreHandler = (req, res) => {
	// We need a middleman object so the person using the API can't change whichever columns they want
	const newStore = {
		Name: req.body.name,
	};

	// We can pass an object as long as the properties of the object match the column names in the DB table
	const insertPromise = insertStore(newStore);

	insertPromise.then(
		(result) => {
			res.status(200).json({ success: true, result });
		},
		(error) => {
			res.status(500).json({ message: error });
		}
	);
};

const insertPriceHandler = (req, res) => {
	// We need a middleman object so the person using the API can't change whichever columns they want
	const newPrice = {
		StoreID: req.body.StoreID,
		IngredientTagID: req.body.IngredientTagID,
		Price: req.body.Price,
	};

	console.log('Insert Price', newPrice);
	// We can pass an object as long as the properties of the object match the column names in the DB table
	const insertPromise = insertPrices(newPrice);

	insertPromise.then(
		(result) => {
			console.log('RETUN', result);
			res.status(200).json({ success: true, ingredientTagPriceID: result.id });
		},
		(error) => {
			console.error(error);
			res.status(500).json({ success: false, message: error });
		}
	);
};

const updatePriceHandler = (req, res) => {
	console.log('Update Price', req.body.Price);

	// We can pass an object as long as the properties of the object match the column names in the DB table
	const insertPromise = updatePrices(req.body.IngredientTagPriceID, req.body.Price);

	insertPromise.then(
		(result) => {
			res.status(200).json({ success: true, result });
		},
		(error) => {
			res.status(500).json({ success: false, message: error });
		}
	);
};

const updateStoreHandler = (req, res) => {
	const storeID = req.body.id;
	const storeName = req.body.name;

	const update = {};

	if (storeName) {
		update.Name = storeName;
	}

	console.log(`Updating Store [${storeID}]`, update);

	// We can pass an object as long as the properties of the object match the column names in the DB table
	const insertPromise = updateStore(storeID, update);

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

router.get('/api/stores', getAllStoresHandler);
router.put('/api/stores/prices', [checkAdminMiddleware], insertPriceHandler);
router.patch('/api/stores/prices', [checkAdminMiddleware], updatePriceHandler);
router.patch('/api/stores/prices', [checkAdminMiddleware], updatePriceHandler);
router.get('/api/stores/prices', [checkAdminMiddleware], getPricesHandler);
router.put('/api/stores', [checkAdminMiddleware], addStoreHandler);
router.patch('/api/stores', [checkAdminMiddleware], updateStoreHandler);

export default router;
