import { scrapeGoogle } from './GoogleScraper.js';
import { scrapeNatasha } from './NatashaScraper.js';
import axios from 'axios';

export const scrape = async (url) => {
	console.log('Scraping URL...', url);

	// Attempt the google scraper with all sites first
	// Supported sites:
	// - AllRecipes
	// - SpruceEats
	
	const response = await axios.get(url);
	const html = response.data;
	

	console.log('=== Running through all scrapers...');
	let recipeObj = await scrapeGoogle(html);

	if (!isScrapeSuccessful(recipeObj)) {

		if (url.indexOf('natashaskitchen.com') !== -1) {
			recipeObj = await scrapeNatasha(html);
		}

		console.log('Recipe Object', recipeObj);
		recipeObj.success = isScrapeSuccessful(recipeObj);
	} else {
		console.log('Recipe Object', recipeObj);
		console.log('RECIPE SCRAPE WAS A SUCCESS!');
		recipeObj.success = true;
	}

	return recipeObj;
};

const isScrapeSuccessful = (recipeObj) => {
	return recipeObj !== null && recipeObj?.name;
};
