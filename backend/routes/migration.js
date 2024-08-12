import { checkAdminMiddleware } from './auth.js';
import express from 'express';
import { selectAllRecipes } from '../database/recipes.js';
import { resizeThumbnail, THUMBNAIL_DIRECTORY } from './recipes.js';
import fs from 'fs';

const router = express.Router();

const migrationProcessor = async (req, res) => {
	let migrationKeyword = req.body.migrationKeyword;
	console.log('MIGRATION FOUND', migrationKeyword);

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
};

router.post('/api/migration', [checkAdminMiddleware], migrationProcessor);

export default router;
