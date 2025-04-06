import express from 'express';
import { selectAllTags } from  '#root/database/tags.js';

const getAllTagsHandler = (req, res) => {
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

router.get('/api/tags', getAllTagsHandler);

export default router;
