import { getPool } from './utils.js';

const pool = getPool();

export const selectAllIngredientDepartments = () => {
	return new Promise((resolve, reject) => {
		pool.query('SELECT * FROM INGREDIENT_DEPARTMENT ORDER BY Position ASC', (error, result) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve(result);
			}
		});
	});
};

export const insertIngredientDepartment = (newDepartment) => {
	return new Promise((resolve, reject) => {
		pool.query('INSERT INTO INGREDIENT_DEPARTMENT SET ?', newDepartment, (error, result) => {
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

export const updateDepartment = (tagID, update) => {
	return new Promise((resolve, reject) => {
		pool.query('UPDATE INGREDIENT_DEPARTMENT SET ? WHERE IngredientDepartmentID = ?', [update, tagID], (error) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve();
			}
		});
	});
};
