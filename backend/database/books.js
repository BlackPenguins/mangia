import { getPool } from './utils.js';

const pool = getPool();

export const selectBookByID = (bookID) => {
	return new Promise((resolve, reject) => {
		pool.query('SELECT * FROM BOOK WHERE BookID = ?', [bookID], (error, result) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve((result.length > 0 && result[0]) || null);
			}
		});
	});
};

export const selectAllBooks = (newBook) => {
	return new Promise((resolve, reject) => {
		pool.query('SELECT * FROM BOOK', (error, result) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve(result);
			}
		});
	});
};

export const insertBook = (newBook) => {
	return new Promise((resolve, reject) => {
		pool.query('INSERT INTO BOOK SET ?', newBook, (error, result) => {
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
