import { useState, useEffect, useRef } from 'react';
import { Col, Input, Row, Button } from 'reactstrap';
import { useAuth } from '@blackpenguins/penguinore-common-ext';
import { Edit } from 'react-feather';

const ShoppingListExtraTableRow = ({ item, showCheckedItems, tokenFromStorage, fetchShoppingListExtras }) => {
	const authContext = useAuth();
	const [isChecked, setIsChecked] = useState(item.IsChecked);
	const [name, setName] = useState(item.Name);
	const [editMode, setEditMode] = useState(false);
	const inputRef = useRef(null);

	const setValue = async (isChecked) => {
		setIsChecked(isChecked);
		await updateShoppingList(item.ShoppingListExtraID, isChecked, name, tokenFromStorage);
		fetchShoppingListExtras();
	};

	const classes = ['list-row'];

	useEffect( () => {
		if (editMode && inputRef.current) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, [editMode]);

	if (isChecked) {
		classes.push('checked');

		if (!showCheckedItems) {
			return null;
		}
	}

	const handleEditButton = async () => {
		if( !editMode ) {
			setEditMode(true);
		} else {
			await updateShoppingList(item.ShoppingListExtraID, isChecked, name, tokenFromStorage);
			setEditMode(false);
			fetchShoppingListExtras();
		}
	}

	return (
		<Row className={classes.join(' ')}>
			<Col className="check-col col" lg={1} sm={2} xs={2}>
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
			<Col className="name-col col" lg={10} sm={8} xs={8}>
				{!editMode && item.Name}
				{editMode && <Input
						enterKeyHint='done'
						innerRef={inputRef}
						className="editInput"
						id="edit-name"
						type="text"
						onChange={(e) => {
							setName(e.target.value);
						}}
						onKeyDown={(e) => {
							if (e.key === 'Enter' || e.key === 'done') {
								e.preventDefault();
								handleEditButton();
							}
						}}
						value={name}
					/>
				}
			</Col>
			<Col className="name-col col" lg={1} sm={2} xs={2}>
				<Button color='link' inline onClick={() => handleEditButton()}>
					<Edit />
				</Button>
			</Col>
		</Row>
	);
};

const updateShoppingList = async (shoppingListExtraID, isChecked, name, tokenFromStorage) => {
	await fetch(`/api/shoppingListExtra`, {
		method: 'PATCH',

		body: JSON.stringify({ shoppingListExtraID, isChecked, name }),
		headers: {
			// This is required. NodeJS server won't know how to read it without it.
			'Content-Type': 'application/json',
			Authorization: `Bearer ${tokenFromStorage}`,
		},
	});
};

export default ShoppingListExtraTableRow;
