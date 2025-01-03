import { useContext, useRef, useState } from 'react';
import { Button, Input } from 'reactstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth, useBetterModal } from '@blackpenguins/penguinore-common-ext';

const useAddRecipeModal = () => {
	const authContext = useAuth();
	const tokenFromStorage = authContext.tokenFromStorage;

	const navigate = useNavigate();
	const [recipeName, setRecipeName] = useState('');

	const addRecipeHandler = async (closeModal) => {
		console.log('Adding new recipe', recipeName);
		const response = await fetch('/api/recipes', {
			method: 'PUT',
			body: JSON.stringify({ name: recipeName }),
			headers: {
				// This is required. NodeJS server won't know how to read it without it.
				'Content-Type': 'application/json',
				Authorization: `Bearer ${tokenFromStorage}`,
			},
		});
		const data = await response.json();

		if (response.status === 200) {
			console.log('Recipe added successfully.', data);
			closeModal();
			navigate(`/recipe/${data.recipeID}`);
		} else {
			console.error('ERROR: ' + data.message);
		}
	};

	const inputRef = useRef();

	const { modal, openModal, closeModal } = useBetterModal({
		title: 'Add Recipe',
		footer: (closeModal) => (
			<Button className="mangia-btn muted" onClick={() => addRecipeHandler(closeModal)}>
				Add Recipe
			</Button>
		),
		content: (closeModal) => (
			<Input
				innerRef={inputRef}
				name="text"
				placeholder="Recipe Name"
				onChange={(e) => {
					setRecipeName(e.target.value);
				}}
				value={recipeName}
			/>
		),
		inputRef,
	});

	return { modal, openModal };
};

export default useAddRecipeModal;
