import { useCallback } from 'react';
import { Moon } from 'react-feather';
import BottomButton from './BottomButton';

const LeftoversButton = ({ fetchMenu, menu, page }) => {
	const isLeftovers = menu?.isLeftovers;

	const leftoversHandler = useCallback(async () => {
		console.log('PATC', isLeftovers);
		await fetch(`/api/menu/leftovers/${menu?.menuID}`, {
			method: 'PATCH',
			body: JSON.stringify({ isLeftovers: !isLeftovers }),
			headers: {
				// This is required. NodeJS server won't know how to read it without it.
				'Content-Type': 'application/json',
			},
		});
		fetchMenu(page);
	}, [page, menu, fetchMenu, isLeftovers]);

	let classes = ['leftovers-button'];

	return <BottomButton Icon={Moon} action={leftoversHandler} buttonClass="leftovers-button" />;
};

export default LeftoversButton;
