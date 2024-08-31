import { useCallback, useContext, useEffect, useState } from 'react';
import { Button, Col, Input, Row } from 'reactstrap';
import { Tag as TagIcon } from 'react-feather';

import './Tag.scss';
import AuthContext from '../../authentication/auth-context';
import InputWithAutocomplete from './InputWithAutocomplete';

const Tag = ({ recipeID }) => {
	const authContext = useContext(AuthContext);
	const tokenFromStorage = authContext.token;

	const fetchAllTags = async () => {
		const response = await fetch('/api/tags', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		});
		const data = await response.json();
		return data.map((d) => d.Name);
	};

	const fetchRecipeTags = useCallback(async () => {
		const response = await fetch(`/api/recipes/${recipeID}/tags`);
		const data = await response.json();
		console.log('Retrieved Recipe Tags from Server', data);
		setRecipeTags(data);
	}, [recipeID]);

	useEffect(() => {
		fetchRecipeTags();
	}, [fetchRecipeTags]);

	const [recipeTags, setRecipeTags] = useState([]);
	const [selectedValue, setSelectedValue] = useState('');

	const addTagHandler = async (tagName) => {
		await fetch(`/api/recipes/${recipeID}/addTag`, {
			method: 'POST',
			body: JSON.stringify({ tagName }),
			headers: {
				// This is required. NodeJS server won't know how to read it without it.
				'Content-Type': 'application/json',
				Authorization: `Bearer ${tokenFromStorage}`,
			},
		});
		fetchRecipeTags();
	};

	const removeTagHandler = async (tagID) => {
		await fetch(`/api/recipes/${recipeID}/removeTag`, {
			method: 'POST',
			body: JSON.stringify({ tagID }),
			headers: {
				// This is required. NodeJS server won't know how to read it without it.
				'Content-Type': 'application/json',
				Authorization: `Bearer ${tokenFromStorage}`,
			},
		});

		console.log('REMOVE TAG', selectedValue);
		fetchRecipeTags();
	};

	const addTag = () => addTagHandler(selectedValue);

	return (
		<Row>
			<Col lg={2}>
				<InputWithAutocomplete
					id="recipe-tag"
					label="Tag"
					fetchAvailableResults={fetchAllTags}
					selectedValue={selectedValue}
					setSelectedValue={setSelectedValue}
					onkeyDownHandler={(value) => addTagHandler(value)}
				/>
			</Col>
			<Col lg={2} className="recipe-edit-btn">
				<Button size="sm" color="success" onClick={addTag} className="site-btn muted">
					<TagIcon /> Add Tag
				</Button>
			</Col>
			<Col lg={8} className="tag-container">
				{recipeTags.length > 0 && (
					<>
						{recipeTags.map((tag) => {
							return <TagBox type="recipe" tag={tag} removeTagHandler={removeTagHandler} />;
						})}
					</>
				)}
			</Col>
		</Row>
	);
};
export const TagBox = ({ type, tag, removeTagHandler }) => {
	if (!tag?.Name) {
		return null;
	}
	const removeTag = () => removeTagHandler(tag.TagID);
	return (
		<span key={tag.TagID} className={`tag ${type}`}>
			<span onClick={removeTag} className="remove-tag">
				X
			</span>
			<span className="tag-name">{tag.Name}</span>
		</span>
	);
};

export default Tag;
