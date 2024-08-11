import { useContext, useState } from 'react';
import { Input } from 'reactstrap';
import AuthContext from '../../authentication/auth-context';
import BasicEditPanel from './BasicEditPanel';

const DepartmentTab = () => {
	return <BasicEditPanel label="Department" apiFetch="/api/ingredientDepartments" apiUpdate="/api/ingredientDepartments" AdditionalOption={PositionInput} />;
};

const PositionInput = ({ element }) => {
	const authContext = useContext(AuthContext);
	const tokenFromStorage = authContext.token;

	const changePosition = async (option) => {
		await fetch('/api/ingredientDepartments', {
			method: 'PATCH',
			body: JSON.stringify({ IngredientDepartmentID: element.IngredientDepartmentID, Position: option }),
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${tokenFromStorage}`,
			},
		});

		console.log('OPTION', { option, element });
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
			<label for="edit-book-dropdown">Position</label>
		</span>
	);
};

export default DepartmentTab;
