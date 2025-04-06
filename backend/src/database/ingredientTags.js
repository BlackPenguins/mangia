import { getPool } from './utils.js';

const pool = getPool();

export const selectAllIngredientTags = () => {
	return new Promise((resolve, reject) => {
		pool.query('SELECT * FROM INGREDIENT_TAG ORDER BY CASE WHEN IngredientDepartmentID IS NULL THEN 0 ELSE 1 END, Name ASC', (error, result) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve(result);
			}
		});
	});
};

export const selectIngredientTagByName = (tagName) => {
	return new Promise((resolve, reject) => {
		pool.query('SELECT * FROM INGREDIENT_TAG where Name = ?', [tagName], (error, result) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve(result);
			}
		});
	});
};

export const selectIngredientTagsByRecipeID = (recipeID) => {
	return new Promise((resolve, reject) => {
		pool.query('SELECT i.IngredientTagID FROM INGREDIENT i where RecipeID = ?', [recipeID], (error, result) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve(result);
			}
		});
	});
};

export const insertIngredientTag = (newTag) => {
	return new Promise((resolve, reject) => {
		pool.query('INSERT INTO INGREDIENT_TAG SET ?', newTag, (error, result) => {
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

export const deleteIngredientTag = (ingredientTagID) => {
	return new Promise((resolve, reject) => {
		pool.query('DELETE FROM INGREDIENT_TAG WHERE IngredientTagID =  ?', [ingredientTagID], (error, result) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve(result);
			}
		});
	});
};

export const deleteIngredientTagPrice = (ingredientTagID) => {
	return new Promise((resolve, reject) => {
		pool.query('DELETE FROM INGREDIENT_TAG_PRICE WHERE IngredientTagID =  ?', [ingredientTagID], (error, result) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve(result);
			}
		});
	});
};

export const updateIngredientTag = (tagID, update) => {
	return new Promise((resolve, reject) => {
		pool.query('UPDATE INGREDIENT_TAG SET ? WHERE IngredientTagID = ?', [update, tagID], (error) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve();
			}
		});
	});
};
