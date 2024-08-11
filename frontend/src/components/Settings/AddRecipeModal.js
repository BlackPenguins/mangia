import { useContext, useRef, useState } from 'react';
import { Button, Input } from 'reactstrap';
import Modal from '../Modal';
import { useNavigate } from 'react-router-dom';
import './ImportRecipeModal.css';
import AuthContext from '../../authentication/auth-context';

const AddRecipeModal = ({ closeModalHandler }) => {
	const authContext = useContext(AuthContext);
	const tokenFromStorage = authContext.token;

	const navigate = useNavigate();
	const [recipeName, setRecipeName] = useState('');

	const addRecipeHandler = async () => {
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
			closeModalHandler();
			navigate(`/recipe/${data.recipeID}`);
		} else {
			console.error('ERROR: ' + data.message);
		}
	};

	return (
		<>
			<Modal closeHandler={closeModalHandler}>
				<div>
					<Input
						name="text"
						placeholder="Recipe Name"
						onChange={(e) => {
							setRecipeName(e.target.value);
						}}
						value={recipeName}
					/>
				</div>
				<div className="buttons">
					<Button onClick={addRecipeHandler}>Add Recipe</Button>
				</div>
			</Modal>
		</>
	);
};

export default AddRecipeModal;
