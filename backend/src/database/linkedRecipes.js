import { getPool } from './utils.js';

const pool = getPool();

export const selectAllLinks = (recipeID) => {
	return new Promise((resolve, reject) => {
		pool.query('SELECT * FROM LINKED_RECIPES WHERE Recipe1ID = ? OR Recipe2ID = ?', [recipeID, recipeID], (error, result) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve(result);
			}
		});
	});
};

export const insertLink = (Recipe1ID, Recipe2ID) => {
	const newLink = {
		Recipe1ID,
		Recipe2ID,
	}
	return new Promise((resolve, reject) => {
		pool.query('INSERT INTO LINKED_RECIPES SET ?', newLink, (error, result) => {
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

export const deleteLink = (Recipe1ID, Recipe2ID) => {
	return new Promise((resolve, reject) => {
		pool.query('DELETE FROM LINKED_RECIPES WHERE (Recipe1ID = ? AND Recipe2ID = ?) OR (Recipe2ID = ? AND Recipe1ID = ?)', [Recipe1ID, Recipe2ID, Recipe1ID, Recipe2ID], (error, result) => {
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