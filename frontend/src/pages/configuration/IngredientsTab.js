import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Col, Input, Row } from 'reactstrap';
import LoadingText from '../../components/Common/LoadingText';

import { NameInput } from './BasicEditPanel';
import { useToast } from 'context/toast-context';
import PriceInput from 'pages/shoppingList/PriceInput';
import { Trash2 } from 'react-feather';
import { useAuth, useBetterModal } from '@blackpenguins/penguinore-common-ext';

const IngredientsTab = () => {
	const [items, setItems] = useState(null);
	const [stores, setStores] = useState(null);

	const authContext = useAuth();
	const tokenFromStorage = authContext.tokenFromStorage;

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
		const fetchedDepartments = await response.json();
		const sortedDepartments = fetchedDepartments.sort((a, b) => {
			return a.Name.localeCompare(b.Name);
		});

		setDepartments(sortedDepartments);
	}, []);

	useEffect(() => {
		fetchItems();
		fetchDepartments();
	}, [fetchItems, fetchDepartments]);

	return (
		<div className="container book-list ingredient-list">
			<h3>Ingredients</h3>
			<Row className="add-config-button">
				<Col lg={7}>
					<div className="form-floating">
						<Input id="item-name" type="text" placeholder="Item Name" innerRef={addItemInputRef}></Input>
						<label htmlFor="item-name">Ingredient Name</label>
					</div>
				</Col>
				<Col lg={5} className="recipe-edit-btn">
					<Button size="sm" onClick={onAddItemHandler} className="mangia-btn success">
						Add Ingredient
					</Button>
				</Col>
			</Row>
			<div className="shoping__cart__table">
				{items == null && <LoadingText text={`Loading Ingredients`} />}
				{items && items?.length === 0 && <div>No Ingredients found</div>}
				<table>
					<tbody>
						{items &&
							items.map((item) => (
								<IngredientRow key={item.IngredientTagID} fetchItems={fetchItems} item={item} tokenFromStorage={tokenFromStorage} stores={stores} departments={departments} />
							))}
					</tbody>
				</table>
			</div>
		</div>
	);
};

const IngredientRow = ({ fetchItems, item, tokenFromStorage, stores, departments }) => {
	const removeHandler = async (closeModal) => {
		await fetch(`/api/ingredientTags/${item.IngredientTagID}`, {
			method: 'DELETE',
			headers: {
				// This is required. NodeJS server won't know how to read it without it.
				'Content-Type': 'application/json',
				Authorization: `Bearer ${tokenFromStorage}`,
			},
		});

		fetchItems();
		closeModal();
	};

	const { modal, openModal } = useBetterModal({
		title: 'Delete Ingredient',
		size: 'md',
		footer: (closeModal) => (
			<>
				<Button
					className="mangia-btn danger"
					onClick={() => {
						removeHandler(closeModal);
					}}
				>
					Delete
				</Button>
			</>
		),
		content: (closeModal) => <div>Are you sure you want to delete this ingredient tag from all recipes?</div>,
	});

	return (
		<tr key={item['IngredientTagID']}>
			<td className="shoping__cart__item">
				{modal}
				<Row>
					<Col lg={6} sm={12}>
						<NameInput label={'Ingredient'} item={item} apiUpdate={'/api/ingredientTags'} idColumn={'IngredientTagID'} tokenFromStorage={tokenFromStorage} />
					</Col>
					<Col lg={4} sm={10} xs={9}>
						<DepartmentDropdown item={item} departments={departments} />
					</Col>
					<Col className='delete-button-col' lg={2} xs={3}>
						<Button className="mangia-btn reduced danger" onClick={() => openModal()}>
							<Trash2 />
						</Button>
					</Col>
					{stores &&
						stores.map((store) => {
							return <PriceInput key={store.storeID} ingredientTagID={item.IngredientTagID} store={store} prices={item.prices} tokenFromStorage={tokenFromStorage} />;
						})}
				</Row>
			</td>
		</tr>
	);
};
const DepartmentDropdown = ({ item, departments }) => {
	const authContext = useAuth();
	const tokenFromStorage = authContext.tokenFromStorage;
	const showToast = useToast();

	const [departmentID, setDepartmentID] = useState(item.IngredientDepartmentID || 0);

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

	if (departmentID === 0) {
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
						return <option key={department.IngredientDepartmentID} value={department.IngredientDepartmentID}>{department.Name}</option>;
					})}
			</Input>
			<label htmlFor="edit-book-dropdown">Department</label>
		</span>
	);
};

export default IngredientsTab;
