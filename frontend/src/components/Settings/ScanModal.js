import { useRef, useState } from 'react';
import { Button, Col, FormText, Input, Row } from 'reactstrap';
import Modal from '../Modal';
import './EditBooksModal.css';

const ScanModal = ({ attachments, fetchRecipe, closeModalHandler, recipeID }) => {
	const [imageFile, setImageFile] = useState('');
	const [text, setText] = useState(null);
	const [progress, setProgress] = useState(0);

	const fileChangeHandler = (event) => {
		setImageFile(event.target.files[0]);
	};

	const fetchProgress = async () => {
		const response = await fetch('/api/recipes/parseTextProgress');
		const data = await response.json();
		console.log('GO', data);
		setProgress(data.progress);
	};

	const importFile = async () => {
		if (imageFile) {
			const imageData = new FormData();
			imageData.append('imageFile', imageFile);

			await fetch(`/api/recipes/attachments/${recipeID}`, {
				method: 'POST',
				body: imageData,
			});
			// const data = await response.json();
		}
		fetchRecipe();
	};

	const parseText = async (attachment) => {
		console.log('PARSE', attachment);

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
			},
		});
		const data = await response.json();
		console.log('SCAN BACK');
		if (data) {
			setText(data.text);
		}
		clearInterval(progressUpdates);
	};

	const lines = text?.split('\n');

	return (
		<>
			<Modal closeHandler={closeModalHandler} className="large">
				<div className="container book-list">
					<h3>Scanned Files</h3>
					<ul>
						{attachments.length === 0 && <div>No books found</div>}
						{attachments &&
							attachments.map((attachment) => {
								const imageURL = `http://localhost:6200/attachments/${recipeID}/${attachment}`;
								const clickHandler = () => {
									parseText(attachment);
								};
								return <img onClick={clickHandler} width={100} src={imageURL} />;
							})}
					</ul>
					<Row>
						<Col>
							<Input id="recipe-image" name="file" type="file" onChange={fileChangeHandler} />
							<FormText>The attachment image for the recipe.</FormText>
						</Col>
					</Row>
					<Row>
						<Col className="recipe-edit-btn">
							<Button size="sm" color="success" className="site-btn" onClick={importFile}>
								Add Attachment
							</Button>
						</Col>
						<Col lg={4}></Col>
					</Row>
					<div className="parsed-text">
						{lines &&
							lines.map((line) => {
								return <div>{line}</div>;
							})}
						{!lines && <Progress progress={progress} />}
					</div>
				</div>
			</Modal>
		</>
	);
};

const Progress = ({ progress }) => {
	const progressValue = Math.round(progress * 100);
	return <span>Progress {progressValue}%</span>;
};

export default ScanModal;
