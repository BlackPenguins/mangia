import express from 'express';
import { insertBook, selectAllBooks, selectBookByID, updateBook } from  '#root/database/books.js';
import { checkAdminMiddleware } from './auth.js';

const getBookByIDHandler = async (req, res) => {
	const book = await selectBookByID(req.params.bookID);

	if (!book) {
		res.status(500).json({ message: "Book doesn't exist!" });
	} else {
		res.status(200).json(book);
	}
};

const getAllBooksHandler = (req, res) => {
	const selectPromise = selectAllBooks();

	selectPromise.then(
		(result) => {
			res.status(200).json(result);
		},
		(error) => {
			res.status(500).json({ message: error });
		}
	);
};

const addBookHandler = (req, res) => {
	// We need a middleman object so the person using the API can't change whichever columns they want
	const newBook = {
		name: req.body.name,
	};

	// We can pass an object as long as the properties of the object match the column names in the DB table
	const insertPromise = insertBook(newBook);

	insertPromise.then(
		(result) => {
			res.status(200).json({ success: true, result });
		},
		(error) => {
			res.status(500).json({ message: error });
		}
	);
};

const updateBookHandler = (req, res) => {
	const bookID = req.body.id;
	const bookName = req.body.name;

	const update = {};

	if (bookName) {
		update.Name = bookName;
	}

	console.log(`Updating Book [${bookID}]`, update);

	// We can pass an object as long as the properties of the object match the column names in the DB table
	const insertPromise = updateBook(bookID, update);

	insertPromise.then(
		(result) => {
			res.status(200).json({ success: true, result });
		},
		(error) => {
			res.status(500).json({ message: error });
		}
	);
};

const router = express.Router();

router.get('/api/books/:bookID', getBookByIDHandler);
router.get('/api/books', getAllBooksHandler);
router.put('/api/books', checkAdminMiddleware, addBookHandler);
router.patch('/api/books', checkAdminMiddleware, updateBookHandler);

export default router;
