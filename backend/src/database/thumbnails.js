import { getPool } from './utils.js';

const pool = getPool();

export const selectAllThumbnails = (recipeID) => {
	return new Promise((resolve, reject) => {
		pool.query('SELECT ThumbnailID, FileName, IsPrimary FROM THUMBNAILS WHERE RecipeID = ?', [recipeID], (error, result) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve(result);
			}
		});
	});
};

export const deletePrimaryThumbnail = (recipeID) => {
	return new Promise((resolve, reject) => {
		pool.query('DELETE FROM THUMBNAILS WHERE RecipeID = ? AND IsPrimary = 1', [recipeID], (error, result) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve(result);
			}
		});
	});
};

export const deleteThumbnail = (thumbnailID) => {
	return new Promise((resolve, reject) => {
		pool.query('DELETE FROM THUMBNAILS WHERE ThumbnailID = ?', [thumbnailID], (error, result) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve(result);
			}
		});
	});
};

export const insertThumbnail = (recipeID, filename, isPrimary) => {
	const newThumbnail = {
		RecipeID: recipeID,
		FileName: filename,
		IsPrimary: (isPrimary === "true" || isPrimary ===  true || isPrimary == 1) ? 1 : 0
	};

	return new Promise((resolve, reject) => {
		pool.query('INSERT INTO THUMBNAILS SET ?', newThumbnail, (error, result) => {
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

export const deleteThumbnailsForRecipe = (recipeID) => {
	return new Promise((resolve, reject) => {
		pool.query('DELETE FROM THUMBNAILS WHERE RecipeID = ?', [recipeID], (error, result) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve(result);
			}
		});
	});
};
