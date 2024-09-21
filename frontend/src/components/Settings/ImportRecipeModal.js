import { useContext, useState } from 'react';
import { Button, Input } from 'reactstrap';
import { useNavigate } from 'react-router-dom';
import './ImportRecipeModal.scss';
import AuthContext from 'authentication/auth-context';
import useBetterModal from 'components/Common/useBetterModal';

const useImportRecipeModal = () => {
	const authContext = useContext(AuthContext);
	const tokenFromStorage = authContext.token;

	const navigate = useNavigate();
	const [importURL, setImportURL] = useState('');
	const [status, setStatus] = useState('');
	const [newRecipeID, setNewRecipeID] = useState(null);
	const [statusClasses, setStatusClasses] = useState('status');

	const [importFile, setImportFile] = useState('');

	const viewRecipeHandler = () => {
		closeModal();
		navigate(`/recipe/${newRecipeID}`);
	};

	const importHandler = async () => {
		const url = importURL;
		const response = await fetch(`/api/recipes/import`, {
			method: 'POST',
			body: JSON.stringify({ url }),
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

		setImportURL('');
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

	const { modal, openModal, closeModal } = useBetterModal({
		title: 'Import Recipe',
		content: (closeModal) => (
			<>
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
			</>
		),
		buttons: (closeModal) => (
			<>
				{!newRecipeID && <Button onClick={importRecipeFile}>Import File</Button>}
				{!newRecipeID && <Button onClick={importHandler}>Import URL</Button>}
				{newRecipeID && (
					<Button color="success" onClick={viewRecipeHandler}>
						View Recipe
					</Button>
				)}
			</>
		),
	});

	return { modal, openModal };
};

export default useImportRecipeModal;
