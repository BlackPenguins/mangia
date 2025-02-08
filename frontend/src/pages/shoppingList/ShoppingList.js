import { useToast } from 'context/toast-context';
import { useCallback, useEffect, useState } from 'react';
import { Button } from 'reactstrap';
import NewItemInput from './NewItemInput';

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
	const [shoppingListExtras, setShoppingListExtras] = useState(null);
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

	const fetchShoppingListExtras = useCallback(async () => {
		const response = await fetch(`/api/shoppingListExtra`, {
			method: 'GET',
			headers: {
				// This is required. NodeJS server won't know how to read it without it.
				'Content-Type': 'application/json',
				Authorization: `Bearer ${tokenFromStorage}`,
			},
		});
		const data = await response.json();
		const arr = data.result;
		console.log('ARR', arr);
		setShoppingListExtras(arr);
	}, [tokenFromStorage]);

	useEffect(() => {
		fetchShoppingList();
		fetchShoppingListExtras();
	}, [fetchShoppingList, fetchShoppingListExtras]);

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
	}, [fetchShoppingList, tokenFromStorage]);

	const [selectedStore, setSelectedStore] = useState(null);
	const [showCheckedItems, setShowCheckedItems] = useState(false);
	const [showPrices, setShowPrices] = useState(false);

	return (
		<section className="hero">
			<div className="container">
				<div className="section-title">
					<h2>Shopping List</h2>
				</div>

				{authContext.isAdmin && (
					<div class="row">
						<div class="col-lg-3"></div>
						<div class="col-lg-9">
							<div className="shopping-list-button">
								<Button onClick={buildShoppingList} className="mangia-btn success">
									Build Shopping List
								</Button>
							</div>
						</div>
					</div>
				)}

				<div class="row">
					<div class="col-lg-3">
						<StoreFilters stores={stores} selectedStore={selectedStore} setSelectedStore={setSelectedStore} />
						<ShoppingListControls
							showCheckedItems={showCheckedItems}
							setShowCheckedItems={setShowCheckedItems}
							showPrices={showPrices}
							setShowPrices={setShowPrices}
						/>
					</div>
					<div class="col-lg-9">
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

						{authContext.isAdmin && <NewItemInput tokenFromStorage={tokenFromStorage} fetchShoppingListExtras={fetchShoppingListExtras} /> }
						<ShoppingListExtraTable shoppingListExtras={shoppingListExtras} showCheckedItems={showCheckedItems} tokenFromStorage={tokenFromStorage} />
						
					</div>
				</div>
			</div>
		</section>
	);
};

export default ShoppingList;
