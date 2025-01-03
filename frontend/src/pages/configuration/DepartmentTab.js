import { useState } from 'react';
import { Input } from 'reactstrap';
import BasicEditPanel from './BasicEditPanel';
import { useAuth } from '@blackpenguins/penguinore-common-ext';

const DepartmentTab = () => {
	return (
		<BasicEditPanel
			label="Departments"
			apiFetch="/api/ingredientDepartments"
			apiInsert="/api/ingredientDepartments"
			apiUpdate="/api/ingredientDepartments"
			idColumn="IngredientDepartmentID"
			AdditionalOption={PositionInput}
		/>
	);
};

const PositionInput = ({ element }) => {
	const authContext = useAuth();
	const tokenFromStorage = authContext.tokenFromStorage;

	const changePosition = async (option) => {
		await fetch('/api/ingredientDepartments', {
			method: 'PATCH',
			body: JSON.stringify({ id: element.IngredientDepartmentID, position: option }),
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${tokenFromStorage}`,
			},
		});
	};

	const [position, setPosition] = useState(element.Position);

	const updatePosition = (option) => {
		setPosition(option);
		changePosition(option);
	};

	return (
		<span className="form-floating">
			<Input
				className="edit-book-dropdown"
				type="number"
				onChange={(e) => {
					updatePosition(e.target.value);
				}}
				value={position}
			/>
			<label htmlFor="edit-book-dropdown">Position</label>
		</span>
	);
};

export default DepartmentTab;
