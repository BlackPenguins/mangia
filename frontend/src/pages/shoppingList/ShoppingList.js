import { useToast } from 'context/toast-context';
import { useCallback, useEffect, useState } from 'react';
import { Button, Col, Row } from 'reactstrap';

import './ShoppingList.scss';
import ShoppingListControls from './ShoppingListControls';
import ShoppingListExtraTable from './ShoppingListExtraTable';
import ShoppingListTable from './ShoppingListItemTable';
import StoreFilters from './StoreFilters';
import { useAuth } from '@blackpenguins/penguinore-common-ext';

const ShoppingList = () => {
	const authContext = useAuth();
	const tokenFromStorage = authContext.tokenFromStorage;

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
		updateShoppingListWithServerData(data);
	}, [tokenFromStorage]);

	const updateShoppingListWithServerData = (data) => {
		setShoppingListItems(data.departments);
		setStores(data.stores);
	};

	useEffect(() => {
		fetchShoppingList();
	}, [fetchShoppingList]);

	const showToast = useToast();

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
		showToast('Shopping List', 'Shopping list has been rebuilt.');
	}, [fetchShoppingList, showToast, tokenFromStorage]);

	const [selectedStore, setSelectedStore] = useState(null);
	const [showCheckedItems, setShowCheckedItems] = useState(false);
	const [showPrices, setShowPrices] = useState(false);

	const totalUncheckedShoppingItems = shoppingListItems?.flatMap( i => i.ingredients).filter(s => s.isChecked === 0 ).length || 0;
	
	return (
		<section className="hero">
			<div className="container">
				<div className="section-title">
					<h2>Shopping List ({totalUncheckedShoppingItems})</h2>
				</div>

				{authContext.isAdmin && (
					<Row>
						<Col lg={3}></Col>
						<Col lg={9}>
							<div className="shopping-list-button">
								<Button onClick={buildShoppingList} className="mangia-btn success">
									Build Shopping List
								</Button>
							</div>
						</Col>
					</Row>
				)}

				<Row>
					<Col lg={3}>
						<StoreFilters stores={stores} selectedStore={selectedStore} setSelectedStore={setSelectedStore} />
						<ShoppingListControls
							showCheckedItems={showCheckedItems}
							setShowCheckedItems={setShowCheckedItems}
							showPrices={showPrices}
							setShowPrices={setShowPrices}
						/>
					</Col>
					<Col lg={9}>
						<ShoppingListTable
							showCheckedItems={showCheckedItems}
							showPrices={showPrices}
							shoppingListItems={shoppingListItems}
							stores={stores}
							tokenFromStorage={tokenFromStorage}
							selectedStore={selectedStore}
							fetchShoppingList={fetchShoppingList}
							updateShoppingListWithServerData={updateShoppingListWithServerData}
						/>

						<ShoppingListExtraTable showCheckedItems={showCheckedItems} isWishlist={false} />
						<ShoppingListExtraTable showCheckedItems={showCheckedItems} isWishlist={true} />
					</Col>
				</Row>
			</div>
		</section>
	);
};

export default ShoppingList;
