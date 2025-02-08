import { useState } from 'react';
import { Col, Input, Row } from 'reactstrap';
import { useAuth } from '@blackpenguins/penguinore-common-ext';

const ShoppingListExtraTableRow = ({ item, showCheckedItems, tokenFromStorage }) => {
	const authContext = useAuth();
	const [isChecked, setIsChecked] = useState(item.IsChecked);

	const setValue = (isChecked) => {
		setIsChecked(isChecked);
		updateShoppingList(item.ShoppingListExtraID, isChecked, tokenFromStorage);
	};

	const classes = ['list-row'];

	if (isChecked) {
		classes.push('checked');

		if (!showCheckedItems) {
			return null;
		}
	}

	return (
		<Row className={classes.join(' ')}>
			<Col className="check-col col" lg={1} sm={1} xs={1}>
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
			<Col className="name-col col" lg={11} sm={11} xs={11}>
				{item.Name}
			</Col>
		</Row>
	);
};

const updateShoppingList = async (shoppingListExtraID, isChecked, tokenFromStorage) => {
	await fetch(`/api/shoppingListExtra/checked`, {
		method: 'PATCH',

		body: JSON.stringify({ shoppingListExtraID, isChecked }),
		headers: {
			// This is required. NodeJS server won't know how to read it without it.
			'Content-Type': 'application/json',
			Authorization: `Bearer ${tokenFromStorage}`,
		},
	});
};

export default ShoppingListExtraTableRow;
