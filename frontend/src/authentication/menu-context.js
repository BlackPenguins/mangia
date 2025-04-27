import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MenuContext = React.createContext({
	// Dummy data to VS Code has auto-complete
	menuRecipeIDs: [],
	redirectToPreviousRecipeHandler: () => {},
	redirectToNextRecipeHandler: () => {},
	isMenuRecipeHandler: (currentRecipeID) => {},
	setMenuRecipeIDsHandler: () => {},
});

export const MenuContextProvider = ({ children }) => {
	const navigate = useNavigate();
	const [menuRecipeIDs, setMenuRecipeIDs] = useState([]);

	const setMenuRecipeIDsHandler = useCallback((menuRecipeIDs) => {
		setMenuRecipeIDs(menuRecipeIDs);
	},[]);

	const redirectRecipeHandler = (isNextRecipe, currentRecipeID) => {
		const index = menuRecipeIDs.indexOf(currentRecipeID);

		if (isNextRecipe) {
			const nextRecipeID = menuRecipeIDs[(index + 1) % menuRecipeIDs.length];
			navigate(`/recipe/${nextRecipeID}`);
		} else {
			const previousIndex = index - 1;
			const prevRecipeID = menuRecipeIDs[previousIndex >= 0 ? previousIndex : menuRecipeIDs.length - 1];
			navigate(`/recipe/${prevRecipeID}`);
		}
	};

	const redirectToPreviousRecipeHandler = (currentRecipeID) => {
		redirectRecipeHandler(false, currentRecipeID);
	};

	const redirectToNextRecipeHandler = (currentRecipeID) => {
		redirectRecipeHandler(true, currentRecipeID);
	};

	const isMenuRecipeHandler = (currentRecipeID) => {
		return menuRecipeIDs && menuRecipeIDs.indexOf(currentRecipeID) !== -1;
	};

	return (
		<MenuContext.Provider
			value={{
				redirectToNextRecipeHandler,
				redirectToPreviousRecipeHandler,
				setMenuRecipeIDsHandler,
				isMenuRecipeHandler,
			}}
		>
			{children}
		</MenuContext.Provider>
	);
};

export default MenuContext;
