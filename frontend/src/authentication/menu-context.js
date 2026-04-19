import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MenuContext = React.createContext({
	// Dummy data to VS Code has auto-complete
	menus: [],
	redirectToPreviousRecipeHandler: () => {},
	redirectToNextRecipeHandler: () => {},
	isMenuRecipeHandler: () => {},
	setMenusHandler: () => {},
	getCurrentMenu: () => {},
});

export const MenuContextProvider = ({ children }) => {
	const navigate = useNavigate();
	const [menus, setMenus] = useState([]);

	const setMenusHandler = useCallback((menus) => {
		setMenus(menus);
	},[]);

	const redirectRecipeHandler = (isNextRecipe, currentRecipeID) => {
		const index = menus.findIndex(m => m.recipe?.RecipeID === currentRecipeID);

		if (isNextRecipe) {
			const nextMenu = menus[(index + 1) % menus.length];
			const nextRecipeID = nextMenu?.recipe?.RecipeID;
			navigate(`/recipe/${nextRecipeID}`);
		} else {
			const previousIndex = index - 1;
			const previousMenu = menus[previousIndex >= 0 ? previousIndex : menus.length - 1];
			const prevRecipeID = previousMenu?.recipe?.RecipeID;
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
		return menus && menus.map( m => m.recipe?.RecipeID).indexOf(currentRecipeID) !== -1;
	};

	const getCurrentMenu = (currentRecipeID) => {
		return menus && menus.find( m => m.recipe?.RecipeID == currentRecipeID);
	};

	return (
		<MenuContext.Provider
			value={{
				redirectToNextRecipeHandler,
				redirectToPreviousRecipeHandler,
				setMenusHandler,
				isMenuRecipeHandler,
				getCurrentMenu,
			}}
		>
			{children}
		</MenuContext.Provider>
	);
};

export default MenuContext;
