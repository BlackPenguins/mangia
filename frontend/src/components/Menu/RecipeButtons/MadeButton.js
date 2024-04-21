import { useCallback, useContext } from 'react';
import { Flag } from 'react-feather';
import AuthContext from '../../../authentication/auth-context';
import BottomButton from './BottomButton';

const MadeButton = ({ fetchMenu, menu, page, recipe }) => {
	const authContext = useContext(AuthContext);
	const tokenFromStorage = authContext.token;

	const isSkipped = menu?.isSkipped;
	const isMade = menu?.isMade;
	const made = useCallback(async () => {
		console.log('HEAD', tokenFromStorage);
		await fetch(`/api/menu/made/${menu?.menuID}`, {
			method: 'POST',
			body: JSON.stringify({ isMade: !isMade, recipeID: recipe?.RecipeID }),
			headers: {
				// This is required. NodeJS server won't know how to read it without it.
				'Content-Type': 'application/json',
				Authorization: `Bearer ${tokenFromStorage}`,
			},
		});
		fetchMenu(page);
	}, [page, menu, fetchMenu, isMade, recipe]);

	const madeHandler = isSkipped ? null : made;
	let classes = ['made-button'];

	if (isSkipped) {
		classes.push('disabled');
	}

	return <BottomButton Icon={Flag} action={madeHandler} buttonClass="made-button" />;
};

export default MadeButton;
