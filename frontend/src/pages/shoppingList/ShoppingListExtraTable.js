import { Col, Row } from 'reactstrap';
import ShoppingListExtraTableRow from './ShoppingListExtraTableRow';
import NewItemInput from './NewItemInput';
import { useAuth } from '@blackpenguins/penguinore-common-ext';
import { useCallback, useEffect, useState } from 'react';

const ShoppingListExtraTable = ({ showCheckedItems, isWishlist }) => {
	const authContext = useAuth();
	const tokenFromStorage = authContext.tokenFromStorage;

	const [shoppingListExtras, setShoppingListExtras] = useState(null);

	const fetchShoppingListExtras = useCallback(async () => {
		const response = await fetch(`/api/shoppingListExtra?isWishlist=${isWishlist}`, {
			method: 'GET',
			headers: {
				// This is required. NodeJS server won't know how to read it without it.
				'Content-Type': 'application/json',
				Authorization: `Bearer ${tokenFromStorage}`,
			},
		});
		const data = await response.json();
		const arr = data.result;
		setShoppingListExtras(arr);
	}, [tokenFromStorage]);

	useEffect( () => {
		fetchShoppingListExtras()
	}, [fetchShoppingListExtras]);


	const classes = ['shopping-list-extra-section'];
	let title;

	if( isWishlist ) {
		classes.push('wish-list');
		title = 'Wish List';
	} else {
		classes.push('non-menu');
		title = 'Non-Menu Items';
	}

	const [totalUnchecked, setTotalUnchecked] = useState(0);

	useEffect(() => {
		setTotalUnchecked(shoppingListExtras?.filter( s => s.IsChecked === 0 ).length);
	}, [shoppingListExtras]);

	return (
		<div className={classes.join(' ')}>
			{authContext.isAdmin && <NewItemInput tokenFromStorage={tokenFromStorage} fetchShoppingListExtras={fetchShoppingListExtras} isWishlist={isWishlist} /> }
			<div className="container">
				<div className="shopping-list">
					<Row className='heading'>
						<Col className="col" lg={12} sm={12} xs={12}>
							<span>{title} ({totalUnchecked})</span>
						</Col>
					</Row>
					{shoppingListExtras &&
						shoppingListExtras.map((item) => {
							return <ShoppingListExtraTableRow key={item.ShoppingListExtraID} item={item} showCheckedItems={showCheckedItems} tokenFromStorage={tokenFromStorage} fetchShoppingListExtras={fetchShoppingListExtras} />;
						})}
				</div>
			</div>
		</div>
	);
};

export default ShoppingListExtraTable;
