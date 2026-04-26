import * as cheerio from 'cheerio';
import Recipe from './Recipe.js';
import { raw } from 'mysql';

// https://github.com/julianpoy/RecipeClipper - Attempts to do a catch-all scraper for all websites using algorithms and AI learning
// https://github.com/jadkins89/Recipe-Scraper - Scrapes by creating profiles for each website and CSS selectors
export const scrapeGoogle = async (html) => {
	console.log( "SCRAPER: Google" );

	let json = null;
	let attemptPath = [];

	try {
		const $ = cheerio.load(html);

		const scripts = $('script[type="application/ld+json"]');

		let recipeJSON = null;

		scripts.each((_, el) => {
    		const data = JSON.parse($(el).html());
    		recipeJSON = extractRecipe(data);
    		if (recipeJSON) return false;
		});

		// console.log('Schema:', recipeJSON);

		const recipeObj = new Recipe();
		const json = recipeJSON;

		if (json) {
			recipeObj.name = decodeHTMLEntities(json.headline || json.name);
			recipeObj.description = decodeHTMLEntities(json.description);
			recipeObj.image = json.image?.url || json.image?.[0];
			recipeObj.ingredients = json.recipeIngredient;

			if( json.recipeInstructions ) {
				const nonGrouped = json.recipeInstructions?.[0].text;

				if(nonGrouped) {
					let stepArray = [];

					for (const instruction of json.recipeInstructions) {
						stepArray.push(decodeHTMLEntities(instruction.text));
					}

					recipeObj.stepGroups.push({
						header: "Steps",
						position: 1,
						steps: stepArray.join("\n")
					});

				} else {
					// Maybe it's split into sections
					let position = 1;
					for (const stepGroup of json.recipeInstructions) {
						if(stepGroup.itemListElement) {
							let stepArray = [];
							for (const itemList of stepGroup.itemListElement) {
								stepArray.push(decodeHTMLEntities(itemList.text));
							}

							recipeObj.stepGroups.push({
								header: stepGroup?.name || "Steps",
								position,
								steps: stepArray.join("\n")
							});

							position++;
						}
					}
				}
			}
		}
		console.log("SUCCESS JSON: ", json);
		return recipeObj;
	} catch (e) {
		console.log("JSON: ", json);
		console.error('Failed to parse with Google!', e);
		console.log("Attempt path: ", attemptPath.join(','));

		return {
			success: false,
			errorMessage: e.message,
		};
	}
};

const extractRecipe = (obj) => {
  	if (!obj) return null;

	if (Array.isArray(obj)) {
		for (const item of obj) {
			const found = extractRecipe(item);
			if (found) {
				return found;
			}
		}
	} else if (typeof obj === 'object') {
		const type = obj['@type'];

		if( Array.isArray(type)) {
			// '@type': [ 'Recipe', 'NewsArticle' ]
			if(type.includes('Recipe')) {
				return obj;
			}
		} else {
			// '@type': 'Recipe'
			if (obj['@type'] === 'Recipe') {
				return obj;
			}
		}

		if (obj['@graph']) {
			return extractRecipe(obj['@graph']);
		}
  	}

  	return null;
};

function decodeHTMLEntities(rawStr) {
	if (rawStr) {
		return rawStr.replace(/&#(\d+);/g, (match, dec) => `${String.fromCharCode(dec)}`);
	} else {
		return rawStr;
	}
}
