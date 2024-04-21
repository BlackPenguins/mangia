import { useCallback } from 'react';
import { Codesandbox } from 'react-feather';
import BottomButton from './BottomButton';

const RerollButton = ({ fetchMenu, menuID, currentRecipeIDs, page, isSkipped }) => {
	const reroll = useCallback(async () => {
		const request = {
			menuID: menuID,
			excludedRecipeIDs: currentRecipeIDs,
		};
		await fetch(`/api/menu/reroll/${menuID}`, {
			method: 'POST',
			body: JSON.stringify(request),
			headers: {
				// This is required. NodeJS server won't know how to read it without it.
				'Content-Type': 'application/json',
			},
		});
		fetchMenu(page);
	}, [page, currentRecipeIDs, fetchMenu, menuID]);

	const rollHandler = isSkipped ? null : reroll;
	let classes = ['reroll-button'];

	if (isSkipped) {
		classes.push('disabled');
	}

	return <BottomButton Icon={Codesandbox} action={rollHandler} buttonClass="reroll-button" />;
};

export default RerollButton;
