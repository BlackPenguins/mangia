import express from 'express';
import { checkAdminMiddleware } from './auth.js';
import { insertShoppingListExtra, selectAllShoppingListExtra, updateShoppingListExtra, updateShoppingListExtraAsChecked } from '../database/shoppingListExtra.js';
import { getOrInsertWeek } from '../database/week.js';

const router = express.Router();

const getShoppingListItemsHandler = async (req, res) => {
	const { weekID } = await getOrInsertWeek(0);

	const selectPromise = selectAllShoppingListExtra(weekID);

	selectPromise.then(
		(result) => {
			res.status(200).json({ success: true, result });
		},
		(error) => {
			res.status(500).json({ message: error });
		}
	);
};

const addShoppingListExtraHandler = async (req, res) => {
	const { weekID } = await getOrInsertWeek(0);

	// We need a middleman object so the person using the API can't change whichever columns they want
	const newItem = {
		Name: req.body.name,
		WeekID: weekID,
	};

	// We can pass an object as long as the properties of the object match the column names in the DB table
	const insertPromise = insertShoppingListExtra(newItem);

	insertPromise.then(
		(result) => {
			res.status(200).json({ success: true, result });
		},
		(error) => {
			res.status(500).json({ message: error });
		}
	);
};

const updateCheckedHandler = (req, res) => {
	const shoppingListExtraID = req.body.shoppingListExtraID;
	const isChecked = req.body.isChecked;

	// We can pass an object as long as the properties of the object match the column names in the DB table
	const insertPromise = updateShoppingListExtraAsChecked(shoppingListExtraID, isChecked);

	insertPromise.then(
		(result) => {
			res.status(200).json({ success: true, result });
		},
		(error) => {
			res.status(500).json({ message: error });
		}
	);
};

router.get('/api/shoppingListExtra', getShoppingListItemsHandler);
router.put('/api/shoppingListExtra', checkAdminMiddleware, addShoppingListExtraHandler);
router.patch('/api/shoppingListExtra/checked', checkAdminMiddleware, updateCheckedHandler);

export default router;
