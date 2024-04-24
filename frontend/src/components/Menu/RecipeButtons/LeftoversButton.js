import { useCallback, useContext } from 'react';
import { Moon } from 'react-feather';
import AuthContext from '../../../authentication/auth-context';
import BottomButton from './BottomButton';

const LeftoversButton = ({ fetchMenu, menu, page }) => {
	const authContext = useContext(AuthContext);
	const tokenFromStorage = authContext.token;
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

	let classes = ['leftovers-button'];

	return <BottomButton Icon={Moon} action={leftoversHandler} buttonClass="leftovers-button" />;
};

export default LeftoversButton;
