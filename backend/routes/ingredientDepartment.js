import express from 'express';
import { insertIngredientDepartment, selectAllIngredientDepartments, updateDepartment } from '../database/ingredientDepartment.js';
import { checkAdminMiddleware } from './auth.js';

const getAllIngredientDepartments = (req, res) => {
	const selectPromise = selectAllIngredientDepartments();

	selectPromise.then(
		(result) => {
			res.status(200).json(result);
		},
		(error) => {
			res.status(500).json({ message: error });
		}
	);
};

const addIngredientDepartment = (req, res) => {
	// We need a middleman object so the person using the API can't change whichever columns they want
	const newIngredientDepartment = {
		name: req.body.name,
	};

	// We can pass an object as long as the properties of the object match the column names in the DB table
	const insertPromise = insertIngredientDepartment(newIngredientDepartment);

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
	const ingredientDepartmentID = req.body.IngredientDepartmentID;
	const position = req.body.Position;

	// We can pass an object as long as the properties of the object match the column names in the DB table
	const insertPromise = updateDepartment(ingredientDepartmentID, position);

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

router.get('/api/ingredientDepartments', getAllIngredientDepartments);
router.patch('/api/ingredientDepartments', checkAdminMiddleware, updateIngredientDepartment);
router.put('/api/ingredientDepartments', checkAdminMiddleware, addIngredientDepartment);

export default router;
