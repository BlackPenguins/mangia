import { useContext, useState } from 'react';
import { Button, Col, FormText, Input, Row } from 'reactstrap';
import AuthContext from 'authentication/auth-context';
import './ScanModal.scss';
import useBetterModal from 'components/Common/useBetterModal';

const useScanModal = (fetchRecipe, attachments, recipeID) => {
	const authContext = useContext(AuthContext);
	const tokenFromStorage = authContext.token;

	const [imageFile, setImageFile] = useState('');
	const [text, setText] = useState(null);
	const [progress, setProgress] = useState(null);

	const fileChangeHandler = (event) => {
		setImageFile(event.target.files[0]);
	};

	const fetchProgress = async () => {
		const response = await fetch('/api/recipes/parseTextProgress');
		const data = await response.json();
		setProgress(data.progress);
	};

	const importFile = async () => {
		if (imageFile) {
			const imageData = new FormData();
			imageData.append('imageFile', imageFile);

			await fetch(`/api/recipes/attachments/${recipeID}`, {
				method: 'POST',
				body: imageData,
				headers: {
					Authorization: `Bearer ${tokenFromStorage}`,
				},
			});

			setImageFile('');
		}
		fetchRecipe();
	};

	const parseText = async (attachment) => {
		setText(null);
		setProgress(0);

		const progressUpdates = setInterval(() => {
			fetchProgress();
		}, 500);

		const response = await fetch(`/api/recipes/${recipeID}/parseText`, {
			method: 'POST',
			body: JSON.stringify({ attachment }),
			headers: {
				// This is required. NodeJS server won't know how to read it without it.
				'Content-Type': 'application/json',
				Authorization: `Bearer ${tokenFromStorage}`,
			},
		});
		const data = await response.json();
		if (data) {
			setText(data.text);
		}
		clearInterval(progressUpdates);
	};

	const lines = text?.split('\n');

	const { modal, openModal } = useBetterModal({
		title: 'Scan Reference Images',
		size: 'lg',
		content: (closeModal) => (
			<div className="container book-list">
				<h3>Scanned Files</h3>
				<ul>
					{attachments.length === 0 && <div>No attachments found</div>}
					{attachments &&
						attachments.map((attachment, index) => {
							const imageURL = `http://localhost:6200/attachments/${recipeID}/${attachment}`;
							const clickHandler = () => {
								parseText(attachment);
							};
							return <img key={index} alt={`attachment-${index}`} onClick={clickHandler} width={100} src={imageURL} />;
						})}
				</ul>
				<Row>
					<Col>
						<Input id="recipe-image" name="file" type="file" onChange={fileChangeHandler} />
						<FormText>The attachment image for the recipe.</FormText>
					</Col>
				</Row>
				<div className="parsed-text">
					{lines &&
						lines.map((line, index) => {
							return <div key={index}>{line}</div>;
						})}
					{!lines && <Progress progress={progress} />}
				</div>
			</div>
		),
		buttons: (closeModal) => (
			<Button size="sm" className="mangia-btn success" onClick={importFile}>
				Add Attachment
			</Button>
		),
	});

	return { modal, openModal };
};

const Progress = ({ progress }) => {
	if (progress === null) {
		return null;
	}

	const progressValue = Math.round(progress * 100);
	return <span>Progress {progressValue}%</span>;
};

export default useScanModal;
