import { useContext, useState } from 'react';
import { Button, Input } from 'reactstrap';
import AuthContext from 'authentication/auth-context';
import Modal from 'components/Common/Modal';

const SkipModal = ({ page, menu, fetchMenu, closeModalHandler }) => {
	const authContext = useContext(AuthContext);
	const tokenFromStorage = authContext.token;

	const [skipReason, setSkipReason] = useState(menu?.skipReason);

	const skipHandler = async () => {
		await fetch(`/api/menu/skip/${menu?.menuID}`, {
			method: 'PATCH',
			body: JSON.stringify({ isSkipped: true, skipReason }),
			headers: {
				// This is required. NodeJS server won't know how to read it without it.
				'Content-Type': 'application/json',
				Authorization: `Bearer ${tokenFromStorage}`,
			},
		});
		fetchMenu(page);
		closeModalHandler();
	};

	return (
		<>
			<Modal title="Skip Day" closeHandler={closeModalHandler} buttons={<Button onClick={skipHandler}>Skip Day</Button>}>
				<Input
					name="text"
					placeholder="Skip Reason"
					onChange={(e) => {
						setSkipReason(e.target.value);
					}}
					value={skipReason}
				/>
			</Modal>
		</>
	);
};

export default SkipModal;
