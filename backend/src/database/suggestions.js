import { getPool } from './utils.js';

const pool = getPool();

export const selectAllSuggestions = () => {
	return new Promise((resolve, reject) => {
		pool.query('SELECT * FROM SUGGESTIONS ORDER BY IsMade ASC, ExpirationDate ASC', (error, result) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve(result);
			}
		});
	});
};

export const selectTwoSuggestions = () => {
	const twoRandomExpiring = `SELECT *
		FROM SUGGESTIONS
		WHERE ExpirationDate <= CURDATE() + INTERVAL 14 DAY
		AND IsMade IS NULL
		ORDER BY RAND(NOW())`;

	const twoRandomNonExpiring = `SELECT *
		FROM SUGGESTIONS
		WHERE ExpirationDate > CURDATE() + INTERVAL 14 DAY
		AND IsMade IS NULL
		ORDER BY RAND(NOW())
		LIMIT 2`;

	const combinedQuery = `SELECT * FROM (
		(${twoRandomExpiring})
		UNION ALL
		(${twoRandomNonExpiring})
	  ) AS combined_results
	  LIMIT 2;`;

	return new Promise((resolve, reject) => {
		pool.query(combinedQuery, (error, result) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve(result);
			}
		});
	});
};

export const insertSuggestion = (newSuggestion) => {
	return new Promise((resolve, reject) => {
		pool.query('INSERT INTO SUGGESTIONS SET ?', newSuggestion, (error, result) => {
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

export const updateSuggestion = (suggestionID, update) => {
	return new Promise((resolve, reject) => {
		pool.query('UPDATE SUGGESTIONS SET ? WHERE SuggestionID = ?', [update, suggestionID], (error) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve();
			}
		});
	});
};
