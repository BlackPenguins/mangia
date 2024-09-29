import axios from 'axios';
import * as cheerio from 'cheerio';
import Recipe from './Recipe.js';
import { raw } from 'mysql';

// https://github.com/julianpoy/RecipeClipper - Attempts to do a catch-all scraper for all websites using algorithms and AI learning
// https://github.com/jadkins89/Recipe-Scraper - Scrapes by creating profiles for each website and CSS selectors
export const scrapeNatasha = async (url) => {
	try {
		// send request
		const response = await axios.get(url);
		const html = response.data;

		const $ = cheerio.load(html);

		const googleSchema = $('script[type=application/ld+json]').text();

		console.log('\nSchema:', googleSchema);

		const json = JSON.parse(googleSchema);

		console.log('\nJSON:', json);

		const recipeObj = new Recipe();

		let recipeJSON = null;
		for (const i = 0; i < json.length; i++) {
			const tempJSON = json[i];
			if (tempJSON['@type'] === 'Recipe') {
				recipeJSON = tempJSON;
				break;
			}
		}

		if (recipeJSON) {
			recipeObj.name = decodeHTMLEntities(json.headline);
			recipeObj.description = decodeHTMLEntities(json.description);
			recipeObj.image = json.image?.url;
			recipeObj.ingredients = json.recipeIngredient;

			for (const instruction of json.recipeInstructions) {
				recipeObj.steps.push(decodeHTMLEntities(instruction.text));
			}
			// for (const ingredient of ingredients) {
			// 	const quantity = $(ingredient).find('span[data-ingredient-quantity]');
			// 	const unit = $(ingredient).find('span[data-ingredient-unit]');
			// 	const name = $(ingredient).find('span[data-ingredient-name]');
			// 	console.log(`Ingredient ${$(quantity).text()} ${$(unit).text()} ${$(name).text()}`);
			// }
		}

		return recipeObj;
	} catch (e) {
		console.error('Failed to parse with Natasha!');
		return null;
	}
};

function decodeHTMLEntities(rawStr) {
	if (rawStr) {
		return rawStr.replace(/&#(\d+);/g, (match, dec) => `${String.fromCharCode(dec)}`);
	} else {
		return rawStr;
	}
}
