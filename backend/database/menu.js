import { getPool } from './utils.js';

const pool = getPool();

export const selectMenuByDay = (day) => {
	return new Promise((resolve, reject) => {
		pool.query('SELECT * FROM MENU_DAY WHERE Day = ?', [day], (error, result) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve(result);
			}
		});
	});
};

export const selectMenuByMenuID = (menuID) => {
	return new Promise((resolve, reject) => {
		pool.query('SELECT * FROM MENU_DAY WHERE MenuID = ?', [menuID], (error, result) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve(result);
			}
		});
	});
};

export const insertMenu = (day, recipeID, weekID, originalWeight, adjustedWeight, originalRanking, adjustedRanking, isAged, isNewArrival, totalRankings) => {
	return new Promise((resolve, reject) => {
		pool.query(
			'INSERT INTO MENU_DAY (Day, RecipeID, IsMade, IsSkipped, IsLeftovers, WeekID, OriginalWeight, AdjustedWeight, OriginalRanking, AdjustedRanking, IsAged, IsNewArrival, TotalRankings) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
			[day, recipeID, 0, 0, 0, weekID, originalWeight, adjustedWeight, originalRanking, adjustedRanking, isAged, isNewArrival, totalRankings],
			(error, result) => {
				if (error) {
					return reject(error.sqlMessage);
				} else {
					const responseObject = {
						id: result.insertId,
					};

					return resolve(responseObject);
				}
			}
		);
	});
};

export const updateMenu = (updatedMenu, menuID) => {
	return new Promise((resolve, reject) => {
		pool.query('UPDATE MENU_DAY SET ? WHERE MenuID = ?', [updatedMenu, menuID], (error) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve();
			}
		});
	});
};

export const deleteMenu = (menuID) => {
	return new Promise((resolve, reject) => {
		pool.query('DELETE FROM MENU_DAY WHERE MenuID = ?', [menuID], (error) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve();
			}
		});
	});
};

export const swapMenu = async (menuOne, menuTwo) => {
	const firstDateResult = await selectMenuByMenuID(menuOne);
	const firstDate = firstDateResult[0].Day;

	const secondDateResult = await selectMenuByMenuID(menuTwo);
	const secondDate = secondDateResult[0].Day;

	await updateMenu({ Day: secondDate }, menuOne);
	await updateMenu({ Day: firstDate }, menuTwo);
};

export const selectByRecipeID = (recipeID) => {
	return new Promise((resolve, reject) => {
		pool.query('SELECT * FROM MENU_DAY WHERE RecipeID = ? ORDER BY Day DESC LIMIT 10', [recipeID], (error, result) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve(result);
			}
		});
	});
};

export const deleteWithRecipeID = (recipeID) => {
	return new Promise((resolve, reject) => {
		pool.query('UPDATE MENU_DAY SET RecipeID = null WHERE RecipeID = ?', [recipeID], (error) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve();
			}
		});
	});
};

export const selectAllMenuDay = (day) => {
	return new Promise((resolve, reject) => {
		pool.query('SELECT * FROM MENU_DAY', (error, result) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve(result);
			}
		});
	});
};

export const selectByWeekID = (weekID) => {
	return new Promise((resolve, reject) => {
		pool.query('SELECT * FROM MENU_DAY WHERE WeekID = ? ORDER BY Day IS NULL, Day ASC', [weekID], (error, result) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve(result);
			}
		});
	});
};
