import LoadingText from 'components/Common/LoadingText';
import { useToast } from 'context/toast-context';
import { useCallback, useContext, useEffect, useState } from 'react';
import { Button, Input, Row, Col, FormGroup, Label } from 'reactstrap';
import AuthContext from '../authentication/auth-context';

import './ShoppingList.scss';

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
	}, [tokenFromStorage]);

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
	}, [fetchShoppingList, tokenFromStorage]);

	const [selectedStore, setSelectedStore] = useState(null);
	const [hideCheckedItems, setHideCheckedItems] = useState(false);
	const [hidePrices, setHidePrices] = useState(false);

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

						<span class="hide-checked-items">
							<FormGroup switch>
								<Input
									type="switch"
									checked={hideCheckedItems}
									onClick={() => {
										setHideCheckedItems(!hideCheckedItems);
									}}
								/>
								<Label check>Hide Checked Items</Label>
							</FormGroup>
							<FormGroup switch>
								<Input
									type="switch"
									checked={hidePrices}
									onClick={() => {
										setHidePrices(!hidePrices);
									}}
								/>
								<Label check>Hide Prices</Label>
							</FormGroup>
						</span>
					</div>
				)}

				<div class="row">
					<div class="col-lg-3">
						<StoreFilters stores={stores} selectedStore={selectedStore} setSelectedStore={setSelectedStore} />
					</div>
					<div class="col-lg-9">
						<ShoppingListTable
							hideCheckedItems={hideCheckedItems}
							hidePrices={hidePrices}
							shoppingListItems={shoppingListItems}
							stores={stores}
							tokenFromStorage={tokenFromStorage}
							selectedStore={selectedStore}
							fetchShoppingList={fetchShoppingList}
						/>
					</div>
				</div>
			</div>
		</section>
	);
};

const StoreFilters = ({ stores, selectedStore, setSelectedStore }) => {
	return (
		<div class="hero__categories">
			<div class="hero__categories__all">
				<span>Stores</span>
			</div>
			<ul>
				<li>
					<Button className={selectedStore === null ? 'active' : 'non-active'} color="link" onClick={() => setSelectedStore(null)}>
						All
					</Button>
				</li>

				{stores &&
					stores.map((store) => {
						return (
							<li>
								<Button className={selectedStore === store.storeID ? 'active' : 'non-active'} color="link" onClick={() => setSelectedStore(store.storeID)}>
									{store.storeName}
								</Button>
							</li>
						);
					})}
			</ul>
		</div>
	);
};
const ShoppingListTable = ({ hideCheckedItems, hidePrices, shoppingListItems, stores, tokenFromStorage, selectedStore, fetchShoppingList }) => {
	return (
		<>
			{shoppingListItems == null && <LoadingText text="Loading shopping list" />}
			{shoppingListItems?.length === 0 && <span>No shopping list found</span>}
			{shoppingListItems &&
				shoppingListItems.map((group, index) => {
					const hasLowestPriceInDepartment = group.ingredients.some((i) => storeHasLowestPrice(selectedStore, i));

					// This isn't working as we check them off. We should move everything into states so the list can update easily without a fetch.
					// Break this into components in a package so we can put a state in this callback
					const hasAllChecked = group.ingredients.every((i) => i.isChecked);

					const showGroup = hasLowestPriceInDepartment;

					if (!showGroup || (hideCheckedItems && hasAllChecked)) {
						// Hide the group if all items within the group are checked off
						return null;
					} else {
						const classes = ['shopping-list'];

						if (group.department === 'Unknown') {
							classes.push('unknown-department');
						}
						return (
							<div key={index} className="container">
								<div class={classes.join(' ')}>
									<Row className="heading">
										<Col className="col" lg={NAME_WIDTH + 1} sm={MOBILE_NAME_WIDTH} xs={MOBILE_NAME_WIDTH}>
											{group.department}
										</Col>
										<Col className="col" lg={RECIPE_COUNT_WIDTH} sm={MOBILE_RECIPE_COUNT_WIDTH} xs={MOBILE_RECIPE_COUNT_WIDTH}>
											Count
										</Col>
									</Row>
									{group.ingredients.map((ingredient, i) => (
										<ShoppingListTableRow
											key={i}
											hideCheckedItems={hideCheckedItems}
											hidePrices={hidePrices}
											ingredient={ingredient}
											tokenFromStorage={tokenFromStorage}
											stores={stores}
											selectedStore={selectedStore}
											fetchShoppingList={fetchShoppingList}
										/>
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

const ShoppingListTableRow = ({ ingredient, hideCheckedItems, hidePrices, tokenFromStorage, stores, selectedStore, fetchShoppingList }) => {
	const [isChecked, setIsChecked] = useState(ingredient.isChecked);
	const [prices, setPrices] = useState([]);

	useEffect(() => {
		setPrices(ingredient.prices);
	}, [ingredient]);

	const setValue = (isChecked) => {
		setIsChecked(isChecked);
		updateShoppingList(ingredient.shoppingListItemID, isChecked, tokenFromStorage);
		fetchShoppingList();
	};

	if (!storeHasLowestPrice(selectedStore, ingredient)) {
		// Hide rows that don't have the lowest price for that selected store
		return null;
	}

	const classes = ['list-row'];

	if (isChecked) {
		classes.push('checked');

		if (hideCheckedItems) {
			return null;
		}
	}

	let countWidth;
	let mobileCountWidth;
	if (hidePrices) {
		countWidth = RECIPE_COUNT_WIDTH + STORE_PRICES_SECTION_WIDTH;
		mobileCountWidth = MOBILE_RECIPE_COUNT_WIDTH + MOBILE_STORE_PRICES_SECTION_WIDTH;
	} else {
		countWidth = RECIPE_COUNT_WIDTH;
		mobileCountWidth = MOBILE_RECIPE_COUNT_WIDTH;
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
			<Col className="count-col col" lg={countWidth} sm={mobileCountWidth} xs={mobileCountWidth}>
				{ingredient.recipeCount}
			</Col>
			{!hidePrices && (
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

export const PriceInput = ({ ingredientTagID, prices, store, tokenFromStorage }) => {
	const [price, setPrice] = useState(null);
	const [isLowest, setIsLowest] = useState(false);
	const [ingredientTagPriceID, setIngredientTagPriceID] = useState(null);

	useEffect(() => {
		const priceForStore = prices.find((p) => p.storeID === store.storeID);

		if (priceForStore) {
			setPrice(priceForStore.price.toFixed(2));
			setIngredientTagPriceID(priceForStore.ingredientTagPriceID);
			setIsLowest(priceForStore?.isLowest);
		}
	}, [prices, store]);

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

		console.log('Inserting price', body);
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

	const showToast = useToast();

	const priceHandler = () => {
		if (ingredientTagPriceID === null) {
			insertPrice(price);
		} else {
			updatePrice(price);
		}
		showToast('Shopping List', `Price updated for ${store.storeName}`);
	};

	const classes = [];

	if (isLowest) {
		classes.push('lowest-price');
	}

	return (
		<Col className={classes.join(' ')} lg={STORE_PRICES_WIDTH} sm={MOBILE_STORE_PRICES_WIDTH} xs={MOBILE_STORE_PRICES_WIDTH}>
			<div className="form-floating store-price">
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
				<label htmlFor="store-name">{store.storeName}</label>
			</div>
		</Col>
	);
};

export default ShoppingList;
