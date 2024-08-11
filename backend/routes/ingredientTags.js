import express from 'express';
import { insertIngredientTag, selectAllIngredientTags, updateDepartment } from '../database/ingredientTags.js';
import { checkAdminMiddleware } from './auth.js';

const getAllIngredientTags = (req, res) => {
	const selectPromise = selectAllIngredientTags();

	selectPromise.then(
		(result) => {
			res.status(200).json(result);
		},
		(error) => {
			res.status(500).json({ message: error });
		}
	);
};

const addIngredientTag = (req, res) => {
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

const updateIngredientDepartment = (req, res) => {
	const ingredientTagID = req.body.IngredientTagID;
	const ingredientDepartmentID = req.body.IngredientDepartmentID;

	// We can pass an object as long as the properties of the object match the column names in the DB table
	const insertPromise = updateDepartment(ingredientDepartmentID, ingredientTagID);

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

router.get('/api/ingredientTags', getAllIngredientTags);
router.patch('/api/ingredientTags/department', checkAdminMiddleware, updateIngredientDepartment);
router.put('/api/ingredientTags', checkAdminMiddleware, addIngredientTag);

export default router;
