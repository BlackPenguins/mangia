import { useCallback, useContext, useEffect, useState } from 'react';
import { Button, Input } from 'reactstrap';
import AuthContext from '../authentication/auth-context';

import './ShoppingList.css';

const ShoppingList = () => {
	const authContext = useContext(AuthContext);
	const tokenFromStorage = authContext.token;

	const [recipes, setRecipes] = useState([]);
	const [shoppingListItems, setShoppingListItems] = useState([]);

	// const fetchMenu = useCallback(async () => {
	// 	const response = await fetch(`/api/menu/-3`);
	// 	const data = await response.json();
	// 	const menu = data.days;
	// 	console.log('Retrieved Menu from Server', menu);
	// 	setRecipes(menu.filter((m) => m.recipe).map((m) => m.recipe));
	// }, []);

	const fetchShoppingList = useCallback(async () => {
		const response = await fetch(`/api/shoppingListItem`, {
			method: 'GET',
			headers: {
				// This is required. NodeJS server won't know how to read it without it.
				'Content-Type': 'application/json',
				Authorization: `Bearer ${tokenFromStorage}`,
			},
		});
		const data = await response.json();
		setShoppingListItems(data);
	}, []);

	useEffect(() => {
		// fetchMenu();
		fetchShoppingList();
	}, [fetchShoppingList]);

	// let ingredientsOld = [];
	// let groupedIngredients = [];

	// if (recipes.length > 0) {
	// 	ingredientsOld = recipes.flatMap((r) => r.ingredients);

	// 	console.log('ingredients', { ingredients: ingredientsOld });

	// 	const ingredientTotals = sumIngredients(ingredientsOld);

	// 	console.log('ingredientTotals', { ingredientTotals });

	// 	groupedIngredients = groupByDepartment(ingredientTotals);

	// 	console.log('groups', { groupedIngredients });
	// }

	const buildShoppingList = useCallback(async () => {
		await fetch(`/api/shoppingListItem/build`, {
			method: 'POST',
			headers: {
				// This is required. NodeJS server won't know how to read it without it.
				'Content-Type': 'application/json',
				Authorization: `Bearer ${tokenFromStorage}`,
			},
		});
		fetchShoppingList();
	}, [fetchShoppingList]);

	console.log('STORM', shoppingListItems);
	return (
		<>
			<div className="section-title">
				<h2>Shopping List</h2>
			</div>

			{authContext.isAdmin && (
				<div className="generate-button">
					<Button color="success" onClick={buildShoppingList} className="site-btn">
						Build Shopping List
					</Button>
				</div>
			)}

			<div>
				<ul>
					{shoppingListItems &&
						shoppingListItems.map((group, index) => (
							<div class="container">
								<div class="shopping-list">
									<table class="table">
										<thead>
											<tr>
												<th>&nbsp;</th>
												<th>{group.department}</th>
												<th>Recipe Count</th>
											</tr>
										</thead>
										<tbody>
											{group.ingredients.map((ingredient, i) => (
												<ShoppingListRow ingredient={ingredient} tokenFromStorage={tokenFromStorage} />
											))}
										</tbody>
									</table>
								</div>
							</div>
						))}
				</ul>
			</div>

			{/* <RecipeData recipes={recipes} /> */}
		</>
	);
};

const updateShoppingList = async (shoppingListItemID, isChecked, tokenFromStorage) => {
	await fetch(`/api/shoppingListItem/checked`, {
		method: 'PATCH',

		body: JSON.stringify({ shoppingListItemID, isChecked }),
		headers: {
			// This is required. NodeJS server won't know how to read it without it.
			'Content-Type': 'application/json',
			Authorization: `Bearer ${tokenFromStorage}`,
		},
	});
};

const ShoppingListRow = ({ ingredient, tokenFromStorage }) => {
	const [isChecked, setIsChecked] = useState(ingredient.isChecked);

	const setValue = (isChecked) => {
		setIsChecked(isChecked);
		updateShoppingList(ingredient.shoppingListItemID, isChecked, tokenFromStorage);
	};

	const classes = [];

	if (isChecked) {
		classes.push('checked');
	}

	return (
		<tr className={classes.join(' ')}>
			<td>
				<div className="check-container">
					<Input
						checked={isChecked}
						onClick={() => {
							setValue(!isChecked);
						}}
						type="checkbox"
					/>
				</div>
			</td>
			<td className="product-name">
				<span className="name">
					{ingredient.amount} {ingredient.name}
				</span>
			</td>
			<td className="recipe-count product-name">{ingredient.recipeCount}</td>
		</tr>
	);
};

const RecipeData = ({ recipes }) => {
	return (
		<div>
			{recipes.map((recipe) => {
				const ingredients = recipe?.ingredients;
				return (
					<>
						<div>
							<b>{recipe.Name}</b>
						</div>
						{ingredients && (
							<ul className="ingredient-debug">
								{ingredients.map((i) => {
									const teaspoonResults = convertToTeaspoons(i.calculatedAmount);
									const tagName = i.tagName || 'NO TAG';
									const isWholeUnits = teaspoonResults.wholeUnits ? 'YES' : 'NO';
									const teaspoonAmount = teaspoonResults.amount || 0;

									return (
										<>
											<li>{i.name}</li>
											<ul>
												<li>{`Tag [${tagName}]`}</li>
												<li>{`Whole Units? [${isWholeUnits}]`}</li>
												<li>{`Calculated Amount [${i.calculatedAmount}]`}</li>
												<li>{`Calculated Value [${i.calculatedValue}]`}</li>
												<li>{`Total Teaspoons [${teaspoonAmount}]`}</li>
											</ul>
										</>
									);
								})}
							</ul>
						)}
					</>
				);
			})}
		</div>
	);
};
const sumIngredients = (ingredients) => {
	const finalIngredients = [];

	for (const ingredient of ingredients) {
		if (ingredient.tagID != null) {
			// It can be tracked
			if (ingredient.calculatedAmount) {
				const converted = convertToTeaspoons(ingredient.calculatedAmount);

				const foundTotalIndex = finalIngredients.findIndex((i) => i.name === ingredient.tagName && i.wholeUnits === converted.wholeUnits);

				if (foundTotalIndex === -1) {
					finalIngredients.push({
						name: ingredient.tagName,
						value: converted.amount,
						wholeUnits: converted.wholeUnits,
						unit: converted.unit,
						recipeCount: 1,
						ingredientDepartment: ingredient.ingredientDepartment,
						ingredientDepartmentPosition: ingredient.ingredientDepartmentPosition,
					});
				} else {
					finalIngredients[foundTotalIndex].value += converted.amount;
					finalIngredients[foundTotalIndex].recipeCount++;
				}
			} else {
				console.log('NOT FOUND ', ingredient);
			}
		}
	}

	// 1 TB =  3 TSP
	// 1/4 CUP = 12 TSP
	// 1/3 CUP = 16 TSP
	// 1/2 CUP = 24 TSP
	// 2/3 CUP = 32 TSP
	// 3/4 CUP = 36 TSP
	//   1 CUP = 48 TSP

	// const testFinalIngredients = [
	// 	{
	// 		name: 'Egg',
	// 		value: 1,
	// 		wholeUnits: false,
	// 	},
	// 	{
	// 		name: 'Egg',
	// 		value: 3,
	// 		wholeUnits: false,
	// 	},
	// 	{
	// 		name: 'Egg',
	// 		value: 6,
	// 		wholeUnits: false,
	// 	},
	// 	{
	// 		name: 'Egg',
	// 		value: 7,
	// 		wholeUnits: false,
	// 	},
	// 	{
	// 		name: 'Egg',
	// 		value: 12,
	// 		wholeUnits: false,
	// 	},
	// 	{
	// 		name: 'Egg',
	// 		value: 16,
	// 		wholeUnits: false,
	// 	},
	// 	{
	// 		name: 'Egg',
	// 		value: 24,
	// 		wholeUnits: false,
	// 	},
	// 	{
	// 		name: 'Egg',
	// 		value: 32,
	// 		wholeUnits: false,
	// 	},
	// 	{
	// 		name: 'Egg',
	// 		value: 36,
	// 		wholeUnits: false,
	// 	},
	// 	{
	// 		name: 'Egg',
	// 		value: 48,
	// 		wholeUnits: false,
	// 	},
	// 	{
	// 		name: 'Egg',
	// 		value: 60,
	// 		wholeUnits: false,
	// 	},
	// 	{
	// 		name: 'Egg',
	// 		value: 64,
	// 		wholeUnits: false,
	// 	},
	// 	{
	// 		name: 'Egg',
	// 		value: 72,
	// 		wholeUnits: false,
	// 	},
	// 	{
	// 		name: 'Egg',
	// 		value: 80,
	// 		wholeUnits: false,
	// 	},
	// 	{
	// 		name: 'Egg',
	// 		value: 84,
	// 		wholeUnits: false,
	// 	},
	// 	{
	// 		name: 'Egg',
	// 		value: 96,
	// 		wholeUnits: false,
	// 	},
	// 	{
	// 		name: 'Egg',
	// 		value: 100,
	// 		wholeUnits: false,
	// 	},
	// 	{
	// 		name: 'Egg',
	// 		value: 712,
	// 		wholeUnits: false,
	// 	},
	// 	{
	// 		name: 'Egg',
	// 		value: 52,
	// 		wholeUnits: false,
	// 	},
	// ];

	console.log('ENTERING', finalIngredients);

	for (const finalIngredient of finalIngredients) {
		if (!finalIngredient.wholeUnits) {
			let convertedValue = '';
			let totalCups = '';
			let leftOverCups = '';
			let teaspoonAmount = finalIngredient.value;
			if (teaspoonAmount >= 48) {
				totalCups = Math.round(teaspoonAmount / 48);
				leftOverCups = teaspoonAmount % 48;
				convertedValue = totalCups;
			} else {
				leftOverCups = teaspoonAmount;
			}

			if (leftOverCups > 0) {
				if (leftOverCups < 12) {
					if (totalCups > 0) {
						convertedValue += ' cups ';
					}

					if (leftOverCups < 2) {
						convertedValue += ' ' + leftOverCups + ' tsp';
					} else {
						convertedValue += ' ' + Math.round(leftOverCups / 3) + ' tb';
					}
				} else if (leftOverCups < 16) {
					convertedValue += ' 1/4 cup';
				} else if (leftOverCups < 24) {
					convertedValue += ' 1/3 cup';
				} else if (leftOverCups < 32) {
					convertedValue += ' 1/2 cup';
				} else if (leftOverCups < 36) {
					convertedValue += ' 2/3 cup';
				} else if (leftOverCups < 48) {
					convertedValue += ' 3/4 cup';
				}
			} else {
				convertedValue += ' cups';
			}

			finalIngredient.finalValue = convertedValue;
		} else {
			finalIngredient.finalValue = `${finalIngredient.value} ${finalIngredient.unit}`;
		}

		console.log(`---------------${finalIngredient.value} ====> ${finalIngredient.finalValue}`);
	}

	return finalIngredients;
};

const convertToTeaspoons = (value) => {
	if (!value) {
		return `UNCONVERTED`;
	}

	const smarterRe = /([\d\/\s]+)\s*(cup|teaspoon|tsp|tb|tablespoon|pound|ounce)?(?:s)?/;

	const matches = value.match(smarterRe);

	const amount = matches[1]?.trim();
	const measurement = matches[2]?.trim();

	console.log(`Amount [${amount}] Measurement [${measurement}]`);

	let baseTeaspoons = 0;
	let baseMultiplier = 0;

	let isWholeUnit = false;
	let unit = null;

	switch (measurement) {
		case 'cup':
			baseTeaspoons = 48;
			break;
		case 'tb':
		case 'tablespoon':
			baseTeaspoons = 3;
			break;
		case 'tsp':
		case 'teaspoon':
			baseTeaspoons = 1;
			break;
		case 'ounce':
			isWholeUnit = true;
			unit = 'ounce';
			break;
		case 'pound':
			isWholeUnit = true;
			unit = 'pound';
			break;
		default:
			isWholeUnit = true;
			unit = '';
	}

	switch (amount) {
		case '1/2':
			baseMultiplier = 0.5;
			break;
		case '1/4':
			baseMultiplier = 0.25;
			break;
		case '1/3':
			baseMultiplier = 0.33333333;
			break;
		case '2/3':
			baseMultiplier = 0.66666666;
			break;
		case '1/8':
			baseMultiplier = 0.125;
			break;
		case '3/4':
			baseMultiplier = 0.75;
			break;
		default:
			baseMultiplier = amount;
	}

	if (isWholeUnit) {
		return { wholeUnits: true, unit, amount: parseFloat(baseMultiplier) };
	} else {
		return { wholeUnits: false, amount: parseFloat(baseTeaspoons * baseMultiplier) };
	}
};

export default ShoppingList;
