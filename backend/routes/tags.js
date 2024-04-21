import express from 'express';
import { selectAllTags } from '../database/tags.js';

const getAllTags = (req, res) => {
	const selectPromise = selectAllTags();

	selectPromise.then(
		(result) => {
			res.status(200).json(result);
		},
		(error) => {
			res.status(500).json({ message: error });
		}
	);
};

const router = express.Router();

router.get('/api/tags', getAllTags);

export default router;