import { useCallback, useState } from 'react';
import { Play, Slash } from 'react-feather';
import BottomButton from './BottomButton.js';
import SkipModal from './SkipModal';

const SkipButton = ({ fetchMenu, menu, page }) => {
	const isSkipped = menu?.isSkipped;

	const [showSkipModal, setShowSkipModal] = useState(false);

	const skipHandler = useCallback(async () => {
		if (isSkipped) {
			// Just turn it off
			await fetch(`/api/menu/skip/${menu?.menuID}`, {
				method: 'PATCH',
				body: JSON.stringify({ isSkipped: false }),
				headers: {
					// This is required. NodeJS server won't know how to read it without it.
					'Content-Type': 'application/json',
				},
			});
			fetchMenu(page);
		} else {
			setShowSkipModal(true);
		}
	}, [page, menu, fetchMenu, isSkipped]);

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
			{showSkipModal && <SkipModal closeModalHandler={() => setShowSkipModal(false)} menu={menu} fetchMenu={fetchMenu} page={page} />}
			<BottomButton Icon={Icon} action={skipHandler} buttonClass="skip-button" />
		</>
	);
};

export default SkipButton;
