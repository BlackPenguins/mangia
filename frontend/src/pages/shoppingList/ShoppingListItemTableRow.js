import { useEffect, useState } from 'react';
import { Col, Input, Row } from 'reactstrap';
import PriceInput from './PriceInput';
import { useAuth } from '@blackpenguins/penguinore-common-ext';

const CHECKBOX_WIDTH = 1;
const NAME_WIDTH = 5;
const RECIPE_COUNT_WIDTH = 1;
const STORE_PRICES_SECTION_WIDTH = 5;

const MOBILE_CHECKBOX_WIDTH = 1;
const MOBILE_NAME_WIDTH = 9;
const MOBILE_RECIPE_COUNT_WIDTH = 2;
const MOBILE_STORE_PRICES_SECTION_WIDTH = 12;

const ShoppingListTableRow = ({
	ingredient,
	showCheckedItems,
	showPrices,
	tokenFromStorage,
	stores,
	selectedStore,
	fetchShoppingList,
	storeHasLowestPrice,
	updateShoppingListWithServerData,
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
	};

	if (!storeHasLowestPrice(selectedStore, ingredient)) {
		// Hide rows that don't have the lowest price for that selected store
		return null;
	}

	const classes = ['list-row'];

	if (isChecked) {
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
		<Row className={classes.join(' ')}>
			<Col className="check-col col" lg={CHECKBOX_WIDTH} sm={MOBILE_CHECKBOX_WIDTH} xs={MOBILE_CHECKBOX_WIDTH}>
				{authContext.isAdmin && (
					<Input
						checked={isChecked}
						onClick={() => {
							setValue(!isChecked);
						}}
						type="checkbox"
					/>
				)}
			</Col>
			<Col className="name-col col" lg={NAME_WIDTH} sm={MOBILE_NAME_WIDTH} xs={MOBILE_NAME_WIDTH}>
				{ingredient.amount} {ingredient.name}
			</Col>
			<Col className="count-col col" lg={countWidth} sm={mobileCountWidth} xs={mobileCountWidth}>
				{ingredient.recipeCount}
			</Col>
			{showPrices && (
				<Col className="stores-col col" lg={STORE_PRICES_SECTION_WIDTH} sm={MOBILE_STORE_PRICES_SECTION_WIDTH} xs={MOBILE_STORE_PRICES_SECTION_WIDTH}>
					<Row>
						{stores &&
							stores.map((store) => {
								return <PriceInput ingredientTagID={ingredient.ingredientTagID} store={store} prices={prices} tokenFromStorage={tokenFromStorage} />;
							})}
					</Row>
				</Col>
			)}
		</Row>
	);
};

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
