import { useToast } from 'context/toast-context';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Button, Col, Input, Row } from 'reactstrap';
import AuthContext from '../../authentication/auth-context';
import LoadingText from '../../components/Common/LoadingText';

const BasicEditPanel = ({ label, apiFetch, apiInsert, apiUpdate, idColumn, AdditionalOption }) => {
	const [items, setItems] = useState(null);

	const fetchItems = useCallback(async () => {
		const response = await fetch(apiFetch, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		});
		const data = await response.json();
		const fetchedItems = data;
		console.log('FETCHED', fetchedItems);
		setItems(fetchedItems);
	}, [apiFetch]);

	useEffect(() => {
		fetchItems();
	}, [fetchItems]);

	const authContext = useContext(AuthContext);
	const tokenFromStorage = authContext.token;

	const addItemInputRef = useRef();

	const onAddItemHandler = async () => {
		const newItem = {
			name: addItemInputRef.current.value,
		};

		const response = await fetch(apiInsert, {
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

	return (
		<div className="container book-list">
			<h3>{label} List</h3>
			<Row className="add-config-button">
				<Col lg={7}>
					<div className="form-floating">
						<Input id="item-name" type="text" placeholder="Item Name" innerRef={addItemInputRef}></Input>
						<label for="item-name">{label} Name</label>
					</div>
				</Col>
				<Col lg={5} className="recipe-edit-btn">
					<Button size="sm" color="success" onClick={onAddItemHandler} className="site-btn">
						Add {label}
					</Button>
				</Col>
			</Row>
			<div class="shoping__cart__table">
				{items == null && <LoadingText text={`Loading ${label}s`} />}
				{items && items?.length === 0 && <div>No {label.toLowerCase()}s found</div>}
				<table>
					<tbody>
						{items &&
							items.map((item) => (
								<tr key={item[idColumn]}>
									<td className="shoping__cart__item">
										<Row>
											<Col lg={(AdditionalOption && 6) || 12} sm={12}>
												<NameInput label={label} item={item} apiUpdate={apiUpdate} idColumn={idColumn} tokenFromStorage={tokenFromStorage} />
											</Col>
											<Col lg={6} sm={12} className="edit-additional">
												{AdditionalOption && <AdditionalOption element={item} />}
											</Col>
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

export const NameInput = ({ label, item, apiUpdate, idColumn, tokenFromStorage }) => {
	const [value, setValue] = useState(item.Name);

	const showToast = useToast();

	const onUpdateHandler = async () => {
		const newElement = {
			id: item[idColumn],
			name: value,
		};

		const response = await fetch(apiUpdate, {
			method: 'PATCH',
			body: JSON.stringify(newElement),
			headers: {
				// This is required. NodeJS server won't know how to read it without it.
				'Content-Type': 'application/json',
				Authorization: `Bearer ${tokenFromStorage}`,
			},
		});
		await response.json();

		showToast('Configuration', `${label} name edited`);
	};

	return (
		<div className="form-floating notes">
			<Input
				className="editInput"
				id="edit-name"
				type="text"
				placeholder="Name"
				onChange={(e) => {
					setValue(e.target.value);
				}}
				onBlur={(e) => {
					onUpdateHandler();
				}}
				value={value}
			/>
			<label for="edit-name">Name</label>
		</div>
	);
};

export default BasicEditPanel;
