import { checkAdminMiddleware } from './auth.js';
import express from 'express';
import { selectAllRecipes } from '../database/recipes.js';
import { resizeThumbnail, THUMBNAIL_DIRECTORY } from './recipes.js';
import fs from 'fs';
import { simpleDBQuery } from './setup.js';

const router = express.Router();

const migrationHandler = async (req, res) => {
	let migrationKeyword = req.body.migrationKeyword;
	console.log('MIGRATION FOUND', migrationKeyword);

	if (migrationKeyword === 'resizeImages') {
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
	} else if (migrationKeyword === 'createStore') {
		await simpleDBQuery('Create Store', 'CREATE TABLE STORE (StoreID INT AUTO_INCREMENT PRIMARY KEY, Name VarChar(50) NOT NULL)', res);
		await simpleDBQuery(
			'Create Store',
			'CREATE TABLE INGREDIENT_TAG_PRICE (IngredientTagPriceID INT AUTO_INCREMENT PRIMARY KEY, StoreID INT NOT NULL, IngredientTagID INT NOT NULL, Price FLOAT NOT NULL, FOREIGN KEY (StoreID) REFERENCES STORE(StoreID), FOREIGN KEY (IngredientTagID) REFERENCES INGREDIENT_TAG(IngredientTagID))',
			res
		);
		res.status(200).json({ success: true });
	} else {
		console.error('Migration not found!');
		res.status(200).json({ success: false });
	}
};

router.post('/api/migration', [checkAdminMiddleware], migrationHandler);

export default router;
