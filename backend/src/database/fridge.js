import { getPool } from './utils.js';

const pool = getPool();

export const selectAllFridge = () => {
	return new Promise((resolve, reject) => {
		pool.query('SELECT f.FridgeID, t.IngredientTagID, t.Name as IngredientName, d.Color as DeptColor, d.Name as DeptName FROM FRIDGE f JOIN INGREDIENT_TAG t on f.IngredientTagID = t.IngredientTagID LEFT JOIN INGREDIENT_DEPARTMENT d on t.IngredientDepartmentID = d.IngredientDepartmentID ORDER BY d.Position, t.Name', (error, result) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve(result);
			}
		});
	});
};

export const insertFridge = (newTag) => {
	console.log("NEW FRIDGE", newTag)
	return new Promise((resolve, reject) => {
		pool.query('INSERT INTO FRIDGE SET ?', newTag, (error, result) => {
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

export const deleteFridge = (fridgeID) => {
	return new Promise((resolve, reject) => {
		pool.query('DELETE FROM FRIDGE WHERE FridgeID = ?', fridgeID, (error, result) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve(result);
			}
		});
	});
};