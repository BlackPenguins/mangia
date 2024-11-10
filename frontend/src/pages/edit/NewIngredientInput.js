import { useState } from 'react';
import { PlusCircle } from 'react-feather';
import { Button, Col, Input, Row } from 'reactstrap';

export const NewIngredientInput = ({ tokenFromStorage, fetchRecipe, recipeID }) => {
	const [value, setValue] = useState('');

	const onAddHandler = async () => {
		await fetch(`/api/recipes/${recipeID}/ingredient`, {
			method: 'PUT',
			body: JSON.stringify({ name: value }),
			headers: {
				// This is required. NodeJS server won't know how to read it without it.
				'Content-Type': 'application/json',
				Authorization: `Bearer ${tokenFromStorage}`,
			},
		});

		setValue('');
		fetchRecipe();
	};

	const onKeyDownHandler = (e) => {
		if (e.key === 'Enter') {
			onAddHandler();
		}
	};

	return (
		<Row className="ingredient-row">
			<Col lg={12}>
				<Button className="add-ingredient-btn mangia-btn success" size="small" onClick={onAddHandler}>
					<PlusCircle />
				</Button>
				<div className="ingredient-input form-floating">
					<Input
						className="editInput"
						id="edit-name"
						type="text"
						placeholder="Name"
						onChange={(e) => {
							setValue(e.target.value);
						}}
						onKeyDown={(e) => {
							onKeyDownHandler(e);
						}}
						value={value}
					/>
					<label htmlFor="edit-name">New Ingredient</label>
				</div>
			</Col>
		</Row>
	);
};

export default NewIngredientInput;
