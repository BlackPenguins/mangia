import { checkAdminMiddleware } from './auth.js';
import express from 'express';
import { selectAllRecipes } from '../database/recipes.js';
import { resizeThumbnail, THUMBNAIL_DIRECTORY } from './recipes.js';
import fs from 'fs';
import { simpleDBQuery } from './setup.js';
import { selectAllMenuDay } from '../database/menu.js';
import { getWeekRange } from './menu.js';
import { getPool } from '../database/utils.js';
import { insertThumbnail } from '../database/thumbnails.js';
import { selectIngredientsByRecipeID, updateIngredient } from '../database/ingredient.js';
import { breakdownIngredient } from '../scrapers/RecipeImporter.js';
import { convertToTeaspoons } from './shoppingListItem.js';

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
		case 'addShoppingListExtra':
			await simpleDBQuery(
				'Create SHOPPING_LIST_EXTRA',
				'CREATE TABLE SHOPPING_LIST_EXTRA (ShoppingListExtraID INT AUTO_INCREMENT PRIMARY KEY, WeekID INT NOT NULL, Name VARCHAR(500), IsChecked TINYINT, FOREIGN KEY (WeekID) REFERENCES WEEK(WeekID))',
				res
			);
			break;
		case 'nullDayForMenus':
			await simpleDBQuery('Null Day', 'alter table menu_day modify column Day date null;', res);
			break;
		case 'addThumbnails':
			await simpleDBQuery(
				'Create THUMBNAILS',
				'CREATE TABLE THUMBNAILS (ThumbnailID INT AUTO_INCREMENT PRIMARY KEY, RecipeID INT NOT NULL, FileName VARCHAR(200), FOREIGN KEY (RecipeID) REFERENCES RECIPE(RecipeID))',
				res
			);
			break;
		case 'moveThumbnails':
			const allRecipes = await selectAllRecipes();

			for (const recipe of allRecipes) {
				const image = recipe.Image;
				const id = recipe.RecipeID;

				if (image) {
					await insertThumbnail(id, image);
					console.log('Moving thumbnail', { id, image });
				}
			}
			break;
		case 'addNewArrival':
			await simpleDBQuery('Add Column', 'ALTER TABLE RECIPE ADD COLUMN IsNewArrival TINYINT', res);
			break;
		case 'addAuditColumns':
			await simpleDBQuery('Add Audit Column', 'ALTER TABLE MENU_DAY ADD COLUMN OriginalWeight DOUBLE', res);
			await simpleDBQuery('Add Audit Column', 'ALTER TABLE MENU_DAY ADD COLUMN AdjustedWeight DOUBLE', res);
			await simpleDBQuery('Add Audit Column', 'ALTER TABLE MENU_DAY ADD COLUMN OriginalRanking INT', res);
			await simpleDBQuery('Add Audit Column', 'ALTER TABLE MENU_DAY ADD COLUMN AdjustedRanking INT', res);
			await simpleDBQuery('Add Audit Column', 'ALTER TABLE MENU_DAY ADD COLUMN IsAged TINYINT', res);
			await simpleDBQuery('Add Audit Column', 'ALTER TABLE MENU_DAY ADD COLUMN IsNewArrival TINYINT', res);
			await simpleDBQuery('Add Audit Column', 'ALTER TABLE MENU_DAY ADD COLUMN TotalRankings INT', res);
			break;
		case 'addIsMissingUnits':
			await simpleDBQuery('Add Column', 'ALTER TABLE SHOPPING_LIST_ITEM ADD COLUMN IsMissingUnits TINYINT', res);
			await simpleDBQuery('Add Column', 'ALTER TABLE INGREDIENT ADD COLUMN IsMissingUnits TINYINT', res);
			break;

		case 'calculateMissingForIngredients':
			const recipesToCalc = await selectAllRecipes();
			let total = 0;
			for( const recipToCalc of recipesToCalc ) {

				const ingredients = await selectIngredientsByRecipeID(recipToCalc.RecipeID);
				for( const ingredient of ingredients ) {

					// If it's not tracked for shopping list, we dont need a unit
					if( ingredient.IngredientTagID != null ) {

						if( ingredient.IsMissingUnits === 1 ) {
							console.log( "Ingredient already missing units." );
						} else {
							const { extractedAmount } = breakdownIngredient(ingredient.Name);
							const ingredientID = ingredient.IngredientID;

							const converted = convertToTeaspoons(extractedAmount);
							if( converted.isMissingUnits ) {
								console.log(" ==== MISSING", { ingredientID, name: ingredient.Name } );
								await updateIngredient({ IsMissingUnits: true }, ingredient.IngredientID);
								total++;
							}
						}
					}
				}
			
			}
			console.log(`Corrected [${total}] ingredients.` );
			break;
		case 'addSuggestions':
			await simpleDBQuery(
				'Create SUGGESTIONS',
				'CREATE TABLE SUGGESTIONS (SuggestionID INT AUTO_INCREMENT PRIMARY KEY, Name VARCHAR(500), ExpirationDate DATE, ExtensionCount INT, IsMade TINYINT )',
				res
			);
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
