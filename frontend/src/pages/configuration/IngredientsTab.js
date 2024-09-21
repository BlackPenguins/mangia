import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Button, Col, Input, Row } from 'reactstrap';
import LoadingText from '../../components/Common/LoadingText';

import AuthContext from '../../authentication/auth-context';
import { NameInput } from './BasicEditPanel';
import { PriceInput } from 'pages/ShoppingList';
import { useToast } from 'context/toast-context';

const IngredientsTab = () => {
	const [items, setItems] = useState(null);
	const [stores, setStores] = useState(null);

	const authContext = useContext(AuthContext);
	const tokenFromStorage = authContext.token;

	const addItemInputRef = useRef();

	const onAddItemHandler = async () => {
		const newItem = {
			name: addItemInputRef.current.value,
		};

		const response = await fetch('/api/ingredientTags', {
			method: 'PUT',
			body: JSON.stringify(newItem),
			headers: {
				// This is required. NodeJS server won't know how to read it without it.
				'Content-Type': 'application/json',
				Authorization: `Bearer ${tokenFromStorage}`,
			},
		});
		const data = await response.json();

		if (data.success) {
			fetchItems();
		}
		addItemInputRef.current.value = '';
	};

	const fetchItems = useCallback(async () => {
		const response = await fetch('/api/ingredientTags', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		});
		const data = await response.json();
		const fetchedItems = data;
		setItems(fetchedItems.ingredientsWithPrices);
		setStores(fetchedItems.stores);
	}, []);

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
		fetchItems();
		fetchDepartments();
	}, [fetchItems, fetchDepartments]);

	return (
		<div className="container book-list ingredient-list">
			<h3>Ingredient List</h3>
			<Row className="add-config-button">
				<Col lg={7}>
					<div className="form-floating">
						<Input id="item-name" type="text" placeholder="Item Name" innerRef={addItemInputRef}></Input>
						<label for="item-name">Ingredient Name</label>
					</div>
				</Col>
				<Col lg={5} className="recipe-edit-btn">
					<Button size="sm" color="success" onClick={onAddItemHandler} className="site-btn">
						Add Ingredient
					</Button>
				</Col>
			</Row>
			<div class="shoping__cart__table">
				{items == null && <LoadingText text={`Loading Ingredients`} />}
				{items && items?.length === 0 && <div>No Ingredients found</div>}
				<table>
					<tbody>
						{items &&
							items.map((item) => (
								<tr key={item['IngredientTagID']}>
									<td className="shoping__cart__item">
										<Row>
											<Col lg={6} sm={12}>
												<NameInput
													label={'Ingredient'}
													item={item}
													apiUpdate={'/api/ingredientTags'}
													idColumn={'IngredientTagID'}
													tokenFromStorage={tokenFromStorage}
												/>
											</Col>
											<Col lg={6} sm={12}>
												<DepartmentDropdown item={item} departments={departments} />
											</Col>
											{stores &&
												stores.map((store) => {
													return (
														<PriceInput
															ingredientTagID={item.IngredientTagID}
															store={store}
															prices={item.prices}
															tokenFromStorage={tokenFromStorage}
														/>
													);
												})}
										</Row>
									</td>
								</tr>
							))}
					</tbody>
				</table>
			</div>
		</div>
	);
};

const DepartmentDropdown = ({ item, departments }) => {
	const authContext = useContext(AuthContext);
	const tokenFromStorage = authContext.token;
	const showToast = useToast();

	const [departmentID, setDepartmentID] = useState(item.IngredientDepartmentID);

	const changeDepartment = async (option) => {
		await fetch('/api/ingredientTags', {
			method: 'PATCH',
			body: JSON.stringify({ departmentID: option, id: item.IngredientTagID }),
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${tokenFromStorage}`,
			},
		});
		setDepartmentID(option);
		showToast('Configuration', `Department edited`);
	};

	const classes = ['edit-book-dropdown'];

	if (departmentID == null) {
		classes.push('unused');
	}

	return (
		<span className="form-floating store-department">
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
