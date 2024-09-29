import { checkAdminMiddleware } from './auth.js';
import express from 'express';
import { selectAllRecipes } from '../database/recipes.js';
import { resizeThumbnail, THUMBNAIL_DIRECTORY } from './recipes.js';
import fs from 'fs';
import { simpleDBQuery } from './setup.js';
import { selectAllMenuDay } from '../database/menu.js';
import { getWeekRange } from './menu.js';
import { getPool } from '../database/utils.js';

const router = express.Router();

const migrationHandler = async (req, res) => {
	const pool = getPool();

	let migrationKeyword = req.body.migrationKeyword;
	console.log('MIGRATION FOUND', migrationKeyword);

	switch (migrationKeyword) {
		case 'resizeImages':
			const recipes = await selectAllRecipes();

			fs.mkdir(THUMBNAIL_DIRECTORY, async (err) => {
				if (err) {
					console.error('Failed to create directiory', err);
				}

				for (const recipe of recipes) {
					if (recipe.Image == null) {
						console.log(`Skipping Recipe [${recipe.RecipeID}] with no thumbnail`);
					} else {
						const beforeImageFileName = recipe.Image;

						if (fs.existsSync(`./images/thumbs/${beforeImageFileName}`)) {
							const originalFileExt = beforeImageFileName.substring(beforeImageFileName.lastIndexOf('.'));
							const afterImageFileName = `recipe_${recipe.RecipeID}${originalFileExt}`;

							console.log(`Resizing Recipe [${recipe.RecipeID}] from [${beforeImageFileName}] to [${afterImageFileName}]`);

							await resizeThumbnail(recipe.RecipeID, './images/thumbs', beforeImageFileName, afterImageFileName);
						} else {
							console.log(`Skipping Recipe [${recipe.RecipeID}] with no thumbnail file found.`);
						}
					}
				}
				res.status(200).json({ success: true });
			});
			break;
		case 'createStore':
			await simpleDBQuery('Create Store', 'CREATE TABLE STORE (StoreID INT AUTO_INCREMENT PRIMARY KEY, Name VarChar(50) NOT NULL)', res);
			await simpleDBQuery(
				'Create Store',
				'CREATE TABLE INGREDIENT_TAG_PRICE (IngredientTagPriceID INT AUTO_INCREMENT PRIMARY KEY, StoreID INT NOT NULL, IngredientTagID INT NOT NULL, Price FLOAT NOT NULL, FOREIGN KEY (StoreID) REFERENCES STORE(StoreID), FOREIGN KEY (IngredientTagID) REFERENCES INGREDIENT_TAG(IngredientTagID))',
				res
			);
			break;
		case 'importFail':
			await simpleDBQuery(
				'Create ImportFailureURL',
				'CREATE TABLE IMPORT_FAILURE_URL (ImportFailureURLID INT AUTO_INCREMENT PRIMARY KEY, URL VarChar(2000) NOT NULL, Date Date)',
				res
			);
			break;
		case 'addDailyNotes':
			await simpleDBQuery('Add Column', 'ALTER TABLE MENU_DAY ADD COLUMN DailyNotes VARCHAR(300)', res);
			break;
		case 'addPrepTime':
			await simpleDBQuery('Add Column', 'ALTER TABLE RECIPE ADD COLUMN PrepTime VARCHAR(15)', res);
			break;
		case 'addPreheat':
			await simpleDBQuery('Add Column', 'ALTER TABLE RECIPE ADD COLUMN Preheat INT', res);
			break;
		case 'updateWeek':
			await simpleDBQuery('Add Column', 'ALTER TABLE WEEK ADD COLUMN StartDate DATE', res);
			await simpleDBQuery('Add Column', 'ALTER TABLE WEEK ADD COLUMN EndDate DATE', res);
			break;
		case 'setWeekIDForAllMenuDays':
			await setWeekIDForAllMenuDays(pool);
			break;
		case 'addPreviousLastMade':
			await simpleDBQuery('Add Column', 'ALTER TABLE RECIPE ADD COLUMN PreviousLastMade Date', res);
			break;
		default:
			console.error('Migration not found!');
			res.status(200).json({ success: false });
	}

	res.status(200).json({ success: true });
};

const setWeekIDForAllMenuDays = async (pool) => {
	const menuDays = await selectAllMenuDay();

	for (const menuDay of menuDays) {
		const date = new Date(menuDay.Day);
		const { startDate, endDate } = getWeekRange(date);
		let weekID = await selectWeekByDateRange(pool, startDate, endDate);
		console.log('MENU_DAY', { ID: menuDay.MenuID, Day: menuDay.Day, startDate, endDate, weekID });

		if (weekID == null) {
			weekID = await insertWeek(pool, startDate, endDate);
			console.log('NEW WEEK', weekID);
		}

		await updateMenu(pool, menuDay.MenuID, weekID);
	}
};

const selectWeekByDateRange = (pool, startDate, endDate) => {
	return new Promise((resolve, reject) => {
		pool.query('SELECT * FROM WEEK WHERE StartDate = ? && EndDate = ?', [startDate, endDate], (error, result) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve((result.length > 0 && result[0].WeekID) || null);
			}
		});
	});
};

const insertWeek = (pool, startDate, endDate) => {
	const newWeekRange = {
		StartDate: startDate,
		EndDate: endDate,
	};

	return new Promise((resolve, reject) => {
		pool.query('INSERT INTO WEEK SET ?', newWeekRange, (error, result) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve(result.insertId);
			}
		});
	});
};

export const updateMenu = (pool, menuDayID, weekID) => {
	const updatedMenu = {
		WeekID: weekID,
	};
	return new Promise((resolve, reject) => {
		pool.query('UPDATE MENU_DAY SET ? WHERE MenuID = ?', [updatedMenu, menuDayID], (error) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve();
			}
		});
	});
};

router.post('/api/migration', [checkAdminMiddleware], migrationHandler);

export default router;
