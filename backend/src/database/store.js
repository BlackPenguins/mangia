import { getPool } from './utils.js';

const pool = getPool();

export const selectAllStores = () => {
	return new Promise((resolve, reject) => {
		pool.query('SELECT * FROM STORE', (error, result) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve(result);
			}
		});
	});
};

export const insertStore = (newStore) => {
	return new Promise((resolve, reject) => {
		pool.query('INSERT INTO STORE SET ?', newStore, (error, result) => {
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

export const selectPrices = (IngredientTagID) => {
	return new Promise((resolve, reject) => {
		pool.query('SELECT * FROM INGREDIENT_TAG_PRICE WHERE IngredientTagID = ?', IngredientTagID, (error, result) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve(result);
			}
		});
	});
};

export const insertPrices = (newPrice) => {
	return new Promise((resolve, reject) => {
		pool.query('INSERT INTO INGREDIENT_TAG_PRICE SET ?', newPrice, (error, result) => {
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

export const updatePrices = (ingredientTagPriceID, newPrice) => {
	const update = {
		Price: !newPrice ? 0.0 : newPrice,
	};

	return new Promise((resolve, reject) => {
		pool.query('UPDATE INGREDIENT_TAG_PRICE SET ? WHERE IngredientTagPriceID = ?', [update, ingredientTagPriceID], (error) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve();
			}
		});
	});
};

export const updateStore = (storeID, update) => {
	return new Promise((resolve, reject) => {
		pool.query('UPDATE STORE SET ? WHERE StoreID = ?', [update, storeID], (error) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve();
			}
		});
	});
};
