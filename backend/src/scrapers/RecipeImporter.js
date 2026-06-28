import { deleteIngredientsByRecipeID, insertIngredient } from  '#root/database/ingredient.js';
import { selectAllIngredientTags } from '#root/database/ingredientTags.js';
import { deleteRecipe, insertImportFailureURL, insertRecipe, selectRecipeByName, updateRecipe } from  '#root/database/recipes.js';
import { deleteStepGroupByRecipeID, insertStepGroup } from '#root/database/stepGroup.js';
import { deleteThumbnailsForRecipe } from '#root/database/thumbnails.js';
import { resizeThumbnail, THUMBNAIL_DIRECTORY } from '#root/routes/recipes.js';
import { scrape } from '#root/scrapers/ScraperFactory.js';
import fs from "fs";
import https from "https";
import path from "path";

export const INGREDIENT_REGEX =         /^\s*(\d+(?:\/\d+)?(?:\s+\d+\/\d+)?)\s*(cups?|c|teaspoons?|tsp|tablespoons?|tbsp|pounds?|lbs?|ounces?|oz)?\s+(.+)$/i;
export const INGREDIENT_EXTRACT_REGEX = /([\d\/\s]+)\s*(cup|c|teaspoon|tablespoon|tbsp|pound|ounce|tsp|oz|lb|tb)?(?:s)?\s+/i;

export const importRecipe = async (url, replaceRecipeID) => {

	const importResponse = {};

	let scrapeSuccess = false;

	try {
		const recipeObject = await scrape(url);
		scrapeSuccess = recipeObject.success;

		console.log(`Importing recipe for URL [${url}] for recipe ID [${replaceRecipeID}]`);

		if (!scrapeSuccess) {
			importResponse.success = false;
			if( recipeObject.errorMessage){
				importResponse.status = recipeObject.errorMessage;
			} else {
				importResponse.status = `Failed to parse recipe from the URL "${url}"`;
			}
			
			await insertImportFailureURL(url);
		} else {
			let recipeID = 0;
			try {
				if( replaceRecipeID != null ) {
					// Replacing an existing one (the Import button in the Edit page)
					recipeID = replaceRecipeID;

					deleteIngredientsByRecipeID(recipeID);
					deleteStepGroupByRecipeID(recipeID);
					deleteThumbnailsForRecipe(recipeID);
				} else {
					// Adding a new recipe
					const recipeName = recipeObject.name.substring(0,49).replaceAll("&amp;", "&");

					const recipeToAdd = {
						name: recipeName,
						description: recipeObject.description,
						image: recipeObject.image
					};

					const recipeExists = await selectRecipeByName(recipeName);

					if (recipeExists) {
						console.error(`Recipe with name [${recipeName}] already exists.`);
						importResponse.success = false;
						importResponse.status = `Recipe with name "${recipeName}" already exists.`;
						return importResponse;
					}

					recipeID = await createRecipe(recipeToAdd, url);
					console.log(`Created a new recipe with ID [${recipeID}].`);
				}

				await createIngredients(recipeID, recipeObject);
				await createSteps(recipeID, recipeObject);

				importResponse.success = true;
				importResponse.recipeID = recipeID;
			} catch (e) {
				const errorStack = e.stack;
				console.error(`SOMETHING BAD HAPPENED DURING IMPORT OF RECIPE #${recipeID}`, e);

				// Cleanup the bad inserts
				if (!recipeID) {
					deleteIngredientsByRecipeID(recipeID);
					deleteStepGroupByRecipeID(recipeID);
					deleteThumbnailsForRecipe(recipeID);
					deleteRecipe(recipeID);
				}

				importResponse.success = false;
				importResponse.status = errorStack;
			}
		}
	} catch (error) {
		console.log('ERR', error);
		scrapeSuccess = false;
	}

	return importResponse;
};

const createRecipe = async (recipe, url) => {
	console.log(`Insert recipe with name [${recipe.name}] and description [${recipe.description}]`);

	const recipeToInsert = {
		name: recipe.name,
		description: recipe.description,
		category: 'Dinner',
		url,
		IsActive: 1,
		IsNewArrival: 1,
	};

	const newRecipe = await insertRecipe(recipeToInsert);
	const newID = newRecipe?.id;

	if( recipe.image) {
		fs.mkdirSync(THUMBNAIL_DIRECTORY, { recursive: true });

		const newFileName = `download-${newID}.jpg`;
		const afterName = `recipeDownloaded-${newID}.jpg`;
		const filePath = path.join(THUMBNAIL_DIRECTORY, newFileName);
		const downloadedPath = await downloadImage(recipe.image, filePath);

		if( downloadedPath != null ) {
			await resizeThumbnail(null, newID, THUMBNAIL_DIRECTORY, newFileName, afterName, true);
		}
	}

	return newRecipe?.id;
};

const downloadImage = (url, filePath) => {
  return new Promise((resolve) => {
	let parsedUrl;
    try {
      parsedUrl = new URL(url); // will throw on invalid URL
    } catch (err) {
      console.log(`Invalid Download Image URL: ${url}`);
      resolve(null);
      return;
    }

    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        console.log(`Could not download image [${url}]. Status: ${res.statusCode}`);
        resolve(null);
        return;
      }

      const file = fs.createWriteStream(filePath);
      res.pipe(file);

      file.on("finish", () => {
        file.close(() => resolve(filePath));
      });

      file.on("error", (err) => {
        fs.unlink(filePath, () => resolve(null));
      });
    }).on("error", (err) => {
      console.log("HTTPS error:", err);
      resolve(null);
    });
  });
};

const SUPPORTED_UNITS = new Set([
  "cup", "cups", "c",
  "tbsp", "tablespoon", "tablespoons", "tb",
  "tsp", "teaspoon", "teaspoons",
  "oz", "ounce", "ounces",
  "lb", "lbs", "pound", "pounds",
  "kg", "kilograms", "kilogram", "g", "grams"
]);

export const parseIngredient = (ingredientLine) => {
	const tokens = ingredientLine.trim().split(/\s+/);

	let quantity = null;
	let unit = null;
	let tokenIndex = 0;

	// mixed fraction: "1 1/2"
	if (
		tokens.length > 1 &&
		/^\d+$/.test(tokens[0]) &&
		/^\d+\/\d+$/.test(tokens[1])
	) {
		quantity = `${tokens[0]} ${tokens[1]}`;
		tokenIndex = 2;
	}

	// simple fraction or integer: "1/2" or "4"
	else if (/^\d+(?:[\/|.]\d+)?$/.test(tokens[0])) {
		quantity = tokens[0];
		tokenIndex = 1;
	}

	// measurement unit
	const santizedUnit = tokens[tokenIndex].toLowerCase().replace(".", "");
	if (tokens[tokenIndex] && SUPPORTED_UNITS.has(santizedUnit)) {
		unit = santizedUnit;
		tokenIndex++;
	}


	// The remaining tokens after the quantity and units
	const ingredient = tokens.slice(tokenIndex).join(" ");
	
	let isMissingUnits = false;
	let decimalQuantity = null;
	let teaspoonQuantity = null;
	let unitType = UNIT_TYPE.Count;

	if( quantity == null ) {
		isMissingUnits = true;
	} else {
		decimalQuantity = convertFractionToDecimal(quantity);
		({unitType, teaspoonQuantity} = getTeaspoonQuantity(decimalQuantity, unit));
		isMissingUnits = unitType == null || teaspoonQuantity == null;
	}

	return {
		quantity,
		decimalQuantity,
		teaspoonQuantity,
		unit,
		ingredient,
		isMissingUnits,
		unitType
	};
}

export const UNIT_TYPE = Object.freeze({
	Volume: 'volume',
	Weight_Imperial: "weight_imperial",
	Weight_Metric: "weight_metric",
	Count: "count"
});

export const convertFractionToDecimal = (quantity) => {
	const splitQuantities = quantity.split(' ');

	if(splitQuantities.length == 0 || (splitQuantities.length == 1 && splitQuantities[0] == "" ) ) {
		return null;
	} else if( splitQuantities.length == 1) {
		return getDecimal(splitQuantities[0], null);
	} else if( splitQuantities.length == 2) {
		// If we have 1/4, then our decimal is 0.25
		// If we have 1 1/4, then our decimal is 1.25 (1 + 0.25)
		// If we have 2 1/4, then our multdecimaliplier is 2.25 (2 + 0.25)
		// We need to traverse each piece of the amount
		const wholeNumber = getDecimal(splitQuantities[0], false);
		if( wholeNumber == null ) {
			return null;
		}

		const decimal = getDecimal(splitQuantities[1], true);
		if( decimal == null ) {
			return null;
		}

		return wholeNumber + decimal;
	} else {
		// Too many numbers
		return null;
	}
}

export const consolidateIngredients = (ingredients) => {
	const finalIngredients = [];

	for (const ingredient of ingredients) {

		if (ingredient.tagID != null) {
			const foundTotalIndex = finalIngredients.findIndex((i) => i.name === ingredient.tagName && i.unitType === ingredient.unitType);

			if (foundTotalIndex === -1) {
				finalIngredients.push({
					name: ingredient.tagName,
					tagID: ingredient.tagID,
					teaspoonQuantity: ingredient.teaspoonQuantity,
					unitType: ingredient.unitType,
					unit: ingredient.unit,
					isMissingUnits: ingredient.isMissingUnits,
					recipeCount: 1,
					ingredientDepartment: ingredient.ingredientDepartment,
					ingredientDepartmentPosition: ingredient.ingredientDepartmentPosition,
					recipeNames: ingredient.recipeName
				});
			} else {
				finalIngredients[foundTotalIndex].teaspoonQuantity += ingredient.teaspoonQuantity;
				finalIngredients[foundTotalIndex].recipeCount++;
				finalIngredients[foundTotalIndex].recipeNames += `, ${ingredient.recipeName}`
			}
		}
	}

	return finalIngredients;
}
export const getTeaspoonQuantity = (decimalQuantity, unit) => {
	let conversionRate = 0;
	let unitType;

	if(!unit) {
		unitType = UNIT_TYPE.Count;
	} else {
		switch (unit.toLowerCase()) {
			case 'cup':
			case 'cups':
			case 'c':
				conversionRate = 48;
				unitType = UNIT_TYPE.Volume;
				break;
			case 'tb':
			case 'tablespoon':
			case 'tablespoons':
			case 'tbsp':
				conversionRate = 3;
				unitType = UNIT_TYPE.Volume;
				break;
			case 'tsp':
			case 'teaspoon':
			case 'teaspoons':
				conversionRate = 1;
				unitType = UNIT_TYPE.Volume;
				break;
			case 'ounce':
			case 'ounces':
			case 'oz':
				conversionRate = 1;
				unitType = UNIT_TYPE.Weight_Imperial;
				break;
			case 'pound':
			case 'pounds':
			case 'lb':
			case 'lbs':
				conversionRate = 16;
				unitType = UNIT_TYPE.Weight_Imperial;
				break;
				case 'ounce':
			case 'kilograms':
			case 'kilogram':
			case 'kg':
				conversionRate = 1000;
				unitType = UNIT_TYPE.Weight_Metric;
				break;
			case 'grams':
			case 'g':
				conversionRate = 1;
				unitType = UNIT_TYPE.Weight_Metric;
				break;
			default:
				unitType = UNIT_TYPE.Count;
		}
	}

	let convertedQuantity = 0;

	if( unitType == UNIT_TYPE.Volume || unitType == UNIT_TYPE.Weight_Imperial || unitType == UNIT_TYPE.Weight_Metric) {
		convertedQuantity = parseFloat(conversionRate * decimalQuantity);
	} else {
		convertedQuantity = decimalQuantity;
	}

	return {
		unitType,
		teaspoonQuantity: convertedQuantity
	}
};

export const getDecimal = (amount, mustBeFraction) => {
	if( amount.indexOf("/") !== -1 ) {
		if( mustBeFraction == false ) {
			// If mustBeFraction is null, it means we don't care (like a single amount could be either fraction or whole)
			return null;
		}

		switch (amount) {
			case '1/2':
				return 0.5;
			case '1/4':
				return 0.25;
			case '1/3':
				return 0.33333333;
			case '2/3':
				return 0.66666666;
			case '1/8':
				return 0.125;
			case '3/4':
				return 0.75;
			default:
				return null;
		}
	} else {
		if( mustBeFraction == true ) {
			return null;
		}

		if( isNaN(amount)) {
			return null;
		}

		// No fraction, it can be parsed as a whole number
		return parseInt(amount);
	}
};

export const getFractionForDisplay = (amount) => {
	switch (amount) {
		case 0.5:
			return '1/2';
		case 0.25:
			return '1/4';
		case 0.33333333:
			return '1/3';
		case 0.66666666:
			return '2/3';
		case 0.125:
			return '1/8';
		case 0.75:
			return '3/4';
		case 0.625:
			return '5/8';
		case 1.5:
			return '1 1/2';
		default:
			if( isNaN(amount)) {
				return amount;
			} else {
				return amount.toString();
			}
	}
};


// 1 TB =  3 TSP
// 1/4 CUP = 12 TSP
// 1/3 CUP = 16 TSP
// 1/2 CUP = 24 TSP
// 2/3 CUP = 32 TSP
// 3/4 CUP = 36 TSP
//   1 CUP = 48 TSP
export const getSummarizedIngredientQuantity = (finalIngredient) => {
	if( finalIngredient.teaspoonQuantity == null ) {
		// We had problems getting a quantity, return blank
		// There will be a missing units label warnings us
		return "";
	} else if (finalIngredient.unitType == UNIT_TYPE.Volume) {
		let convertedValue = '';
		let totalCups = '';
		let leftOverTeaspoons = '';
		let teaspoonAmount = finalIngredient.teaspoonQuantity;
		if (teaspoonAmount >= 48) {
			// Larger than 1 cup
			totalCups = Math.floor(teaspoonAmount / 48);
			leftOverTeaspoons = teaspoonAmount % 48;
			convertedValue = totalCups;
		} else {
			leftOverTeaspoons = teaspoonAmount;
		}

		// Now the measurement is less than 1 cup, find the closest known measurement
		if (leftOverTeaspoons > 0) {

			// 12 tsp  = 1/4 cup, we need to go smaller than that into the teaspoons
			if (leftOverTeaspoons < 12) {
				if (totalCups > 0) {
					convertedValue += ' cups ';
				}

				if (leftOverTeaspoons < 2) {
					if (leftOverTeaspoons === 0.25) {
						leftOverTeaspoons = '1/4';
					} else if (leftOverTeaspoons === 0.5) {
						leftOverTeaspoons = '1/2';
					}

					convertedValue += leftOverTeaspoons + ' teaspoon';
				} else {
					convertedValue += Math.round(leftOverTeaspoons / 3) + ' tablespoon';
				}
			} else if (leftOverTeaspoons < 16) {
				convertedValue += ' 1/4 cup';
			} else if (leftOverTeaspoons < 24) {
				convertedValue += ' 1/3 cup';
			} else if (leftOverTeaspoons < 32) {
				convertedValue += ' 1/2 cup';
			} else if (leftOverTeaspoons < 36) {
				convertedValue += ' 2/3 cup';
			} else if (leftOverTeaspoons < 48) {
				convertedValue += ' 3/4 cup';
			}
		} else {
			convertedValue += ' cups';
		}

		return convertedValue.trim();
	} else if (finalIngredient.unitType == UNIT_TYPE.Weight_Imperial) {
		let convertedValue = '';
		let totalPounds = '';
		let leftOverOunces = '';
		let ouncesAmount = finalIngredient.teaspoonQuantity;
		if (ouncesAmount >= 16) {
			// Larger than 1 LB
			totalPounds = Math.floor(ouncesAmount / 16);
			leftOverOunces = ouncesAmount % 16;
			convertedValue = totalPounds;
		} else {
			leftOverOunces = ouncesAmount;
		}

		// Now the measurement is less than 1 lb, find the closest known measurement
		if (leftOverOunces > 0) {

			// 16 oz = 1 lb, we need to go smaller than that into the ounces
			if (leftOverOunces < 16) {
				if (totalPounds > 0) {
					convertedValue += ' lbs ';
				}
				
				convertedValue += leftOverOunces + ' ounces';
			}
		} else {
			convertedValue += ' lbs';
		}

		return convertedValue.trim();
	} else if (finalIngredient.unitType == UNIT_TYPE.Weight_Metric) {
		let convertedValue = '';
		let totalKilograms = '';
		let leftOverGrams = '';
		let gramsAmount = finalIngredient.teaspoonQuantity;
		if (gramsAmount >= 1000) {
			// Larger than 1 LB
			totalKilograms = Math.floor(gramsAmount / 1000);
			leftOverGrams = gramsAmount % 1000;
			convertedValue = totalKilograms;
		} else {
			leftOverGrams = gramsAmount;
		}

		// Now the measurement is less than 1000 kg, find the closest known measurement
		if (leftOverGrams > 0) {

			// 1000 g = 1 kg, we need to go smaller than that into the grams
			if (leftOverGrams < 1000) {
				if (totalKilograms > 0) {
					convertedValue += ' kg ';
				}
				
				convertedValue += leftOverGrams + ' grams';
			}
		} else {
			convertedValue += ' kg';
		}

		return convertedValue.trim();
	} else {
		const fractionDisplay = getFractionForDisplay(finalIngredient.teaspoonQuantity);
		return fractionDisplay + "";
	}
}

export const createIngredients = async (recipeID, recipe, tagCache) => {
	try {
		if( recipe.ingredients ) {
			const ingredientTags = await selectAllIngredientTags();

			for (const ingredient of recipe.ingredients) {
				if (ingredient) {
					let formattedIngredient = ingredient;

					// TODO: Remove unrelated words to create a record in ITEM table, which is used to aggregate the same ingredients and add them together
					// Phase 1 will just be listing the ingredients in the shopping list though
					const unrelatedWords = ['diced', 'crushed', 'chopped', 'finely', 'grated', 'beaten', 'sliced', 'freshly', 'ground'];
					formattedIngredient = formattedIngredient.replace('0.25', '1/4');
					formattedIngredient = formattedIngredient.replace('0.5', '1/2');
					formattedIngredient = formattedIngredient.replace('0.75', '3/4');
					formattedIngredient = formattedIngredient.replace('0.125', '1/8');
					formattedIngredient = formattedIngredient.replace('½', '1/2');
					formattedIngredient = formattedIngredient.replace('¼', '1/4');
					formattedIngredient = formattedIngredient.replace('¾', '3/4');
					formattedIngredient = formattedIngredient.replace('⅓', '1/3');
					formattedIngredient = formattedIngredient.replace('▢', '');

					const ingredientToInsert = {
						Name: formattedIngredient,
						recipeID,
					};

					if (tagCache) {
						const cachedTagID = tagCache[formattedIngredient];
						if (cachedTagID) {
							ingredientToInsert.IngredientTagID = cachedTagID;
						}
					}

					if(!ingredientToInsert?.IngredientTagID) {
						// Not tag yet, even from the cache, find one
						// Auto-tag ingredients
						let longestIngredientTagLength = 0;
						let longestIngredientTagID = 0;
						for( const ingredientTag of ingredientTags ) {
							if( formattedIngredient.toLowerCase().indexOf(ingredientTag.Name.toLowerCase()) != -1 ) {
								console.log("Ingredient Name: ", formattedIngredient);
								console.log("Matched Ingredient Tag: ", ingredientTag);
								const sizeOfCurrentTag = ingredientTag.Name.length;

								if( sizeOfCurrentTag > longestIngredientTagLength) {
									// Ingredient name is "brown sugar"
									// It tags on "sugar" first
									// Then it finds "brown sugar" in next iteration
									// The longest ingredient wins
									longestIngredientTagLength = sizeOfCurrentTag;
									longestIngredientTagID = ingredientTag.IngredientTagID;
									console.log("Largest Ingredient Tag So Far", {longestIngredientTagLength, longestIngredientTagID})
								}
							}
						}

						if( longestIngredientTagID > 0 ) {
							// Create the auto tag the longest ingredient
							console.log("Inserting Largest Tag", {longestIngredientTagID})
							ingredientToInsert.IngredientTagID = longestIngredientTagID;
						}
					}

					await insertIngredient(ingredientToInsert);

					console.log(`Insert ingredient with amount Name [${formattedIngredient}] for recipeID[${recipeID}]`);
				}
			}
		}
	} catch (e) {
		console.log('An error occurred while creating ingredients', e);
	}
};

export const createSteps = async (recipeID, recipe) => {
	try {
		const re = /([\d\/]+\s\w+)\s+(.*)/;

		for (const stepGroup of recipe.stepGroups) {
			if (stepGroup) {
				const cleanStep = stepGroup.steps.replaceAll("&nbsp;", "");
				await insertStepGroup({
					RecipeID: recipeID,
					Position: stepGroup.position,
					Header: stepGroup.header,
					Steps: cleanStep
				});
			}
		}
	} catch (e) {
		console.log('An error occurred creating steps', e);
	}
};
