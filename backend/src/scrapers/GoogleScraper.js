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

		const googleSchema = $('script[type=application/ld+json]').text();

		console.log('Schema:', googleSchema);

		json = JSON.parse(googleSchema)[0];

		if( json === undefined ) {
			attemptPath.push('Root Extract')
			json = JSON.parse(googleSchema);
		}

		if( !json.description && json['@graph'] ) {
			attemptPath.push('@Graph')
			json = json['@graph'].find(item => item['@type'] === 'Recipe');
		}

		const recipeObj = new Recipe();

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
