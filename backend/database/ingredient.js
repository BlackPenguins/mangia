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

export const deleteIngredient = (ingredientID) => {
	return new Promise((resolve, reject) => {
		pool.query('DELETE FROM INGREDIENT WHERE IngredientID = ?', ingredientID, (error, result) => {
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
		pool.query(
			'SELECT i.Name, i.RecipeID, i.ItemID, i.IngredientID, it.name as TagName, it.IngredientTagID, id.Name as IngredientDepartment, id.Position as IngredientDepartmentPosition FROM INGREDIENT i LEFT JOIN INGREDIENT_TAG it ON i.IngredientTagID = it.IngredientTagID LEFT JOIN INGREDIENT_DEPARTMENT id on it.IngredientDepartmentID = id.IngredientDepartmentID WHERE RecipeID = ? ORDER BY i.IngredientID ASC',
			[recipeID],
			(error, result) => {
				if (error) {
					return reject(error.sqlMessage);
				} else {
					return resolve(result);
				}
			}
		);
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

export const updateIngredient = (updatedIngredient, ingredientID) => {
	return new Promise((resolve, reject) => {
		pool.query('UPDATE INGREDIENT SET ? WHERE IngredientID = ?', [updatedIngredient, ingredientID], (error) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve();
			}
		});
	});
};
