import { getPool } from './utils.js';

const pool = getPool();

export const insertIngredient = (newIngredient) => {
	return new Promise((resolve, reject) => {
		pool.query('INSERT INTO INGREDIENT SET ?', newIngredient, (error, result) => {
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

export const selectIngredientsByRecipeID = (recipeID) => {
	return new Promise((resolve, reject) => {
		pool.query('SELECT * FROM INGREDIENT WHERE RecipeID = ?', [recipeID], (error, result) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve(result);
			}
		});
	});
};

export const deleteIngredientsByRecipeID = (recipeID) => {
	return new Promise((resolve, reject) => {
		pool.query('DELETE FROM INGREDIENT WHERE RecipeID = ?', [recipeID], (error, result) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve(result);
			}
		});
	});
};
