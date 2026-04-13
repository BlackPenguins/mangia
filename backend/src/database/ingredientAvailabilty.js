import { getPool } from './utils.js';

const pool = getPool();

export const selectByGroup = (ingredientTagID) => {
	return new Promise((resolve, reject) => {
		pool.query(`SELECT StoreID, IsAvailable, COUNT(IsAvailable) FROM INGREDIENT_AVAILABILITY WHERE IngredientTagID = ? GROUP BY StoreID, IsAvailable`,[ingredientTagID], (error, result) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve(result);
			}
		});
	});
};

export const selectLatestByStore = (ingredientTagID) => {
	return new Promise((resolve, reject) => {
		pool.query(`SELECT t.* FROM INGREDIENT_AVAILABILITY t
			JOIN (SELECT StoreID, IngredientTagID, MAX(IngredientAvailabilityID) as MaxID FROM INGREDIENT_AVAILABILITY WHERE IngredientTagID = ? GROUP BY StoreID)
			latest ON t.StoreID = latest.StoreID AND t.IngredientTagID = latest.IngredientTagID AND t.IngredientAvailabilityID = latest.MaxID`, [ingredientTagID], (error, result) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve(result);
			}
		});
	});
};

export const insertIngredientAvailability = (newAvailability) => {
	return new Promise((resolve, reject) => {
		pool.query('INSERT INTO INGREDIENT_AVAILABILITY SET ?', newAvailability, (error, result) => {
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
