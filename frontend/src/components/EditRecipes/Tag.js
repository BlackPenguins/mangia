import { useCallback, useEffect, useState } from 'react';
import { Button, Col, Input, Row } from 'reactstrap';
import { Tag as TagIcon } from 'react-feather';

import './Tag.css';

const Tag = ({ recipeID }) => {
	const fetchTags = useCallback(async () => {
		const response = await fetch('/api/tags', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		});
		const data = await response.json();
		console.log('Retrieved Tags from Server', data);
		setAllTags(data);
		setFilteredTags([]);
	}, []);

	const fetchRecipeTags = useCallback(async () => {
		const response = await fetch(`/api/recipes/${recipeID}/tags`);
		const data = await response.json();
		console.log('Retrieved Recipe Tags from Server', data);
		setRecipeTags(data);
	}, []);

	useEffect(() => {
		fetchTags();
		fetchRecipeTags();
	}, [fetchTags]);

	const [allTags, setAllTags] = useState([]);
	const [filteredTags, setFilteredTags] = useState([]);
	const [recipeTags, setRecipeTags] = useState([]);
	const [newTag, setNewTag] = useState('');
	const [tagSuggestion, setTagSuggestion] = useState(0);
	const [showSuggestions, setShowSuggestions] = useState(false);

	const filterTagsHandler = (searchString) => {
		if (!searchString.trim()) {
			setFilteredTags([]);
		} else {
			const lowercaseSearchString = searchString.toLowerCase();
			console.log('all', allTags);
			setFilteredTags(allTags.filter((tag) => tag?.Name.toLowerCase().indexOf(lowercaseSearchString) !== -1));
		}
	};

	const addTagHandler = async (tagName) => {
		await fetch(`/api/recipes/${recipeID}/addTag`, {
			method: 'POST',
			body: JSON.stringify({ tagName }),
			headers: {
				// This is required. NodeJS server won't know how to read it without it.
				'Content-Type': 'application/json',
			},
		});

		setNewTag('');
		fetchRecipeTags();
	};

	const removeTagHandler = async (tagID) => {
		await fetch(`/api/recipes/${recipeID}/removeTag`, {
			method: 'POST',
			body: JSON.stringify({ tagID }),
			headers: {
				// This is required. NodeJS server won't know how to read it without it.
				'Content-Type': 'application/json',
			},
		});

		console.log('REMOVE TAG', newTag);
		fetchRecipeTags();
	};

	const inputKeyDownHandler = (e) => {
		console.log('KEY', { code: e.keyCode, tagSuggestion, filteredTags, oh: filteredTags[tagSuggestion] });
		if (e.keyCode == 13) {
			if (showSuggestions && filteredTags.length) {
				// use the suggestions
				addTagHandler(filteredTags[tagSuggestion].Name);
			} else {
				addTagHandler(newTag);
			}

			setTagSuggestion(0);
			setShowSuggestions(false);
		} else if (e.keyCode === 38) {
			if (tagSuggestion === 0) {
				return;
			}
			setTagSuggestion((prev) => prev - 1);
		} else if (e.keyCode === 40) {
			if (tagSuggestion - 1 === filteredTags.length) {
				return;
			}
			setTagSuggestion((prev) => prev + 1);
		}
	};

	const addTag = () => addTagHandler(newTag);
	return (
		<Row>
			<Col lg={2}>
				<div class="form-floating">
					<Input
						className="editInput"
						id="recipe-tag"
						type="text"
						maxLength={50}
						placeholder="Name"
						onChange={(e) => {
							setNewTag(e.target.value);
							filterTagsHandler(e.target.value);
							setTagSuggestion(0);
							setShowSuggestions(true);
						}}
						onKeyDown={inputKeyDownHandler}
						value={newTag}
					></Input>
					<label for="recipe-tag">Tag</label>
					{filteredTags.length > 0 && showSuggestions && (
						<ul className="tag-suggestions">
							{filteredTags.map((tag, index) => {
								let className;

								if (index === tagSuggestion) {
									className = 'suggestion-active';
								}

								return (
									<li className={className} key={index}>
										{tag.Name}
									</li>
								);
							})}
						</ul>
					)}
				</div>
			</Col>
			<Col lg={2} className="recipe-edit-btn">
				<Button size="sm" color="success" onClick={addTag} className="site-btn muted">
					<TagIcon /> Add Tag
				</Button>
			</Col>
			<Col lg={8} className="tag-section">
				{recipeTags.length > 0 && (
					<>
						{recipeTags.map((tag) => {
							const removeTag = () => removeTagHandler(tag.TagID);
							return (
								<span className="tag">
									<span onClick={removeTag} className="remove-tag">
										X
									</span>
									<span className="tag-name">{tag.Name}</span>
								</span>
							);
						})}
					</>
				)}
			</Col>
		</Row>
	);
};

export default Tag;
