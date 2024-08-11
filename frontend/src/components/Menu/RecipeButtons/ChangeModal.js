import { useContext, useState } from 'react';
import { Button, Input } from 'reactstrap';
import AuthContext from '../../../authentication/auth-context';
import Modal from '../../Modal';
import FilteredRecipesControl from '../../Recipes/FilteredRecipesControl';
import RecipeRow from '../../Recipes/RecipeRow';
import './ChangeModal.css';

const ChangeModal = ({ menu, fetchMenu, page, availableSwapDays, closeModalHandler }) => {
	const authContext = useContext(AuthContext);
	const tokenFromStorage = authContext.token;

	const [swapMenuID, setSwapDay] = useState(null);

	const changeHandler = async (recipe) => {
		if (menu) {
			const recipeID = recipe.RecipeID;

			await fetch(`/api/menu/change/${menu.menuID}`, {
				method: 'POST',
				body: JSON.stringify({ recipeID }),
				headers: {
					// This is required. NodeJS server won't know how to read it without it.
					'Content-Type': 'application/json',
					Authorization: `Bearer ${tokenFromStorage}`,
				},
			});
			fetchMenu(page);
			closeModalHandler();
		}
	};

	const swapHandler = async () => {
		if (swapMenuID) {
			await fetch(`/api/menu/move/${menu.menuID}`, {
				method: 'POST',
				body: JSON.stringify({ swapMenuID: swapMenuID }),
				headers: {
					// This is required. NodeJS server won't know how to read it without it.
					'Content-Type': 'application/json',
					Authorization: `Bearer ${tokenFromStorage}`,
				},
			});
			fetchMenu(page);
			closeModalHandler();
		}
	};

	return (
		<>
			<Modal closeHandler={closeModalHandler}>
				<h3>Swap Days</h3>
				<div className="swap-days-container">
					<Input
						type="select"
						placeholder="Swap Day"
						onChange={(e) => {
							setSwapDay(e.target.value);
						}}
						value={swapMenuID}
					>
						<option value={null}>Select Weekday</option>
						{availableSwapDays &&
							availableSwapDays.map((day) => {
								if (day.dayOfWeek === menu.week) {
									return null;
								} else {
									return (
										<option key={day.menuID} value={day.menuID}>
											{day.dayOfWeek} - {day.recipeName}
										</option>
									);
								}
							})}
					</Input>
					<Button className="site-btn" onClick={swapHandler}>
						Swap Day
					</Button>
				</div>

				<h3>Change Recipe</h3>
				<div className="change-recipe-container">
					<FilteredRecipesControl CardType={RecipeRow} onClickHandler={changeHandler} layoutClass="lg-12" />
				</div>
			</Modal>
		</>
	);
};

export default ChangeModal;
