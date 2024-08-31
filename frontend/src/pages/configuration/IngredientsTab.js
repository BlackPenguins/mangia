import { useCallback, useContext, useEffect, useState } from 'react';
import { Input } from 'reactstrap';
import AuthContext from '../../authentication/auth-context';
import BasicEditPanel from './BasicEditPanel';

const IngredientsTab = () => {
	return (
		<BasicEditPanel
			label="Ingredient"
			apiFetch="/api/ingredientTags"
			apiInsert="/api/ingredientTags"
			apiUpdate="/api/ingredientTags"
			idColumn="IngredientTagID"
			AdditionalOption={DepartmentDropdown}
		/>
	);
};

const DepartmentDropdown = ({ element }) => {
	const authContext = useContext(AuthContext);
	const tokenFromStorage = authContext.token;

	const [departmentID, setDepartmentID] = useState(element.IngredientDepartmentID);

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
		await fetch('/api/ingredientTags', {
			method: 'PATCH',
			body: JSON.stringify({ departmentID: option, id: element.IngredientTagID }),
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${tokenFromStorage}`,
			},
		});
		setDepartmentID(option);
	};

	const classes = ['edit-book-dropdown'];

	if (departmentID == null) {
		classes.push('unused');
	}

	return (
		<span className="form-floating">
			<Input
				className={classes.join(' ')}
				type="select"
				onChange={(e) => {
					changeDepartment(e.target.value);
				}}
				value={departmentID}
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
