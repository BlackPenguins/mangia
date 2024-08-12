import { useContext, useRef, useState } from 'react';
import { Button, Input } from 'reactstrap';
import Modal from 'components/Common/Modal';
import { useNavigate } from 'react-router-dom';
import './ImportRecipeModal.css';
import AuthContext from 'authentication/auth-context';

const ImportRecipeModal = ({ closeModalHandler, currentRecipeID }) => {
	const authContext = useContext(AuthContext);
	const tokenFromStorage = authContext.token;

	const navigate = useNavigate();
	const [importURL, setImportURL] = useState('');
	const [status, setStatus] = useState('');
	const [newRecipeID, setNewRecipeID] = useState(null);
	const [statusClasses, setStatusClasses] = useState('status');

	const [importFile, setImportFile] = useState('');

	const viewRecipeHandler = () => {
		closeModalHandler();
		navigate(`/recipe/${newRecipeID}`);
	};

	const importHandler = async () => {
		const url = importURL;
		console.log('Importing', url);
		const response = await fetch(`/api/recipes/import`, {
			method: 'POST',
			body: JSON.stringify({ url, currentRecipeID }),
			headers: {
				// This is required. NodeJS server won't know how to read it without it.
				'Content-Type': 'application/json',
				Authorization: `Bearer ${tokenFromStorage}`,
			},
		});
		const data = await response.json();

		if (data.success) {
			setNewRecipeID(data.recipeID);
			setStatusClasses('status success');
			setStatus('Recipe import was a success!');
		} else {
			setStatusClasses('status failure');
			setStatus(data.status);
		}
	};

	const importRecipeFile = async () => {
		const imageData = new FormData();
		imageData.append('importFile', importFile);

		await fetch(`/api/recipeOCR`, {
			method: 'POST',
			body: imageData,
		});
		// const data = await response.json();
	};

	const fileChangeHandler = (event) => {
		setImportFile(event.target.files[0]);
	};

	return (
		<>
			<Modal
				title="Import Recipe"
				closeHandler={closeModalHandler}
				buttons={
					<>
						{!newRecipeID && <Button onClick={importHandler}>Import Recipe</Button>}
						{!newRecipeID && <Button onClick={importRecipeFile}>Import File</Button>}
						{newRecipeID && (
							<Button color="success" onClick={viewRecipeHandler}>
								View Recipe
							</Button>
						)}
					</>
				}
			>
				<div>Provide a URL to import a recipe. Not all websites can be imported.</div>
				<div>
					<Input
						name="text"
						placeholder="Import URL"
						onChange={(e) => {
							setImportURL(e.target.value);
						}}
						value={importURL}
					/>
					<input id="recipe-image" name="file" type="file" onChange={fileChangeHandler} />
				</div>
				<div className={statusClasses}>{status}</div>
			</Modal>
		</>
	);
};

export default ImportRecipeModal;
