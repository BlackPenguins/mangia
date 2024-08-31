import { ContactSupportOutlined } from '@mui/icons-material';
import LoadingText from 'components/Common/LoadingText';
import { useCallback, useContext, useEffect, useState } from 'react';
import { Button, Input, Row, Col } from 'reactstrap';
import AuthContext from '../authentication/auth-context';

import './ShoppingList.css';

const CHECKBOX_WIDTH = 1;
const NAME_WIDTH = 5;
const RECIPE_COUNT_WIDTH = 1;
const STORE_PRICES_SECTION_WIDTH = 5;
const STORE_PRICES_WIDTH = 4;

const MOBILE_CHECKBOX_WIDTH = 1;
const MOBILE_NAME_WIDTH = 9;
const MOBILE_RECIPE_COUNT_WIDTH = 2;
const MOBILE_STORE_PRICES_SECTION_WIDTH = 12;
const MOBILE_STORE_PRICES_WIDTH = 4;

const ShoppingList = () => {
	const authContext = useContext(AuthContext);
	const tokenFromStorage = authContext.token;

	const [shoppingListItems, setShoppingListItems] = useState(null);
	const [stores, setStores] = useState(null);

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
		setShoppingListItems(data.departments);
		setStores(data.stores);

		console.log('DAT', data);
	}, []);

	useEffect(() => {
		fetchShoppingList();
	}, [fetchShoppingList]);

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

	const [selectedStore, setSelectedStore] = useState(null);

	return (
		<section className="hero">
			<div className="container">
				<div className="section-title">
					<h2>Shopping List</h2>
				</div>

				{authContext.isAdmin && (
					<div className="shopping-list-button">
						<Button color="success" onClick={buildShoppingList} className="site-btn">
							Build Shopping List
						</Button>
					</div>
				)}

				<div class="row">
					<div class="col-lg-3">
						<StoreFilters stores={stores} setSelectedStore={setSelectedStore} />
					</div>
					<div class="col-lg-9">
						<ShoppingListTable shoppingListItems={shoppingListItems} stores={stores} tokenFromStorage={tokenFromStorage} selectedStore={selectedStore} />
					</div>
				</div>
			</div>
		</section>
	);
};

const StoreFilters = ({ stores, setSelectedStore }) => {
	return (
		<div class="hero__categories">
			<div class="hero__categories__all">
				<span>Stores</span>
			</div>
			<ul>
				<li>
					<a href="#" onClick={() => setSelectedStore(null)}>
						All
					</a>
				</li>

				{stores &&
					stores.map((store) => {
						return (
							<li>
								<a href="#" onClick={() => setSelectedStore(store.storeID)}>
									{store.storeName}
								</a>
							</li>
						);
					})}
			</ul>
		</div>
	);
};
const ShoppingListTable = ({ shoppingListItems, stores, tokenFromStorage, selectedStore }) => {
	return (
		<>
			{shoppingListItems == null && <LoadingText text="Loading shopping list" />}
			{shoppingListItems?.length == 0 && <span>No shopping list found</span>}
			{shoppingListItems &&
				shoppingListItems.map((group, index) => {
					const hasLowestPriceInDepartment = group.ingredients.some((i) => storeHasLowestPrice(selectedStore, i));

					const showGroup = hasLowestPriceInDepartment;

					if (!showGroup) {
						return null;
					} else {
						return (
							<div className="container">
								<div class="shopping-list">
									<Row className="heading">
										<Col className="col" lg={NAME_WIDTH + 1} sm={MOBILE_NAME_WIDTH} xs={MOBILE_NAME_WIDTH}>
											{group.department}
										</Col>
										<Col className="col" lg={RECIPE_COUNT_WIDTH} sm={MOBILE_RECIPE_COUNT_WIDTH} xs={MOBILE_RECIPE_COUNT_WIDTH}>
											Count
										</Col>
									</Row>
									{group.ingredients.map((ingredient, i) => (
										<ShoppingListTableRow ingredient={ingredient} tokenFromStorage={tokenFromStorage} stores={stores} selectedStore={selectedStore} />
									))}
								</div>
							</div>
						);
					}
				})}
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

const ShoppingListTableRow = ({ ingredient, tokenFromStorage, stores, selectedStore }) => {
	const [isChecked, setIsChecked] = useState(ingredient.isChecked);
	const [prices, setPrices] = useState([]);

	useEffect(() => {
		setPrices(ingredient.prices);
	}, [ingredient]);

	const setValue = (isChecked) => {
		setIsChecked(isChecked);
		updateShoppingList(ingredient.shoppingListItemID, isChecked, tokenFromStorage);
	};

	if (!storeHasLowestPrice(selectedStore, ingredient)) {
		// Hide rows that don't have the lowest price for that selected store
		return null;
	}

	const classes = ['list-row'];

	if (isChecked) {
		classes.push('checked');
	}

	return (
		<Row className={classes.join(' ')}>
			<Col className="check-col col" lg={CHECKBOX_WIDTH} sm={MOBILE_CHECKBOX_WIDTH} xs={MOBILE_CHECKBOX_WIDTH}>
				<Input
					checked={isChecked}
					onClick={() => {
						setValue(!isChecked);
					}}
					type="checkbox"
				/>
			</Col>
			<Col className="name-col col" lg={NAME_WIDTH} sm={MOBILE_NAME_WIDTH} xs={MOBILE_NAME_WIDTH}>
				{ingredient.amount} {ingredient.name}
			</Col>
			<Col className="count-col col" lg={RECIPE_COUNT_WIDTH} sm={MOBILE_RECIPE_COUNT_WIDTH} xs={MOBILE_RECIPE_COUNT_WIDTH}>
				{ingredient.recipeCount}
			</Col>
			<Col className="stores-col col" lg={STORE_PRICES_SECTION_WIDTH} sm={MOBILE_STORE_PRICES_SECTION_WIDTH} xs={MOBILE_STORE_PRICES_SECTION_WIDTH}>
				<Row>
					{stores &&
						stores.map((store) => {
							return <PriceInput ingredientTagID={ingredient.ingredientTagID} store={store} prices={prices} tokenFromStorage={tokenFromStorage} />;
						})}
				</Row>
			</Col>
		</Row>
	);
};

const storeHasLowestPrice = (selectedStore, ingredient) => {
	if (selectedStore != null) {
		// We are filtering by stores
		const lowestStorePrice = ingredient?.prices.find((p) => p.isLowest);
		if (lowestStorePrice && selectedStore !== lowestStorePrice.storeID) {
			return false;
		}
	}

	return true;
};

const PriceInput = ({ ingredientTagID, prices, store, tokenFromStorage }) => {
	const [price, setPrice] = useState(null);
	const [isLowest, setIsLowest] = useState(false);
	const [ingredientTagPriceID, setIngredientTagPriceID] = useState(null);

	useEffect(() => {
		const priceForStore = prices.find((p) => p.storeID == store.storeID);

		if (priceForStore) {
			setPrice(priceForStore.price.toFixed(2));
			setIngredientTagPriceID(priceForStore.ingredientTagPriceID);
			setIsLowest(priceForStore?.isLowest);
		}
	}, [prices]);

	const updatePrice = async (price) => {
		const body = {
			Price: price,
			IngredientTagPriceID: ingredientTagPriceID,
		};

		await fetch(`/api/stores/prices`, {
			method: 'PATCH',
			body: JSON.stringify(body),
			headers: {
				// This is required. NodeJS server won't know how to read it without it.
				'Content-Type': 'application/json',
				Authorization: `Bearer ${tokenFromStorage}`,
			},
		});
	};

	const insertPrice = async (price) => {
		const body = {
			Price: price,
			StoreID: store.storeID,
			IngredientTagID: ingredientTagID,
		};

		console.log('Inserting recipe', body);
		const response = await fetch(`/api/stores/prices`, {
			method: 'PUT',
			body: JSON.stringify(body),
			headers: {
				// This is required. NodeJS server won't know how to read it without it.
				'Content-Type': 'application/json',
				Authorization: `Bearer ${tokenFromStorage}`,
			},
		});

		const data = await response.json();
		setIngredientTagPriceID(data.ingredientTagPriceID);
	};

	const priceHandler = () => {
		if (ingredientTagPriceID === null) {
			insertPrice(price);
		} else {
			updatePrice(price);
		}
	};

	const classes = [];

	if (isLowest) {
		classes.push('lowest-price');
	}

	console.log('NA', store);
	return (
		<Col className={classes.join(' ')} lg={STORE_PRICES_WIDTH} sm={MOBILE_STORE_PRICES_WIDTH} xs={MOBILE_STORE_PRICES_WIDTH}>
			<div className="form-floating notes">
				<Input
					type="text"
					id="store-name"
					value={price}
					onChange={(e) => {
						setPrice(e.target.value);
					}}
					onBlur={(e) => {
						priceHandler(e.target.value);
					}}
				/>
				<label for="store-name">{store.storeName}</label>
			</div>
		</Col>
	);
};

export default ShoppingList;
