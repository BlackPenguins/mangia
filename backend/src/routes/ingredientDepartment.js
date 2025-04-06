import express from 'express';
import { insertIngredientDepartment, selectAllIngredientDepartments, updateDepartment } from  '#root/database/ingredientDepartment.js';
import { checkAdminMiddleware } from './auth.js';

const getAllIngredientDepartmentsHandler = (req, res) => {
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

const addIngredientDepartmentHandler = (req, res) => {
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

const updateIngredientDepartmentHandler = (req, res) => {
	const ingredientDepartmentID = req.body.id;
	const position = req.body.position;
	const name = req.body.name;
	const color = req.body.color;

	const update = {};

	if (position) {
		update.Position = position;
	}

	if (color) {
		update.Color = color;
	}

	if (name) {
		update.Name = name;
	}

	console.log(`Updating Ingredient Department [${ingredientDepartmentID}]`, update);

	// We can pass an object as long as the properties of the object match the column names in the DB table
	const insertPromise = updateDepartment(ingredientDepartmentID, update);

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

router.get('/api/ingredientDepartments', getAllIngredientDepartmentsHandler);
router.patch('/api/ingredientDepartments', checkAdminMiddleware, updateIngredientDepartmentHandler);
router.put('/api/ingredientDepartments', checkAdminMiddleware, addIngredientDepartmentHandler);

export default router;
