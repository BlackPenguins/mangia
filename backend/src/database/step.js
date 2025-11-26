import { getPool } from './utils.js';

const pool = getPool();

export const insertStep = (newStep) => {
	return new Promise((resolve, reject) => {
		pool.query('INSERT INTO STEP SET ?', newStep, (error, result) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				const responseObject = {
					id: result.insertId,
				};

				return resolve(responseObject);
			}
		});
	});
};

export const selectStepsByRecipeID = (recipeID, stepGroupID) => {
	return new Promise((resolve, reject) => {
		pool.query('SELECT * FROM STEP WHERE RecipeID = ? AND StepGroupID = ? ORDER BY StepNumber ASC', [recipeID, stepGroupID], (error, result) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve(result);
			}
		});
	});
};

export const deleteStepsByRecipeID = (recipeID) => {
	return new Promise((resolve, reject) => {
		pool.query('DELETE FROM STEP WHERE RecipeID = ?', [recipeID], (error, result) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve(result);
			}
		});
	});
};
