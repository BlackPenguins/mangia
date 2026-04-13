import express from 'express';
import { insertIngredientAvailability } from '#root/database/ingredientAvailabilty.js';

const addIngredientAvailabiltyHandler = (req, res) => {
	// We need a middleman object so the person using the API can't change whichever columns they want
	const newIngredientAvailability = {
		StoreID: req.body.storeID,
		IngredientTagID: req.body.ingredientTagID,
		IsAvailable: req.body.isAvailable,
		Date: new Date()
	};

	// We can pass an object as long as the properties of the object match the column names in the DB table
	const insertPromise = insertIngredientAvailability(newIngredientAvailability);

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

router.put('/api/ingredientAvailability', addIngredientAvailabiltyHandler);

export default router;
