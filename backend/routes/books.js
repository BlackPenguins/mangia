import express from 'express';
import { insertBook, selectAllBooks, selectBookByID } from '../database/books.js';
import { checkAdminMiddleware } from './auth.js';

const getBookByID = async (req, res) => {
	const book = await selectBookByID(req.params.bookID);

	if (!book) {
		res.status(500).json({ message: "Book doesn't exist!" });
	} else {
		res.status(200).json(book);
	}
};

const getAllBooks = (req, res) => {
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

const addBook = (req, res) => {
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

const router = express.Router();

router.get('/api/books/:bookID', getBookByID);
router.get('/api/books', getAllBooks);
router.put('/api/books', checkAdminMiddleware, addBook);

export default router;
