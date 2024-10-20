import { useState } from 'react';
import { PlusCircle } from 'react-feather';
import { Button, Col, Input, Row } from 'reactstrap';

export const NewItemInput = ({ tokenFromStorage, fetchShoppingListExtras }) => {
	const [value, setValue] = useState('');

	const onAddHandler = async () => {
		await fetch(`/api/shoppingListExtra`, {
			method: 'PUT',
			body: JSON.stringify({ name: value }),
			headers: {
				// This is required. NodeJS server won't know how to read it without it.
				'Content-Type': 'application/json',
				Authorization: `Bearer ${tokenFromStorage}`,
			},
		});

		setValue('');
		fetchShoppingListExtras();
	};

	return (
		<Row className="add-config-button">
			<Col lg={2}>
				<Button color="success" onClick={onAddHandler} className="site-btn add-item-button">
					<PlusCircle />
				</Button>
			</Col>
			<Col lg={10}>
				<div className="form-floating notes">
					<Input
						className="editInput"
						id="edit-name"
						type="text"
						placeholder="Name"
						onChange={(e) => {
							setValue(e.target.value);
						}}
						value={value}
					/>
					<label htmlFor="edit-name">New Item</label>
				</div>
			</Col>
		</Row>
	);
};

export default NewItemInput;
