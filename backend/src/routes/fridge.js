import express from 'express';
import { checkAdminMiddleware } from './auth.js';
import { deleteFridge, insertFridge, selectAllFridge } from  '#root/database/fridge.js';
import { selectIngredientTagByName } from  '#root/database/ingredientTags.js';

const getFridgeHandler = (req, res) => {
	const selectPromise = selectAllFridge();

	selectPromise.then(
		(result) => {
			res.status(200).json(result);
		},
		(error) => {
			res.status(500).json({ message: error });
		}
	);
};

const addToFridgeHandler = async (req, res) => {
	let tagID = req.body.id;


	console.log("Incoming add to fridge", req.body)
	// We can pass an object as long as the properties of the object match the column names in the DB table
	const insertPromise = insertFridge({ IngredientTagID: tagID });

	insertPromise.then(
		(result) => {
			res.status(200).json({ success: true, result });
		},
		(error) => {
			res.status(500).json({ message: error });
		}
	);
};

const deleteFromFridgeHandler = async (req, res) => {
	// We need a middleman object so the person using the API can't change whichever columns they want
	const fridgeID = req.params.fridgeID;

	// We can pass an object as long as the properties of the object match the column names in the DB table
	const deletePromise = deleteFridge(fridgeID);

	deletePromise.then(
		(result) => {
			res.status(200).json({ success: true, result });
		},
		(error) => {
			res.status(500).json({ message: error });
		}
	);
};

const router = express.Router();

router.get('/api/fridge', getFridgeHandler);
router.put('/api/fridge', checkAdminMiddleware, addToFridgeHandler);
router.delete('/api/fridge/:fridgeID', checkAdminMiddleware, deleteFromFridgeHandler);

export default router;
