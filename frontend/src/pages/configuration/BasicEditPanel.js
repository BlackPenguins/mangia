import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Button, Col, Input, Row } from 'reactstrap';
import AuthContext from '../../authentication/auth-context';
import LoadingText from '../../components/Common/LoadingText';

const BasicEditPanel = ({ label, apiFetch, apiUpdate, AdditionalOption }) => {
	const [elements, setElements] = useState(null);
	const fetchElements = useCallback(async () => {
		const response = await fetch(apiFetch, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		});
		const data = await response.json();
		const fetchedElements = data;
		setElements(fetchedElements);
	}, []);

	useEffect(() => {
		fetchElements();
	}, [fetchElements]);

	const authContext = useContext(AuthContext);
	const tokenFromStorage = authContext.token;

	const addElementInputRef = useRef();

	const onAddElementHandler = async () => {
		const newElement = {
			name: addElementInputRef.current.value,
		};

		const response = await fetch(apiUpdate, {
			method: 'PUT',
			body: JSON.stringify(newElement),
			headers: {
				// This is required. NodeJS server won't know how to read it without it.
				'Content-Type': 'application/json',
				Authorization: `Bearer ${tokenFromStorage}`,
			},
		});
		const data = await response.json();

		if (data.success) {
			fetchElements();
		}
		addElementInputRef.current.value = '';
	};

	return (
		<div className="container book-list">
			<h3>{label} List</h3>
			<div class="shoping__cart__table">
				{elements == null && <LoadingText text={`Loading ${label}s`} />}
				{elements && elements?.length === 0 && <div>No {label.toLowerCase()}s found</div>}
				<table>
					<tbody>
						{elements &&
							elements.map((book) => (
								<tr key={book.BookID}>
									<td className="shoping__cart__item" lg="6">
										{book.Name}
									</td>
									<td className="shoping__cart__item" lg="6">
										{AdditionalOption && <AdditionalOption element={book} />}
									</td>
								</tr>
							))}
					</tbody>
				</table>
			</div>
			<Row>
				<Col lg={4}>
					<div className="form-floating">
						<Input id="book-name" type="text" placeholder="Book Name" innerRef={addElementInputRef}></Input>
						<label for="book-name">{label} Name</label>
					</div>
				</Col>
				<Col lg={4} className="recipe-edit-btn">
					<Button size="sm" color="success" onClick={onAddElementHandler} className="site-btn">
						Add {label}
					</Button>
				</Col>
				<Col lg={4}></Col>
			</Row>
		</div>
	);
};

export default BasicEditPanel;
