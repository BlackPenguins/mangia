import { scrapeGoogle } from './GoogleScraper.js';
import { scrapeNatasha } from './NatashaScraper.js';
import axios from 'axios';

const scraperMap = new Map();
scraperMap.set('*', scrapeGoogle);
scraperMap.set('natashaskitchen.com', scrapeNatasha);

export const scrape = async (url) => {
	console.log('Scraping URL...', url);

	// Attempt the google scraper with all sites first
	// Supported sites:
	// - AllRecipes
	// - SpruceEats
	
	const response = await axios.get(url);
	const html = response.data;
	
	let recipeObj = {
		success: false,
	}


	console.log('=== Running through all scrapers...');
	for( const [domain, scraper] of scraperMap) {
		if( domain === "*" || url.indexOf(domain)) {
			recipeObj = await scraper(html);

			if( recipeObj?.errorMessage ) {
				// Don't try the other scrapers, we have an error
				break;
			}

			if( recipeObj !== null && recipeObj?.name) {
				// We found a recipe, don't try other scrapers
				recipeObj.success = true;
				break;
			}
		}
	}

	if( !recipeObj.success && !recipeObj.errorMessage ) {
		recipeObj.errorMessage = `Failed to parse recipe from the URL ${url}`;
	}

	return recipeObj;
};