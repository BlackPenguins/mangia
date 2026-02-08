import express from 'express';
import { selectAllRecipes, selectAllRecipesByLastMadeOrder, selectRecipeByID, updateRecipe } from  '#root/database/recipes.js';
import { deleteMenu, insertMenu, selectByWeekID, selectMenuByDay, selectMenuByMenuID, swapMenu, updateMenu } from  '#root/database/menu.js';
import { checkAdminMiddleware } from './auth.js';
import { addIngredientsToRecipe, addIngredientTags, addThumbnails } from './recipes.js';
import { getOrInsertWeek } from  '#root/database/week.js';
import { selectAllSuggestions, selectTwoSuggestions } from  '#root/database/suggestions.js';
import { selectAllFridge } from  '#root/database/fridge.js';
import { selectIngredientTagsByRecipeID } from  '#root/database/ingredientTags.js';
import { differenceInDays } from 'date-fns';
import { TZDate } from "@date-fns/tz";

const DAYS_OF_WEEK = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const MONTHS_OF_YEAR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const getMenuForWeek = async (req, res) => {
	let weekOffset = req.params.weekOffset;

	// Every time you VIEW a new week, it will insert a new WEEK if needed
	// This mean when you click Generate there will always be a WeekID ready
	const { weekID, startDate } = await getOrInsertWeek(weekOffset);

	const responseObject = await getMenuForWeekOffset(weekID, startDate);
	// No DB calls, no promises needed because there is no async
	res.status(200).json(responseObject);
};

export const getMenuForWeekOffset = async (weekID, startDate) => {
	let formattedDaysArray = [];

	const menuDays = await selectByWeekID(weekID);

	const firstDayOfTheYear = new Date(startDate.getFullYear(), 0, 1);
	const dayOfYear = Math.floor((startDate - firstDayOfTheYear) / (24 * 60 * 60 * 1000));
	const weekOfYear = Math.floor(dayOfYear / 7);

	if (menuDays.length == 0) {
		for (let i = 0; i < 7; i++) {
			const day = new Date(startDate.getTime());
			day.setHours(24 * i);
			formattedDaysArray.push(withDateDetails(day));
		}
	} else {
		for (const menuDay of menuDays) {
			if (menuDay?.RecipeID) {
				const recipeFromDB = await selectRecipeByID(menuDay.RecipeID);
				const recipeWithThumbnails = await addThumbnails(recipeFromDB);
				const recipeWithThumbnailsAndTags = await addIngredientTags(recipeWithThumbnails);
				await addIngredientsToRecipe(recipeWithThumbnailsAndTags);
				formattedDaysArray.push(
					withDateDetails(new Date(menuDay.Day), {
						menuID: menuDay.MenuID,
						isMade: menuDay.IsMade,
						isSkipped: menuDay.IsSkipped,
						isLeftovers: menuDay.IsLeftovers,
						skipReason: menuDay.skipReason,
						weekID: menuDay.WeekID,
						dailyNotes: menuDay.DailyNotes,
						originalRanking: menuDay.OriginalRanking,
						adjustedRanking: menuDay.AdjustedRanking,
						originalWeight: menuDay.OriginalWeight,
						adjustedWeight: menuDay.AdjustedWeight,
						matchedIngredients: menuDay.MatchedIngredients,
						totalRankings: menuDay.TotalRankings,
						isAged: menuDay.IsAged,
						isNewArrival: menuDay.IsNewArrival,
						recipe: recipeWithThumbnailsAndTags,
					})
				);
			}
		}
	}

	const suggestions = await selectTwoSuggestions();

	return {
		weekOfYear,
		days: formattedDaysArray,
		suggestions,
	};
};

export const withDateDetails = (day, data) => {
	if (!day || day.getFullYear() <= 1970) {
		return {
			hasNoDate: true,
			...data,
		};
	}

	const todaysDate = new Date();
	const isToday = todaysDate.getDate() === day.getDate() && todaysDate.getMonth() === day.getMonth() && todaysDate.getFullYear() === day.getFullYear();
	const dayOfWeek = DAYS_OF_WEEK[day.getDay()];
	const monthOfYear = MONTHS_OF_YEAR[day.getMonth()];

	return {
		week: dayOfWeek,
		date: monthOfYear + ' ' + day.getDate() + ', ' + day.getFullYear(),
		year: day.getFullYear(),
		isToday,
		fullDate: day,
		...data,
	};
};

const moveMenuItem = async (req, res) => {
	const dayOne = req.params.menuID;
	const dayTwo = req.body.swapMenuID;

	await swapMenu(dayOne, dayTwo);

	res.status(200).json({ success: true });
};
const addMenuItem = async (req, res) => {
	const weekID = req.body.weekID;
	const recipeID = req.body.recipeID;

	await insertMenu(null, recipeID, weekID, null, null, null, null, null, null, null);

	res.status(200).json({ success: true });
};

const removeMenuItem = async (req, res) => {
	const menuID = req.params.menuID;

	await deleteMenu(menuID);

	res.status(200).json({ success: true });
};

const changeMenuItem = async (req, res) => {
	const menuID = req.params.menuID;
	const recipeID = req.body.recipeID;

	const newMenuDay = {
		recipeID,
		isSkipped: 0,
		isLeftovers: 0,
		isMade: 0,
		skipReason: '',
		originalWeight: null,
		adjustedWeight: null,
		originalRanking: null,
		totalRankings: null,
		adjustedRanking: null,
		isAged: null,
		isNewArrival: null,
		matchedIngredients: null
	};
	await updateMenu(newMenuDay, menuID);

	res.status(200).json({ success: true });
};

const changeMenuNotes = async (req, res) => {
	const menuID = req.params.menuID;
	const dailyNotes = req.body.dailyNotes;

	const update = {
		DailyNotes: dailyNotes,
	};

	await updateMenu(update, menuID);

	res.status(200).json({ success: true });
};

const generateMenu = async (req, res) => {
	let weekOffset = req.params.weekOffset;

	if (weekOffset == 'current') {
		weekOffset = 0;
	}

	// When you VIEWED the week it already made a WEEK for you, so this will never be an insert
	const { weekID, startDate } = await getOrInsertWeek(weekOffset);

	let recipes = await selectAllRecipesByLastMadeOrder();

	const pickedRecipes = await getRandomWeightedRecipe(recipes, 7);

	for (let i = 0; i < 7; i++) {
		const day = new Date(startDate.getTime());
		day.setHours(24 * i);

		const formattedDateForDB = day.toISOString().slice(0, 10);
		const pickedRecipe = pickedRecipes[i];

		const existingMenu = await selectMenuByDay(formattedDateForDB);

		if (existingMenu.length === 0) {
			await insertMenu(
				day,
				pickedRecipe.RecipeID,
				weekID,
				pickedRecipe.originalRanking,
				pickedRecipe.adjustedRanking,
				pickedRecipe.originalRanking,
				pickedRecipe.adjustedRanking,
				pickedRecipe.isAged,
				pickedRecipe.IsNewArrival,
				pickedRecipe.totalRankings,
				pickedRecipe.matchedIngredients
			);
			console.log(`Day inserted into Menu - ${pickedRecipe.RecipeID}, ${pickedRecipe.Name}, ${pickedRecipe.adjustedWeight}`);
		} else {
			const updatedMenu = {
				recipeID: pickedRecipe.RecipeID,
				originalWeight: pickedRecipe.originalWeight,
				adjustedWeight: pickedRecipe.adjustedWeight,
				matchedIngredients: pickedRecipe.matchedIngredients,
				originalRanking: pickedRecipe.originalRanking,
				adjustedRanking: pickedRecipe.adjustedRanking,
				isAged: pickedRecipe.isAged,
				isNewArrival: pickedRecipe.IsNewArrival,
				totalRankings: pickedRecipe.totalRankings,
			};
			await updateMenu(updatedMenu, existingMenu[0].MenuID);
			console.log('Day already exists in Menu', existingMenu);
		}
	}

	res.status(200).json({ success: true });
};

const rerollMenuItem = async (req, res) => {
	let menuID = req.params.menuID;
	let excludedRecipeIDs = req.body.excludedRecipeIDs;

	let recipes = await selectAllRecipesByLastMadeOrder(excludedRecipeIDs);

	const pickedRecipes = await getRandomWeightedRecipe(recipes, 1);

	const updatedMenu = {
		recipeID: pickedRecipes[0].RecipeID,
		isSkipped: 0,
		isMade: 0,
		skipReason: '',
		originalWeight: pickedRecipes[0].originalWeight,
		adjustedWeight: pickedRecipes[0].adjustedWeight,
		matchedIngredients: pickedRecipes[0].matchedIngredients,
		originalRanking: pickedRecipes[0].originalRanking,
		adjustedRanking: pickedRecipes[0].adjustedRanking,
		isAged: pickedRecipes[0].isAged,
		isNewArrival: pickedRecipes[0].IsNewArrival,
		totalRankings: pickedRecipes[0].totalRankings,
	};

	const updatedPromise = updateMenu(updatedMenu, menuID);

	updatedPromise.then(
		() => {
			res.status(200).json(pickedRecipes[0]);
		},
		(error) => {
			res.status(500).json({ message: error });
		}
	);
};

const madeMenuItem = async (req, res) => {
	const menuID = req.params.menuID;
	const isMade = req.body.isMade;
	const recipeID = req.body.recipeID;
	const isUseToday = req.body.isUseToday;

	const updatedMenu = {
		isMade,
	};

	const updatePromise = updateMenu(updatedMenu, menuID);

	updatePromise
		.then(
			() => {
				// Return another promise that gets the Menu from the DB
				// Handled by the second then
				return selectMenuByMenuID(menuID);
			},
			(error) => {
				res.status(500).json({ message: error });
			}
		)
		.then(
			async (result) => {
				const recipeFromDB = await selectRecipeByID(recipeID);

				const madeDate = isUseToday ? new Date() : result[0].Day;

				let updatedRecipe = {};

				if (isMade) {
					// Create a backup of the last made date
					updatedRecipe.PreviousLastMade = recipeFromDB.lastmade;
					updatedRecipe.lastmade = madeDate;
					updatedRecipe.IsNewArrival = 0;
				} else {
					// Restore the previous last made date
					updatedRecipe.PreviousLastMade = null;
					updatedRecipe.lastmade = recipeFromDB.PreviousLastMade;
				}

				// Return another promise that updates the recipe
				// Handled by the third then
				return updateRecipe(updatedRecipe, recipeID);
			},
			(error) => {
				res.status(500).json({ message: error });
			}
		)
		.then(
			() => {
				res.status(200).json({ success: true });
			},
			(error) => {
				res.status(500).json({ message: error });
			}
		);
};

const skipMenuItem = async (req, res) => {
	const menuID = req.params.menuID;
	const isSkipped = req.body.isSkipped;
	const skipReason = req.body.skipReason;

	const updatedMenu = {
		isSkipped,
		skipReason,
	};

	const updatePromise = updateMenu(updatedMenu, menuID);

	updatePromise.then(
		(result) => {
			res.status(200).json(result);
		},
		(error) => {
			res.status(500).json({ message: error });
		}
	);
};

const leftoversMenuItem = async (req, res) => {
	const menuID = req.params.menuID;
	const isLeftovers = req.body.isLeftovers;

	const updatedMenu = {
		isLeftovers,
	};

	const updatePromise = updateMenu(updatedMenu, menuID);

	updatePromise.then(
		(result) => {
			res.status(200).json(result);
		},
		(error) => {
			res.status(500).json({ message: error });
		}
	);
};

const auditHandler = async (req, res) => {
	let recipes = await selectAllRecipesByLastMadeOrder();

	const recipesWithThumbnails = await Promise.all(recipes.map((r) => addThumbnails(r)));
	const { sortedRecipes } = await getWeightedRecipes( recipesWithThumbnails );

	res.status(200).json({sortedRecipes});
};

// THE ALGORITHM
const getWeightedRecipes = async (recipes) => {
	const fridgeItems = await selectAllFridge();
	let totalWeight = 0;

	const filteredRecipes = recipes.filter((r) => r.Category === 'Dinner' && r.IsActive);

	// Recipes are assumed to be LastMade order with the newly made recipes first, with the lower weights
	for (let itemIndex = 0; itemIndex < filteredRecipes.length; itemIndex++) {
		let recipe = filteredRecipes[itemIndex];
		let originalWeight = itemIndex + 1;
		let adjustedWeight = originalWeight;
		let isAged = false;

		const lastMadeDateUTC = new Date(recipe.lastmade);
		const lastMadeDate = new TZDate(lastMadeDateUTC, 'America/New_York');

		const dayCount = differenceInDays(lastMadeDate, new Date());

		// console.log("DAY COUNT", dayCount);

		const ingredientTags = (await selectIngredientTagsByRecipeID(recipe.RecipeID)).map( i => i.IngredientTagID);


		const matchingIngredients = fridgeItems.filter(fridgeItem => ingredientTags.includes(fridgeItem.IngredientTagID)).length;

		// Once we reach the back half of the recipes, skew the weight even more so they are more likely
		if (itemIndex > filteredRecipes.length / 2) {
			// Extra weight for the back half
			adjustedWeight = adjustedWeight * 1.1;
			isAged = true;
		}

		if (recipe.IsNewArrival) {
			// New arrivals are heavy weighted
			adjustedWeight = adjustedWeight * 1.6;
		}


		if( matchingIngredients > 0) {
			if( dayCount < -28 ) {
				adjustedWeight = adjustedWeight + (matchingIngredients * 50);
			} else {
				// We just ate this, don't let the fact we have the ingredients bring it to the top again
				adjustedWeight = adjustedWeight + (matchingIngredients * 10);
			}
		}

		// console.log(`ADD WEIGHT : RecipeID ${recipe.RecipeID}, ${recipe.Name}, ${recipe.lastmade}, Original Weight ${originalWeight} Weight ${adjustedWeight}`);

		recipe = {
			originalRanking: filteredRecipes.length - itemIndex,
			originalWeight,
			adjustedWeight: adjustedWeight.toFixed(2),
			isAged,
			totalRankings: filteredRecipes.length,
			matchedIngredients: matchingIngredients,
			ingredientTags,
			...recipe,
		};
		filteredRecipes[itemIndex] = recipe;
		totalWeight += adjustedWeight;
	}

	// The weights have changed, we need to sort the array again
	// Step 1: Sort objects by weight in descending order.
	const sortedRecipes = filteredRecipes.slice().sort((a, b) => a.adjustedWeight - b.adjustedWeight);

	sortedRecipes.forEach((recipe, index) => {
		recipe.adjustedRanking = sortedRecipes.length - index;
	});

	// sortedRecipes.forEach((recipe, index) => {
	// 	console.log(
	// 		`ADJUSTED WEIGHT : RecipeID ${recipe.RecipeID}, ${recipe.Name}, ${recipe.lastmade} | WEIGHTS ${recipe.originalWeight}, ${recipe.adjustedWeight} | RANKS ${recipe.originalRanking}, ${recipe.adjustedRanking}`
	// 	);
	// });

	return { totalWeight, sortedRecipes };
}


const getRandomWeightedRecipe = async (recipes, amountToPick) => {
	
	let { totalWeight, sortedRecipes } = await getWeightedRecipes( recipes);

	let pickedRecipes = [];

	console.log('TOTAL WEIGHT', totalWeight);

	// Pick x randoms with a weighted distribution
	for (let itemNumber = 0; itemNumber < amountToPick; itemNumber++) {
		// How this works: pick a random number between 0 and the SUM of all the weights
		let randomWeight = Math.floor(Math.random() * totalWeight);
		console.log('RANDOM WEIGHT', randomWeight);

		// Then loop through every item, subtracting the weight of each item from the random number
		// Once the random number is less than 0, pick that item
		// The items with the higher weights are more likely to get the random number to zero faster
		// The items with a weight of 1 are less likely to get that number below 0, but it is possible
		// All depends on the random number that was chosen - if it's low, the lower weights have a chance, if it's very high, the higher weighted items
		// have more of a chance to chip away at that number

		// The order of the filteredRecipesis important - the low weights need to be first so they are less likely to decrement that total and win
		// Our highest weights are at the end so they are survivors, the early ones get killed first
		for (let recipe of sortedRecipes) {
			// Don't count weights of already picked items
			if (!recipe.picked) {
				// The number would be less than zero - chosen
				if (randomWeight < recipe.adjustedWeight) {
					recipe.picked = true;
					// Removing that item from the array will also remove its weight from the total
					totalWeight -= recipe.adjustedWeight;
					console.log(
						`PICKED : ${recipe.RecipeID}, ${recipe.Name}, ${recipe.lastmade} | WEIGHTS ${recipe.originalWeight}, ${recipe.adjustedWeight} | RANKS ${recipe.originalRanking}, ${recipe.adjustedRanking}`
					);
					pickedRecipes.push(recipe);
					break;
				} else {
					// console.log('SUB', { randomWeight, adj: recipe.adjustedWeight });
					randomWeight = randomWeight - recipe.adjustedWeight;
				}
			}
		}
	}

	return pickedRecipes;
};

export const getWeekRange = (date) => {
	let dayOfWeek = date.getDay();

	// We need to offset the day of the week so Saturday is the start of the week
	// Actual day => desired offset
	// 6 - Saturday   => 0
	// 0 - Sunday 	  => 1
	// 1 - Monday     => 2
	// 2 - Tuesday    => 3
	// 3 - Wednesday  => 4
	// 4 - Thursday   => 5
	// 5 - Friday     => 6
	let dayOfWeekWithSaturdayOffset = (dayOfWeek + 1) % 7;

	const daysAgoStart = dayOfWeekWithSaturdayOffset * -1;
	const daysFutureEnd = 6 - dayOfWeekWithSaturdayOffset;

	let startDate = new Date(date.getTime());
	startDate.setHours(24 * daysAgoStart);

	let endDate = new Date(date.getTime());
	endDate.setHours(24 * daysFutureEnd);

	return {
		startDate,
		endDate,
	};
};

export const getDaysForAWeek = (weekOffset) => {
	// Page -2 - Two weeks ago
	// Page -1 - Last week
	// Page 0 or "current" - Current week
	// Page 1 - Next week
	// Page 2 - In two weeks
	if (weekOffset == 'current') {
		weekOffset = 0;
	}

	let todaysDate = new Date();
	todaysDate.setHours(24 * 7 * weekOffset);

	let dayOfWeek = todaysDate.getDay();

	// We need to offset the day of the week so Saturday is the start of the week
	// Actual day => desired offset
	// 6 - Saturday   => 0
	// 0 - Sunday 	  => 1
	// 1 - Monday     => 2
	// 2 - Tuesday    => 3
	// 3 - Wednesday  => 4
	// 4 - Thursday   => 5
	// 5 - Friday     => 6
	let dayOfWeekWithSaturdayOffset = (dayOfWeek + 1) % 7;

	const daysAgoStart = dayOfWeekWithSaturdayOffset * -1;
	const daysFutureEnd = 6 - dayOfWeekWithSaturdayOffset;

	let daysArray = [];

	// On Monday from -2 days to +4 days
	for (let daysAgo = daysAgoStart; daysAgo <= daysFutureEnd; daysAgo++) {
		let historyDate = new Date(todaysDate.getTime());
		historyDate.setHours(24 * daysAgo);
		daysArray.push(historyDate);
	}

	return daysArray;
};

const router = express.Router();

/**
 * Get the dates for the week desired to draw the menu, not to generate anything
 * However, the code used to get the week will be reused in /generateMenu
 * Always based on the current time, so if we check on friday it will show week 1, if we check on saturday it will show week 2
 */
router.get('/api/menu/audit', auditHandler);
router.get('/api/menu/:weekOffset', getMenuForWeek);
router.post('/api/menu/move/:menuID', [checkAdminMiddleware], moveMenuItem);
router.delete('/api/menu/:menuID', [checkAdminMiddleware], removeMenuItem);
router.post('/api/menu/change/:menuID', [checkAdminMiddleware], changeMenuItem);
router.put('/api/menu', [checkAdminMiddleware], addMenuItem);
router.post('/api/menu/notes/:menuID', [checkAdminMiddleware], changeMenuNotes);
router.post('/api/menu/generate/:weekOffset', [checkAdminMiddleware], generateMenu);
router.post('/api/menu/reroll/:menuID', [checkAdminMiddleware], rerollMenuItem);
router.post('/api/menu/made/:menuID', [checkAdminMiddleware], madeMenuItem);
router.patch('/api/menu/skip/:menuID', [checkAdminMiddleware], skipMenuItem);
router.patch('/api/menu/leftovers/:menuID', [checkAdminMiddleware], leftoversMenuItem);

export default router;
