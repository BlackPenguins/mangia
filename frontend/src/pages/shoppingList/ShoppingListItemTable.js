import LoadingText from 'components/Common/LoadingText';
import { Col, Row } from 'reactstrap';
import ShoppingListTableRow from './ShoppingListItemTableRow';
import { isIngredientChecked } from './ShoppingList';

// TODO: Combine this will the HEADERS in ShoppingList
const NAME_WIDTH = 6;
const RECIPE_COUNT_WIDTH = 6;

const MOBILE_NAME_WIDTH = 9;
const MOBILE_RECIPE_COUNT_WIDTH = 3;

const ShoppingListTable = ({
	showCheckedItems,
	showPrices,
	shoppingListItems,
	stores,
	tokenFromStorage,
	selectedStore,
	updateShoppingListWithServerData,
	checkedForStore,
	setCheckedForStore,
	markIngredientAvailabilityHandler
}) => {
	let storeColors = {};

	if( selectedStore ) {
		storeColors = {
			backgroundColor: selectedStore.storeColor,
			color: selectedStore.storeColor2
		};
	}
	return (
		<>
			{shoppingListItems == null && <LoadingText text="Loading shopping list" />}
			{shoppingListItems?.length === 0 && <span>No shopping list found</span>}
			{shoppingListItems &&
				shoppingListItems.map((group, index) => {
					const hasLowestPriceInDepartment = group.ingredients.some((i) => storeHasLowestPrice(selectedStore, i));

					// This isn't working as we check them off. We should move everything into states so the list can update easily without a fetch.
					// Break this into components in a package so we can put a state in this callback
					const hasAllChecked = group.ingredients.every((i) => isIngredientChecked(i, checkedForStore));

					const showGroup = hasLowestPriceInDepartment;

					if (!showGroup || (!showCheckedItems && hasAllChecked)) {
						// Hide the group if all items within the group are checked off
						return null;
					} else {
						const classes = ['shopping-list'];

						if (group.department === 'Unknown') {
							classes.push('unknown-department');
						}
						return (
							<div key={index} className="container">
								<div className={classes.join(' ')}>
									<Row className="heading" style={storeColors}>
										<Col className="col" lg={NAME_WIDTH} sm={MOBILE_NAME_WIDTH} xs={MOBILE_NAME_WIDTH}>
											{group.department}
										</Col>
										<Col className="col" lg={RECIPE_COUNT_WIDTH} sm={MOBILE_RECIPE_COUNT_WIDTH} xs={MOBILE_RECIPE_COUNT_WIDTH}>
											Count
										</Col>
									</Row>
									{group.ingredients.map((ingredient, i) => (
										<ShoppingListTableRow
											key={i}
											showCheckedItems={showCheckedItems}
											showPrices={showPrices}
											ingredient={ingredient}
											tokenFromStorage={tokenFromStorage}
											stores={stores}
											selectedStore={selectedStore}
											storeHasLowestPrice={storeHasLowestPrice}
											updateShoppingListWithServerData={updateShoppingListWithServerData}
											checkedForStore={checkedForStore}
											setCheckedForStore={setCheckedForStore}
											markIngredientAvailabilityHandler={markIngredientAvailabilityHandler}
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

export default ShoppingListTable;
