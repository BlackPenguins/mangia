import { getPool } from './utils.js';

const pool = getPool();

export const selectAllShoppingListExtra = () => {
	return new Promise((resolve, reject) => {
		pool.query('SELECT * FROM SHOPPING_LIST_EXTRA ORDER BY IsChecked ASC, ShoppingListExtraID DESC', (error, result) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve(result);
			}
		});
	});
};

export const insertShoppingListExtra = (newItem) => {
	return new Promise((resolve, reject) => {
		pool.query('INSERT INTO SHOPPING_LIST_EXTRA SET ?', newItem, (error, result) => {
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

export const updateShoppingListExtra = (shoppingListExtraID, update) => {
	return new Promise((resolve, reject) => {
		pool.query('UPDATE SHOPPING_LIST_EXTRA SET ? WHERE ShoppingListExtraID = ?', [update, shoppingListExtraID], (error) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve();
			}
		});
	});
};

export const updateShoppingListExtraAsChecked = (shoppingListExtraID, isChecked) => {
	const update = {
		IsChecked: isChecked ? 1 : 0,
	};

	return new Promise((resolve, reject) => {
		pool.query('UPDATE SHOPPING_LIST_EXTRA SET ? WHERE ShoppingListExtraID = ?', [update, shoppingListExtraID], (error, result) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve(result);
			}
		});
	});
};
