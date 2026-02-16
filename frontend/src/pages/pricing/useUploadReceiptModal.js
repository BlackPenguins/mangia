import { useState } from 'react';
import { Button, Col, FormText, Input, Row } from 'reactstrap';
import { useAuth, useBetterModal } from '@blackpenguins/penguinore-common-ext';

const useUploadReceiptModal = (fetchReceipts) => {
	const authContext = useAuth();
	const tokenFromStorage = authContext.tokenFromStorage;


	const [preProcessedImageFile, setPreProcessedImageFile] = useState('');

	const [textLines, setTextLines] = useState(null);
	const [preProcessedTextLines, setPreProcessedTextLines] = useState(null);

	const [imageFile, setImageFile] = useState('');

	const fileChangeHandler = (event) => {
		setImageFile(event.target.files[0]);
	};


	const uploadHandler = async (clsoeModal) => {
		if (imageFile) {
			const imageData = new FormData();
			imageData.append('imageFile', imageFile);

			const response = await fetch(`/api/receipts/upload`, {
				method: 'POST',
				body: imageData,
				headers: {
					Authorization: `Bearer ${tokenFromStorage}`,
				},
			});

			const data = await response.json();

			if( data.success ){
				closeModal();
				fetchReceipts();
			}

			// const image = `http://${process.env.REACT_APP_HOST_NAME}:6200/receipts/${data.image}`;
			// const preProcessedImage = `http://${process.env.REACT_APP_HOST_NAME}:6200/receipts/${data.preProcessedImage}`;

			// setPreProcessedImageFile(preProcessedImage);
			// setImageFile(image);
			// setTextLines(data.text.split("\n"));
			// setPreProcessedTextLines(data.preProcessedText.split("\n"));
		}
	};

	const { modal, openModal, closeModal, isOpen } = useBetterModal({
		title: 'Upload Receipt',
		content: (closeModal) => (
			<Row>
				<Col>
					<Input id="recipe-image" name="file" type="file" onChange={fileChangeHandler} />
					<FormText>The image of the receipt.</FormText>
				</Col>
			</Row>
		),
		footer: (closeModal) => (
			<>
				<Button className="mangia-btn muted" onClick={() => uploadHandler(closeModal)}>
					Upload
				</Button>
			</>
		),
	});

	return { modal, openModal };
};

export default useUploadReceiptModal;
