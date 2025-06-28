
import { Button, Col, Row } from 'reactstrap';
import useUploadReceiptModal from './useUploadReceiptModal';

import './Receipts.scss';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Receipts = () => {
	const navigate = useNavigate();
	const [receipts, setReceipts] = useState([]);

	const fetchReceipts = useCallback(async () => {
		const response = await fetch('/api/receipts', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		});
		const data = await response.json();
		const receipts = data;
		setReceipts(receipts);
	}, []);
	
	useEffect(() => {
		fetchReceipts();
	}, [fetchReceipts]);

	const { modal: uploadReceiptModal, openModal: openUploadReceiptModal } = useUploadReceiptModal(fetchReceipts);

	return (
		<section className="hero receipts">
			<div className="container">
				<div className="section-title">
					{uploadReceiptModal}
					<h2>Receipts</h2>

					<Button className="mangia-btn muted" onClick={openUploadReceiptModal}>
						Upload Receipt
					</Button>

					<div className="receipts-table">
						{receipts && receipts.map( (receipt) => {
							const date = new Date(receipt.Date);
							const formattedDate = date.toLocaleDateString('en-US', {
								year: 'numeric',
								month: 'long',
								day: 'numeric',
							});

							return (
								<Row className="add-config-button">
								<Col lg={2}>
									{receipt.IsProcessed}
								</Col>
								<Col lg={10} className="recipe-edit-btn">
									<Button onClick={() => navigate(`${receipt.ReceiptID}`)}>{receipt.ReceiptID} {receipt.StoreID} {formattedDate}</Button>
								</Col>
							</Row>
							)
						})}
					</div>
				</div>
			</div>
		</section>
	);
};

export default Receipts;
