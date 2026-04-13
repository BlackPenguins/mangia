import { useEffect, useState } from 'react';
import { Button, Col, Input, Row } from 'reactstrap';
import PriceInput from './PriceInput';
import { useAuth } from '@blackpenguins/penguinore-common-ext';
import { ProductionQuantityLimits } from '@mui/icons-material';

// 6 header
const CHECKBOX_WIDTH = 1
const NAME_WIDTH = 5;

// 6 header
const RECIPE_COUNT_WIDTH = 1;
const STORE_PRICES_SECTION_WIDTH = 5;

// 10 header
const MOBILE_CHECKBOX_WIDTH = 2;
const MOBILE_NAME_WIDTH = 7;

// 2 header
const MOBILE_RECIPE_COUNT_WIDTH = 3;
const MOBILE_STORE_PRICES_SECTION_WIDTH = 12;

const ShoppingListTableRow = ({
	ingredient,
	showCheckedItems,
	showPrices,
	tokenFromStorage,
	stores,
	selectedStore,
	storeHasLowestPrice,
	updateShoppingListWithServerData,
	checkedForStore,
	setCheckedForStore,
	markIngredientAvailabilityHandler
}) => {
	const authContext = useAuth();
	const [isChecked, setIsChecked] = useState(ingredient.isChecked);
	const [prices, setPrices] = useState([]);

	useEffect(() => {
		setPrices(ingredient.prices);
	}, [ingredient]);

	const setValue = (isChecked) => {
		setIsChecked(isChecked);
		updateShoppingList(ingredient.shoppingListItemID, isChecked, tokenFromStorage, updateShoppingListWithServerData);
		
		if( selectedStore ) {
			markIngredientAvailabilityHandler(ingredient.ingredientTagID, selectedStore.storeID, true);
		}
	};

	// Stop doing this for now, because we a pivoting the use into Store Mode
	// Instead of hiding rows that don't have lowest price, because the Pricing module is taking too long
	// We are creating a check off mode per store and building a database of availabilty

	// if (!storeHasLowestPrice(selectedStore, ingredient)) {
	// 	// Hide rows that don't have the lowest price for that selected store
	// 	return null;
	// }

	const classes = ['list-row'];

	if( selectedStore ) {
		const availability = ingredient?.availability[selectedStore?.storeID];

		if( availability ) {
			const isOutOfStock = !availability.isAvailable;
			if( isOutOfStock ){
				classes.push('out-of-stock');
			}
		}
	}

	if (isChecked || checkedForStore.includes(ingredient.ingredientTagID)) {
		classes.push('checked');

		if (!showCheckedItems) {
			return null;
		}
	}



	let countWidth;
	let mobileCountWidth;
	if (!showPrices) {
		countWidth = RECIPE_COUNT_WIDTH + STORE_PRICES_SECTION_WIDTH;
		mobileCountWidth = MOBILE_RECIPE_COUNT_WIDTH + MOBILE_STORE_PRICES_SECTION_WIDTH;
	} else {
		countWidth = RECIPE_COUNT_WIDTH;
		mobileCountWidth = MOBILE_RECIPE_COUNT_WIDTH;
	}


	return (
		<>
		<Row className={classes.join(' ')}>
			<Col className="check-col col" lg={CHECKBOX_WIDTH} sm={MOBILE_CHECKBOX_WIDTH} xs={MOBILE_CHECKBOX_WIDTH}>
				{authContext.isAdmin && (
					<Input
						checked={isChecked}
						onChange={() => {
							setValue(!isChecked);
						}}
						type="checkbox"
					/>
				)}
			</Col>
			<Col className="name-col col" lg={NAME_WIDTH} sm={MOBILE_NAME_WIDTH} xs={MOBILE_NAME_WIDTH}>
				{ingredient.amount} {ingredient.name}
				{ingredient?.isMissingUnits === 1 && (
					<span className='missing-units'>
						Missing Units
					</span>
				)}
			</Col>
			<Col className="count-col col" lg={countWidth} sm={mobileCountWidth} xs={mobileCountWidth}>
				{!showPrices && (
					<div>
						{ingredient.recipeCount}
						<span className='recipeNames'>{ingredient.recipeNames}</span>
						<OutOfStockButton tokenFromStorage={tokenFromStorage} selectedStore={selectedStore} ingredient={ingredient} setCheckedForStore={setCheckedForStore} markIngredientAvailabilityHandler={markIngredientAvailabilityHandler}/>
					</div>
				)}
			</Col>

			{showPrices && (
				<Col className="stores-col col" lg={STORE_PRICES_SECTION_WIDTH} sm={MOBILE_STORE_PRICES_SECTION_WIDTH} xs={MOBILE_STORE_PRICES_SECTION_WIDTH}>
					<Row>
						{stores &&
							stores.map((store) => {
								return <PriceInput key={store.storeID} ingredientTagID={ingredient.ingredientTagID} store={store} prices={prices} tokenFromStorage={tokenFromStorage} />;
							})}
					</Row>
				</Col>
			)}
		</Row>
		<Row className={classes.join(' ')}>
			<Col className='col col-border' lg={12}>
				<span className='recipeNames'>{ingredient.recipeNames}</span>
			</Col>
		</Row>
		</>
	);
};

const OutOfStockButton = ({markIngredientAvailabilityHandler, selectedStore, ingredient, setCheckedForStore}) => {
	if( !selectedStore) {
		return null;
	}

	const handleOutOfStockButton = async (ingredientID) => {
		setCheckedForStore( (prevState) => {
			return [ingredientID, ...prevState]
		})
		markIngredientAvailabilityHandler(ingredient.ingredientTagID, selectedStore.storeID, false);
	}

	return (
		<Button className='out-of-stock-btn' color='link' inline onClick={() => handleOutOfStockButton(ingredient.ingredientTagID)}>
			<ProductionQuantityLimits />
		</Button>
	)
}
const updateShoppingList = async (shoppingListItemID, isChecked, tokenFromStorage, updateShoppingListWithServerData) => {
	const response = await fetch(`/api/shoppingListItem/checked`, {
		method: 'PATCH',

		body: JSON.stringify({ shoppingListItemID, isChecked }),
		headers: {
			// This is required. NodeJS server won't know how to read it without it.
			'Content-Type': 'application/json',
			Authorization: `Bearer ${tokenFromStorage}`,
		},
	});

	const data = await response.json();
	updateShoppingListWithServerData(data.shoppingList);
};

export default ShoppingListTableRow;
