import { checkAdminMiddleware } from './auth.js';
import express from 'express';
import { selectAllRecipes } from  '#root/database/recipes.js';
import { resizeThumbnail, THUMBNAIL_DIRECTORY } from './recipes.js';
import fs from 'fs';
import { simpleDBQuery } from './setup.js';
import { selectAllMenuDay } from  '#root/database/menu.js';
import { getWeekRange } from './menu.js';
import { getPool } from  '#root/database/utils.js';
import { insertThumbnail } from  '#root/database/thumbnails.js';
import { selectIngredientsByRecipeID, updateIngredient } from  '#root/database/ingredient.js';
import { breakdownIngredient } from '#root/scrapers/RecipeImporter.js';
import { convertToTeaspoons } from './shoppingListItem.js';
import { insertStepGroup, updateStepGroup } from '#root/database/stepGroup.js';

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
		case 'addDeptColor':
			await simpleDBQuery('Add Column', 'ALTER TABLE ingredient_department ADD COLUMN Color VARCHAR(10)', res);
			break;
		case 'addFridge':
				await simpleDBQuery(
					'Create FRIDGE',
					'CREATE TABLE FRIDGE (FridgeID INT AUTO_INCREMENT PRIMARY KEY, IngredientTagID INT NOT NULL, DateAdded DATE, FOREIGN KEY (IngredientTagID) REFERENCES INGREDIENT_TAG(IngredientTagID))',
					res
				);
				break;
		case 'addMatchedIngredients':
			await simpleDBQuery('Add MENU_DAY Column', 'ALTER TABLE MENU_DAY ADD COLUMN MatchedIngredients INT', res);
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
		case 'addReceipts':
			await simpleDBQuery(
				'Create RECEIPTS',
				'CREATE TABLE RECEIPTS (ReceiptID INT AUTO_INCREMENT PRIMARY KEY, StoreID INT, Date DATE, IsProcessed TINYINT, FOREIGN KEY (StoreID) REFERENCES STORE(StoreID))',
				res
			);
			break;

		case 'addPricingHistory':
			await simpleDBQuery(
				'Create PRICING HISTORY',
				'CREATE TABLE PRICING_HISTORY (PricingHistoryID INT AUTO_INCREMENT PRIMARY KEY, ReceiptID INT, IngredientTagID INT, Price FLOAT NOT NULL, UpdateStamp DATE, FOREIGN KEY (ReceiptID) REFERENCES RECEIPTS(ReceiptID), FOREIGN KEY (IngredientTagID) REFERENCES INGREDIENT_TAG(IngredientTagID))',
				res
			);
			break;
		case 'addRecipeNames':
			await simpleDBQuery('Add Column', 'ALTER TABLE SHOPPING_LIST_ITEM ADD COLUMN RecipeNames VARCHAR(200)', res);
			break;
		case 'addIsWishlist':
			await simpleDBQuery('Add Column', 'ALTER TABLE SHOPPING_LIST_EXTRA ADD COLUMN IsWishlist TINYINT', res);
			await simpleDBQuery('Add Column', 'UPDATE SHOPPING_LIST_EXTRA SET IsWishlist = 0 WHERE IsWishlist IS NULL', res);
			await simpleDBQuery('Add Column', 'UPDATE SHOPPING_LIST_EXTRA SET IsChecked = 0 WHERE IsChecked IS NULL', res);
			break;
		case 'convertForUnicode':
			await simpleDBQuery('Add Column', 'ALTER TABLE RECIPE CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;', res);
			await simpleDBQuery('Add Column', 'ALTER TABLE shopping_list_item CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;', res);
			await simpleDBQuery('Add Column', 'ALTER TABLE shopping_list_extra CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;', res);
			break;
		case 'addStepGroup':
			await simpleDBQuery(
				'Create STEP_GROUP',
				'CREATE TABLE STEP_GROUP (StepGroupID INT AUTO_INCREMENT PRIMARY KEY, RecipeID INT, Position INT, Header VARCHAR(50), FOREIGN KEY (RecipeID) REFERENCES RECIPE(RecipeID))',
				res
			);
			await simpleDBQuery('Add Column', 'ALTER TABLE STEP ADD COLUMN StepGroupID INT, ADD CONSTRAINT fk_step_stepgroup FOREIGN KEY (StepGroupID) REFERENCES STEP_GROUP(StepGroupID);', res);
			break;
		case 'moveStepsToGroups': {
			const allRecipesSteps = await selectAllRecipes();
			await simpleDBQuery('Add Column', 'UPDATE STEP Set StepGroupID = null;', res);
			await simpleDBQuery('Add Column', 'DELETE FROM STEP_GROUP;', res);
			
			for (const recipe of allRecipesSteps) {
				const id = recipe.RecipeID;

				const stepGroup = await insertStepGroup({
					RecipeID: id,
					Position: 1,
					Header: "Steps"
				});

				const stepGroupID = stepGroup.id;

				console.log("StepsGroup", {id, stepGroupID});

				await updateStepGroup(stepGroupID, id);
			}
			break;
		}
		case 'flattenSteps': {
			await simpleDBQuery('Add Column', 'ALTER TABLE STEP_GROUP ADD COLUMN Steps VARCHAR(5000)', res);
			await simpleDBQuery('Add Column', 'ALTER TABLE STEP_GROUP CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;', res);

			const allStepGroups = await simpleDBQuery('Add Column', 'SELECT * FROM STEP_GROUP', res);
			for (const stepGroup of allStepGroups) {
				const stepGroupID = stepGroup.StepGroupID;

				const stepsForGroup = await simpleDBQuery('Add Column', `SELECT * FROM STEP WHERE StepGroupID = ${stepGroupID} ORDER BY StepNumber ASC`, res);
				const allSteps = [];
				for (const step of stepsForGroup ) {
					const instruction = step.Instruction;
					allSteps.push( instruction );
				}
				const joinedSteps = (allSteps.join("\n"));

				if( joinedSteps ) {
					await updateStep(joinedSteps,stepGroupID);
				}
				
			}
			break;
		}

		default:
			console.error('Migration not found!');
			res.status(200).json({ success: false });
	}

	res.status(200).json({ success: true });
};

const pool = getPool();

export const updateStep = (steps, stepGroupID) => {
	return new Promise((resolve, reject) => {
		pool.query(`UPDATE STEP_GROUP Set Steps = ? WHERE StepGroupID = ?`, [steps,stepGroupID], (error) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve();
			}
		});
	});
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
