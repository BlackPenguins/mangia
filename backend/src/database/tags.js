import { getPool } from './utils.js';

const pool = getPool();

export const selectAllTags = () => {
	return new Promise((resolve, reject) => {
		pool.query('SELECT * FROM TAG ORDER BY Name ASC', (error, result) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve(result);
			}
		});
	});
};

export const selectTagByName = (tagName) => {
	return new Promise((resolve, reject) => {
		pool.query('SELECT * FROM TAG where Name = ?', [tagName], (error, result) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve(result);
			}
		});
	});
};

export const insertTag = (newTag) => {
	return new Promise((resolve, reject) => {
		pool.query('INSERT INTO TAG SET ?', newTag, (error, result) => {
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
