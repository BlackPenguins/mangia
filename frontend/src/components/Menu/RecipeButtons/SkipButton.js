import useBetterModal from 'components/Common/useBetterModal.js';
import { useCallback, useContext, useRef, useState } from 'react';
import { Play, Slash } from 'react-feather';
import { Button, Input } from 'reactstrap';
import AuthContext from '../../../authentication/auth-context.js';
import BottomButton from './BottomButton.js';

const SkipButton = ({ fetchMenu, menu, page }) => {
	const authContext = useContext(AuthContext);
	const tokenFromStorage = authContext.token;
	const inputRef = useRef(null);
	const [skipReason, setSkipReason] = useState(menu?.skipReason);

	const isSkipped = menu?.isSkipped;

	const setSkipHandler = async (closeModal) => {
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
		closeModal();
	};

	const { modal, openModal, closeModal } = useBetterModal({
		title: 'Skip Day',
		size: 'sm',
		buttons: (closeModal) => (
			<Button className="mangia-btn muted" onClick={() => setSkipHandler(closeModal)}>
				Skip Day
			</Button>
		),
		content: (closeModal) => (
			<Input
				innerRef={inputRef}
				autoFocus
				name="text"
				placeholder="Skip Reason"
				onChange={(e) => {
					setSkipReason(e.target.value);
				}}
				onKeyDown={(e) => {
					if (e.key === 'Enter') {
						e.preventDefault();
						setSkipHandler(closeModal);
					}
				}}
				value={skipReason}
			/>
		),
		inputRef,
	});

	const skipHandler = useCallback(async () => {
		if (isSkipped) {
			// Just turn it off
			await fetch(`/api/menu/skip/${menu?.menuID}`, {
				method: 'PATCH',
				body: JSON.stringify({ isSkipped: false }),
				headers: {
					// This is required. NodeJS server won't know how to read it without it.
					'Content-Type': 'application/json',
					Authorization: `Bearer ${tokenFromStorage}`,
				},
			});
			fetchMenu(page);
		} else {
			openModal();
		}
	}, [page, menu, fetchMenu, isSkipped, tokenFromStorage]);

	let label = 'SKIP';
	let className = 'skip-button';
	let Icon = Slash;

	if (isSkipped) {
		label = 'UNSKIP';
		className = 'unskip-button';
		Icon = Play;
	}

	return (
		<>
			{modal}
			<BottomButton Icon={Icon} action={skipHandler} buttonClass="skip-button" />
		</>
	);
};

export default SkipButton;
