import express from 'express';
import { selectAllRecipes, selectRecipeByID, updateRecipe } from '../database/recipes.js';
import { insertMenu, selectMenuByDay, selectMenuByMenuID, swapMenu, updateMenu } from '../database/menu.js';
import { checkAdminMiddleware } from './auth.js';
import { addIngredientsToRecipe } from './recipes.js';
import { insertWeek } from '../database/week.js';

const DAYS_OF_WEEK = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const MONTHS_OF_YEAR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const getMenuForWeek = async (req, res) => {
	let weekOffset = req.params.weekOffset;

	const responseObject = await getMenuForWeekOffset(weekOffset);
	// No DB calls, no promises needed because there is no async
	res.status(200).json(responseObject);
};

export const getMenuForWeekOffset = async (weekOffset) => {
	const daysArray = getDaysForAWeek(weekOffset);

	let formattedDaysArray = [];

	const firstDayOfWeek = daysArray[0];
	const firstDayOfTheYear = new Date(firstDayOfWeek.getFullYear(), 0, 1);
	const dayOfYear = Math.floor((firstDayOfWeek - firstDayOfTheYear) / (24 * 60 * 60 * 1000));
	const weekOfYear = Math.floor(dayOfYear / 7);

	for (const day of daysArray) {
		const formattedDateForDB = day.toISOString().slice(0, 10);

		const doesExistPromise = await selectMenuByDay(formattedDateForDB);

		let menuExistsDetails = {};

		if (doesExistPromise.length > 0) {
			const menuFromDB = doesExistPromise[0];
			if (menuFromDB?.RecipeID) {
				const recipeFromDB = await selectRecipeByID(menuFromDB.RecipeID);
				await addIngredientsToRecipe(recipeFromDB);
				menuExistsDetails = {
					menuID: menuFromDB.MenuID,
					isMade: menuFromDB.IsMade,
					isSkipped: menuFromDB.IsSkipped,
					isLeftovers: menuFromDB.IsLeftovers,
					skipReason: menuFromDB.skipReason,
					weekID: menuFromDB.WeekID,
					recipe: recipeFromDB,
				};
			}
		}

		formattedDaysArray.push(withDateDetails(day, menuExistsDetails));
	}

	return {
		weekOfYear,
		days: formattedDaysArray,
	};
};

export const withDateDetails = (day, data) => {
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

const changeMenuItem = async (req, res) => {
	const menuID = req.params.menuID;
	const recipeID = req.body.recipeID;

	const newMenuDay = {
		recipeID,
		isSkipped: 0,
		isLeftovers: 0,
		isMade: 0,
		skipReason: '',
	};
	await updateMenu(newMenuDay, menuID);

	res.status(200).json({ success: true });
};

const generateMenu = async (req, res) => {
	let weekOffset = req.params.weekOffset;

	if (weekOffset == 'current') {
		weekOffset = 0;
	}

	const daysArray = getDaysForAWeek(weekOffset);
	const newWeekID = (await insertWeek()).id;

	let recipes = await selectAllRecipes();

	const pickedRecipes = getRandomWeightedRecipe(recipes, daysArray.length);

	for (let dayIndex = 0; dayIndex < daysArray.length; dayIndex++) {
		const day = daysArray[dayIndex];
		const formattedDateForDB = day.toISOString().slice(0, 10);
		const pickedRecipe = pickedRecipes[dayIndex];

		const existingMenu = await selectMenuByDay(formattedDateForDB);

		if (existingMenu.length === 0) {
			await insertMenu(day, pickedRecipe.RecipeID, newWeekID);
			console.log(`Day inserted into Menu - ${pickedRecipe.RecipeID}, ${pickedRecipe.Name}, ${pickedRecipe.weight}`);
		} else {
			const updatedMenu = {
				recipeID: pickedRecipe.RecipeID,
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

	let recipes = await selectAllRecipes(excludedRecipeIDs);

	const pickedRecipes = getRandomWeightedRecipe(recipes, 1);

	const updatedMenu = {
		recipeID: pickedRecipes[0].RecipeID,
		isSkipped: 0,
		isMade: 0,
		skipReason: '',
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
			(result) => {
				console.log('RES', result[0].Day);
				const madeDate = result[0].Day;

				let updatedRecipe = {
					lastMade: isMade ? madeDate : null,
				};

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

const getRandomWeightedRecipe = (recipes, amountToPick) => {
	let totalWeight = 0;

	const filteredRecipes = recipes.filter((r) => r.Category === 'Dinner' && r.IsActive);

	// Recipes are assumed to be LastMade order with the newly made recipes first, with the lower weights
	for (let itemIndex = 0; itemIndex < filteredRecipes.length; itemIndex++) {
		let recipe = filteredRecipes[itemIndex];
		let originalWeight = itemIndex + 1;
		let desiredWeight = originalWeight;

		// Once we reach the back half of the recipes, skew the weight even more so they are more likely
		if (itemIndex > filteredRecipes.length / 2) {
			// Extra weight for the back half
			desiredWeight = desiredWeight * 1.1;
		}

		recipe = {
			weight: desiredWeight,
			...recipe,
		};
		console.log(`ADD WEIGHT : RecipeID ${recipe.RecipeID}, ${recipe.Name}, ${recipe.lastmade}, Original Weight ${originalWeight} Weight ${recipe.weight}`);
		filteredRecipes[itemIndex] = recipe;
		totalWeight += desiredWeight;
	}

	let pickedRecipes = [];

	// Pick x randoms with a weighted distribution
	for (let itemNumber = 0; itemNumber < amountToPick; itemNumber++) {
		// How this works: pick a random number between 0 and the SUM of all the weights
		let randomWeight = Math.floor(Math.random() * totalWeight);

		// Then loop through every item, subtracting the weight of each item from the random number
		// Once the random number is less than 0, pick that item
		// The items with the higher weights are more likely to get the random number to zero faster
		// The items with a weight of 1 are less likely to get that number below 0, but it is possible
		// All depends on the random number that was chosen - if it's low, the lower weights have a chance, if it's very high, the higher weighted items
		// have more of a chance to chip away at that number
		for (let recipe of filteredRecipes) {
			// Don't count weights of already picked items
			if (!recipe.picked) {
				// The number would be less than zero - chosen
				if (randomWeight < recipe.weight) {
					recipe.picked = true;
					// Removing that item from the array will also remove its weight from the total
					totalWeight -= recipe.weight;
					console.log(`PICKED : ${recipe.RecipeID}, ${recipe.Name}, ${recipe.lastmade}, ${recipe.weight}`);
					pickedRecipes.push(recipe);
					break;
				} else {
					randomWeight = randomWeight - recipe.weight;
				}
			}
		}
	}

	return pickedRecipes;
};

const getDaysForAWeek = (weekOffset) => {
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

	console.log('Day of Week with Saturday offset', dayOfWeekWithSaturdayOffset);

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
router.get('/api/menu/:weekOffset', getMenuForWeek);
router.post('/api/menu/move/:menuID', [checkAdminMiddleware], moveMenuItem);
router.post('/api/menu/change/:menuID', [checkAdminMiddleware], changeMenuItem);
router.post('/api/menu/generate/:weekOffset', [checkAdminMiddleware], generateMenu);
router.post('/api/menu/reroll/:menuID', [checkAdminMiddleware], rerollMenuItem);
router.post('/api/menu/made/:menuID', [checkAdminMiddleware], madeMenuItem);
router.patch('/api/menu/skip/:menuID', [checkAdminMiddleware], skipMenuItem);
router.patch('/api/menu/leftovers/:menuID', [checkAdminMiddleware], leftoversMenuItem);

export default router;
