import { useCallback } from 'react';
import { Moon } from 'react-feather';
import BottomButton from './BottomButton';
import { useAuth } from '@blackpenguins/penguinore-common-ext';

const LeftoversButton = ({ fetchMenu, menu, page }) => {
	const authContext = useAuth();
	const tokenFromStorage = authContext.tokenFromStorage;
	const isLeftovers = menu?.isLeftovers;

	const leftoversHandler = useCallback(async () => {
		await fetch(`/api/menu/leftovers/${menu?.menuID}`, {
			method: 'PATCH',
			body: JSON.stringify({ isLeftovers: !isLeftovers }),
			headers: {
				// This is required. NodeJS server won't know how to read it without it.
				'Content-Type': 'application/json',
				Authorization: `Bearer ${tokenFromStorage}`,
			},
		});
		fetchMenu(page);
	}, [page, menu, fetchMenu, isLeftovers, tokenFromStorage]);

	return <BottomButton Icon={Moon} action={leftoversHandler} buttonClass="leftovers-button" />;
};

export default LeftoversButton;
