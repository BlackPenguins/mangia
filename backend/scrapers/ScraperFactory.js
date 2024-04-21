import { scrapeGoogle } from './GoogleScraper.js';
import { scrapeNatasha } from './NatashaScraper.js';

export const scrape = async (url) => {
	// Attempt the google scraper with all sites first
	// Supported sites:
	// - AllRecipes
	// - SpruceEats
	let recipeObj = await scrapeGoogle(url);

	if (!isScrapeSuccessful(recipeObj)) {
		console.error('The default scraper failed for this url, trying others:' + url);

		if (url.indexOf('natashaskitchen.com') !== -1) {
			recipeObj = await scrapeNatasha(url);
		}

		recipeObj.success = isScrapeSuccessful(recipeObj);
	} else {
		console.log('RECIPE SCRAPE WAS A SUCCESS!');
		recipeObj.success = true;
	}

	return recipeObj;
};

const isScrapeSuccessful = (recipeObj) => {
	return recipeObj !== null && recipeObj?.name;
};
