import axios from 'axios';
import * as cheerio from 'cheerio';
import Recipe from './Recipe.js';
import { raw } from 'mysql';

// https://github.com/julianpoy/RecipeClipper - Attempts to do a catch-all scraper for all websites using algorithms and AI learning
// https://github.com/jadkins89/Recipe-Scraper - Scrapes by creating profiles for each website and CSS selectors
export const scrapeGoogle = async (url) => {
	try {
		// send request
		const response = await axios.get(url);
		const html = response.data;

		const $ = cheerio.load(html);

		const googleSchema = $('script[type=application/ld+json]').text();

		console.log('Schema:', googleSchema);
		console.log('\n\nAFTER');

		const json = JSON.parse(googleSchema)[0];

		const recipeObj = new Recipe();

		if (json) {
			recipeObj.name = decodeHTMLEntities(json.headline);
			recipeObj.description = decodeHTMLEntities(json.description);
			recipeObj.image = json.image?.url;
			recipeObj.ingredients = json.recipeIngredient;

			for (const instruction of json.recipeInstructions) {
				recipeObj.steps.push(decodeHTMLEntities(instruction.text));
			}
		}
		return recipeObj;

		// console.log('\nSCRAPED', recipeObj);
	} catch (e) {
		console.error('Failed to parse with Google!', e);
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
