import express from 'express';
import { checkAdminMiddleware } from './auth.js';
import { insertSuggestion, selectAllSuggestions, updateSuggestion } from '../database/suggestions.js';

const router = express.Router();

const getSuggestionsHandler = async (req, res) => {
	const selectPromise = selectAllSuggestions();

	selectPromise.then(
		(result) => {
			res.status(200).json({ success: true, result });
		},
		(error) => {
			res.status(500).json({ message: error });
		}
	);
};

const addSuggestionHandler = async (req, res) => {
	const days = req.body.days;

	if (days !== 'None') {
		let todaysDate = new Date();
		todaysDate.setDate(todaysDate.getDate() + Number(days));

		// We need a middleman object so the person using the API can't change whichever columns they want
		const newSuggestion = {
			Name: req.body.name,
			ExpirationDate: todaysDate,
		};

		// We can pass an object as long as the properties of the object match the column names in the DB table
		const insertPromise = insertSuggestion(newSuggestion);

		insertPromise.then(
			(result) => {
				res.status(200).json({ success: true, result });
			},
			(error) => {
				res.status(500).json({ message: error });
			}
		);
	}
};

const updateSuggestionHandler = (req, res) => {
	const suggestionID = req.body.id;
	const name = req.body.name;
	const days = req.body.days;
	const isMade = req.body.isMade;

	const update = {};

	if (name) {
		update.Name = name;
	}

	if (isMade) {
		update.IsMade = 1;
	}

	if (days) {
		let todaysDate = new Date();
		todaysDate.setDate(todaysDate.getDate() + Number(days));
		update.ExpirationDate = todaysDate;
	}

	console.log(`Updating Suggestion [${suggestionID}]`, update);

	// We can pass an object as long as the properties of the object match the column names in the DB table
	const insertPromise = updateSuggestion(suggestionID, update);

	insertPromise.then(
		(result) => {
			res.status(200).json({ success: true, result });
		},
		(error) => {
			res.status(500).json({ message: error });
		}
	);
};

router.get('/api/suggestions', getSuggestionsHandler);
router.put('/api/suggestions', checkAdminMiddleware, addSuggestionHandler);
router.patch('/api/suggestions', checkAdminMiddleware, updateSuggestionHandler);

export default router;
