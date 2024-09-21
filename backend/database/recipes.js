import { getPool } from './utils.js';

const pool = getPool();

export const selectAllRecipes = (excludedRecipeIDs = [0]) => {
	return new Promise((resolve, reject) => {
		pool.query('SELECT * FROM recipe WHERE RecipeID NOT IN (?) ORDER BY Name ASC', [excludedRecipeIDs], (error, result) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve(result);
			}
		});
	});
};

export const selectRecipeByID = (recipeID) => {
	return new Promise((resolve, reject) => {
		pool.query('SELECT * FROM RECIPE WHERE RecipeID = ?', [recipeID], (error, result) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve((result.length > 0 && result[0]) || null);
			}
		});
	});
};

export const selectRecipeByName = (recipeName) => {
	return new Promise((resolve, reject) => {
		pool.query('SELECT * FROM RECIPE WHERE Name = ?', [recipeName], (error, result) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve((result.length > 0 && result[0]) || null);
			}
		});
	});
};

export const insertRecipe = (newRecipe) => {
	return new Promise((resolve, reject) => {
		pool.query('INSERT INTO RECIPE SET ?', newRecipe, (error, result) => {
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

export const updateRecipe = (updatedRecipe, recipeID) => {
	return new Promise((resolve, reject) => {
		pool.query('UPDATE RECIPE SET ? WHERE RecipeID = ?', [updatedRecipe, recipeID], (error) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve();
			}
		});
	});
};

export const deleteRecipe = (recipeID) => {
	return new Promise((resolve, reject) => {
		pool.query('DELETE FROM RECIPE WHERE RecipeID = ?', [recipeID], (error) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve();
			}
		});
	});
};

export const addTag = (recipeID, tagID) => {
	const newInsert = {
		RecipeID: recipeID,
		TagID: tagID,
	};
	return new Promise((resolve, reject) => {
		pool.query('INSERT INTO RECIPE_TAG SET ?', newInsert, (error, result) => {
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

export const deleteTag = (recipeID, tagID) => {
	return new Promise((resolve, reject) => {
		pool.query('DELETE FROM RECIPE_TAG WHERE RecipeID = ? AND TagID = ?', [recipeID, tagID], (error, result) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve();
			}
		});
	});
};

export const selectTags = (recipeID) => {
	return new Promise((resolve, reject) => {
		pool.query('SELECT t.* FROM RECIPE_TAG rt JOIN TAG t ON rt.TagID = t.TagID where RecipeID = ?', [recipeID], (error, result) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve(result);
			}
		});
	});
};

export const insertImportFailureURL = (url) => {
	const insert = {
		Date: new Date(),
		URL: url,
	};

	return new Promise((resolve, reject) => {
		pool.query('INSERT INTO IMPORT_FAILURE_URL SET ?', [insert], (error, result) => {
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

export const selectimportFailureURLs = () => {
	return new Promise((resolve, reject) => {
		pool.query('SELECT * FROM IMPORT_FAILURE_URL', (error, result) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve(result);
			}
		});
	});
};
