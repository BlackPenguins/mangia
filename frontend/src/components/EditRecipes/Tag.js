import { useCallback, useEffect, useState } from 'react';
import { Button, Col, Row } from 'reactstrap';
import { Tag as TagIcon } from 'react-feather';
import { useAuth } from '@blackpenguins/penguinore-common-ext';

import './Tag.scss';
import InputWithAutocomplete from './InputWithAutocomplete';

const Tag = ({ recipeID }) => {
	const authContext = useAuth();
	const tokenFromStorage = authContext.tokenFromStorage;
    const [allResults, setAllResults] = useState([]);

	const fetchAllTags = async () => {
		const response = await fetch('/api/tags', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		});
		const data = await response.json();
		setAllResults(data);
	};

	const fetchRecipeTags = useCallback(async () => {
		const response = await fetch(`/api/recipes/${recipeID}/tags`);
		const data = await response.json();
		console.log('Retrieved Recipe Tags from Server', data);
		setRecipeTags(data);
	}, [recipeID]);

	useEffect(() => {
		fetchRecipeTags();
		fetchAllTags();
	}, [fetchRecipeTags]);

	const [recipeTags, setRecipeTags] = useState([]);
	const [selectedValue, setSelectedValue] = useState('');

	const addTagHandler = async (value) => {
		await fetch(`/api/recipes/${recipeID}/addTag`, {
			method: 'POST',
			body: JSON.stringify(value),
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

		fetchRecipeTags();
	};

	const addTag = () => addTagHandler(selectedValue);

	console.log(allResults);
	const tags = allResults && allResults.map( (r) => {
		return {
			id: r.TagID,
			name: r.Name,
		}
	});

	return (
		<Row>
			<Col lg={2}>
				<InputWithAutocomplete
					id="recipe-tag"
					label="Tag"
					allResults={tags}
					selectedValue={selectedValue}
					setSelectedValue={setSelectedValue}
					selectionHandler={addTagHandler}
					showLabel={true}
				/>
			</Col>
			<Col lg={2} className="recipe-edit-btn">
				<Button size="sm" onClick={addTag} className="mangia-btn muted">
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
export const TagBox = ({ type, tag, removeTagHandler, tagColor = "rgb(24, 93, 150)" }) => {
	if (!tag?.Name) {
		return null;
	}
	const removeTag = () => removeTagHandler(tag.TagID);
	return (
		<div key={tag.TagID} className={`tag-box-1 ${type}`} style={{'--tag-color': tagColor}}>
			<span onClick={removeTag} className="tag-remove-1">&times;</span>
			<span className="tag-name-1">{tag.Name}</span>
		</div>
	);
};

export default Tag;
