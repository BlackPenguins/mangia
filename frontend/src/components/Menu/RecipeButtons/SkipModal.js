import { useState } from 'react';
import { Button, Input } from 'reactstrap';
import Modal from '../../Modal';

const SkipModal = ({ page, menu, fetchMenu, closeModalHandler }) => {
	const [skipReason, setSkipReason] = useState(menu?.skipReason);

	const skipHandler = async () => {
		await fetch(`/api/menu/skip/${menu?.menuID}`, {
			method: 'PATCH',
			body: JSON.stringify({ isSkipped: true, skipReason }),
			headers: {
				// This is required. NodeJS server won't know how to read it without it.
				'Content-Type': 'application/json',
			},
		});
		fetchMenu(page);
		closeModalHandler();
	};

	return (
		<>
			<Modal closeHandler={closeModalHandler}>
				<Input
					name="text"
					placeholder="Skip Reason"
					onChange={(e) => {
						setSkipReason(e.target.value);
					}}
					value={skipReason}
				/>
				<Button onClick={skipHandler}>Skip Day</Button>
			</Modal>
		</>
	);
};

export default SkipModal;
