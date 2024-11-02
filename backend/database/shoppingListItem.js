import { getPool } from './utils.js';

const pool = getPool();

export const selectAllShoppingListItem = (weekID) => {
	return new Promise((resolve, reject) => {
		pool.query(
			'SELECT s.IngredientTagID, s.ShoppingListItemID, s.Amount, s.IsChecked, s.RecipeCount, t.Name as TagName, d.Name as Department, d.Position as DepartmentPosition FROM SHOPPING_LIST_ITEM s LEFT JOIN INGREDIENT_TAG t ON s.IngredientTagID = t.IngredientTagID LEFT JOIN INGREDIENT_DEPARTMENT d on t.IngredientDepartmentID = d.IngredientDepartmentID WHERE WeekID = ?',
			[weekID],
			(error, result) => {
				if (error) {
					return reject(error.sqlMessage);
				} else {
					return resolve(result);
				}
			}
		);
	});
};

export const deleteIngredientTagFromShoppingList = (ingredientTagID) => {
	return new Promise((resolve, reject) => {
		pool.query('DELETE FROM SHOPPING_LIST_ITEM WHERE IngredientTagID =  ?', [ingredientTagID], (error, result) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve(result);
			}
		});
	});
};

export const deleteShoppingListItems = (weekID) => {
	console.log('DELETETING FROM WEEK ' + weekID);
	return new Promise((resolve, reject) => {
		pool.query('DELETE FROM SHOPPING_LIST_ITEM WHERE WeekID = ?', [weekID], (error, result) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve(result);
			}
		});
	});
};

export const insertShoppingListItem = (newShoppingListItem) => {
	return new Promise((resolve, reject) => {
		pool.query('INSERT INTO SHOPPING_LIST_ITEM SET ?', newShoppingListItem, (error, result) => {
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

export const updateShoppingListItemAsChecked = (shoppingListItemID, isChecked) => {
	const update = {
		IsChecked: isChecked ? 1 : 0,
	};

	return new Promise((resolve, reject) => {
		pool.query('UPDATE SHOPPING_LIST_ITEM SET ? WHERE ShoppingListItemID = ?', [update, shoppingListItemID], (error, result) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve(result);
			}
		});
	});
};
