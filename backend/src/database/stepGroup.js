import { getPool } from './utils.js';

const pool = getPool();

export const insertStepGroup = (newStepGroup) => {
	return new Promise((resolve, reject) => {
		pool.query('INSERT INTO STEP_GROUP SET ?', newStepGroup, (error, result) => {
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

export const updateStepGroup = (stepGroupID, recipeID) => {
	return new Promise((resolve, reject) => {
		pool.query(`UPDATE STEP Set StepGroupID = ? WHERE RecipeID = ?`, [stepGroupID, recipeID], (error) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve();
			}
		});
	});
};

export const selectStepGroupsByRecipeID = (recipeID) => {
	return new Promise((resolve, reject) => {
		pool.query('SELECT * FROM STEP_GROUP WHERE RecipeID = ? ORDER BY Position ASC', [recipeID], (error, result) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve(result);
			}
		});
	});
};

export const deleteStepGroupByRecipeID = (recipeID) => {
	return new Promise((resolve, reject) => {
		pool.query('DELETE FROM STEP_GROUP WHERE RecipeID = ?', [recipeID], (error, result) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve(result);
			}
		});
	});
};
