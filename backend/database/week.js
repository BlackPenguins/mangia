import { getPool } from './utils.js';

const pool = getPool();

export const insertWeek = () => {
	const newWeek = {
		WeekID: null,
	};
	return new Promise((resolve, reject) => {
		pool.query('INSERT INTO WEEK (WeekID) VALUES (null)', (error, result) => {
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
