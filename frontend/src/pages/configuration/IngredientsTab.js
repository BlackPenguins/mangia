import { useCallback, useContext, useEffect, useState } from 'react';
import { Input } from 'reactstrap';
import AuthContext from '../../authentication/auth-context';
import BasicEditPanel from './BasicEditPanel';

const IngredientsTab = () => {
	return <BasicEditPanel label="Ingredient" apiFetch="/api/ingredientTags" apiUpdate="/api/ingredientTags" AdditionalOption={DepartmentDropdown} />;
};

const DepartmentDropdown = ({ element }) => {
	const authContext = useContext(AuthContext);
	const tokenFromStorage = authContext.token;

	const [departments, setDepartments] = useState(null);
	const fetchDepartments = useCallback(async () => {
		const response = await fetch('/api/ingredientDepartments', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		});
		const data = await response.json();
		const fetchedDepartments = data;
		setDepartments(fetchedDepartments);
	}, []);

	useEffect(() => {
		fetchDepartments();
	}, [fetchDepartments]);

	const changeDepartment = async (option) => {
		await fetch('/api/ingredientTags/department', {
			method: 'PATCH',
			body: JSON.stringify({ IngredientDepartmentID: option, IngredientTagID: element.IngredientTagID }),
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${tokenFromStorage}`,
			},
		});

		console.log('OPTION', { option, element });
	};

	return (
		<span className="form-floating">
			<Input
				className="edit-book-dropdown"
				type="select"
				onChange={(e) => {
					changeDepartment(e.target.value);
				}}
				value={element.IngredientDepartmentID}
			>
				<option value={0}>None</option>
				{departments &&
					departments.map((department) => {
						return <option value={department.IngredientDepartmentID}>{department.Name}</option>;
					})}
			</Input>
			<label for="edit-book-dropdown">Department</label>
		</span>
	);
};

export default IngredientsTab;
