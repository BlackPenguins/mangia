import { getPool } from './utils.js';

const pool = getPool();

export const selectAllThumbnails = (recipeID) => {
	return new Promise((resolve, reject) => {
		pool.query('SELECT ThumbnailID, FileName FROM THUMBNAILS WHERE RecipeID = ?', [recipeID], (error, result) => {
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

export const insertThumbnail = (recipeID, filename) => {
	const newThumbnail = {
		RecipeID: recipeID,
		FileName: filename,
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
