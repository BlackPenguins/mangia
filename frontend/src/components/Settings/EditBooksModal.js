import { useContext, useRef } from 'react';
import { Button, Col, Input, Row } from 'reactstrap';
import AuthContext from '../../authentication/auth-context';
import Modal from '../Modal';
import './EditBooksModal.css';

// TODO: Rename books, set description
const EditBooksModal = ({ books, fetchBooks, closeModalHandler }) => {
	const authContext = useContext(AuthContext);
	const tokenFromStorage = authContext.token;

	const addBookInputRef = useRef();

	const onAddBookHandler = async () => {
		const newBook = {
			name: addBookInputRef.current.value,
		};

		const response = await fetch('/api/books', {
			method: 'PUT',
			body: JSON.stringify(newBook),
			headers: {
				// This is required. NodeJS server won't know how to read it without it.
				'Content-Type': 'application/json',
				Authorization: `Bearer ${tokenFromStorage}`,
			},
		});
		const data = await response.json();

		if (data.success) {
			console.log('FETCH');
			fetchBooks();
		}
		addBookInputRef.current.value = '';
	};

	return (
		<>
			<Modal closeHandler={closeModalHandler}>
				<div className="container book-list">
					<h3>Book List</h3>
					<ul>
						{books.length === 0 && <div>No books found</div>}
						{books && books.map((book) => <li key={book.BookID}>{book.Name}</li>)}
					</ul>
					<Row>
						<Col lg={4}>
							<div class="form-floating">
								<Input id="book-name" type="text" placeholder="Book Name" innerRef={addBookInputRef}></Input>
								<label for="book-name">Book Name</label>
							</div>
						</Col>
						<Col lg={4} className="recipe-edit-btn">
							<Button size="sm" color="success" onClick={onAddBookHandler} className="site-btn">
								Add Book
							</Button>
						</Col>
						<Col lg={4}></Col>
					</Row>
				</div>
			</Modal>
		</>
	);
};

export default EditBooksModal;
