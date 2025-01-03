import { useCallback } from 'react';
import { Flag } from 'react-feather';
import BottomButton from './BottomButton';
import { useAuth } from '@blackpenguins/penguinore-common-ext';

const MadeButton = ({ fetchMenu, menu, page, recipe }) => {
	const authContext = useAuth();
	const tokenFromStorage = authContext.tokenFromStorage;

	const isSkipped = menu?.isSkipped;
	const isMade = menu?.isMade;
	const made = useCallback(async () => {
		await fetch(`/api/menu/made/${menu?.menuID}`, {
			method: 'POST',
			body: JSON.stringify({ isMade: !isMade, recipeID: recipe?.RecipeID, isUseToday: menu.hasNoDate }),
			headers: {
				// This is required. NodeJS server won't know how to read it without it.
				'Content-Type': 'application/json',
				Authorization: `Bearer ${tokenFromStorage}`,
			},
		});
		fetchMenu(page);
	}, [page, menu, fetchMenu, isMade, recipe, tokenFromStorage]);

	const madeHandler = isSkipped ? null : made;
	let classes = ['made-button'];

	if (isSkipped) {
		classes.push('disabled');
	}

	return <BottomButton Icon={Flag} action={madeHandler} buttonClass="made-button" />;
};

export default MadeButton;
