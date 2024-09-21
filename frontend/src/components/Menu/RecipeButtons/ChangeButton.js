import useBetterModal from 'components/Common/useBetterModal';
import { Settings } from 'react-feather';
import { useContext, useState } from 'react';
import { Button, Col, Input, Row } from 'reactstrap';
import AuthContext from 'authentication/auth-context';
import FilteredRecipes from 'components/Recipes/FilteredRecipes';
import RecipeRow from 'components//Recipes/RecipeRow';
import './ChangeModal.scss';
import { useToast } from 'context/toast-context';

const ChangeButton = ({ fetchMenu, menu, page, availableSwapDays }) => {
	const authContext = useContext(AuthContext);
	const tokenFromStorage = authContext.token;

	const changeHandler = async (recipe, closeModal) => {
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
			closeModal();
		}
	};

	const { modal, openModal } = useBetterModal({
		title: 'Edit Menu',
		size: 'lg',
		content: (closeModal) => (
			<>
				<DailyNotes menu={menu} fetchMenu={fetchMenu} tokenFromStorage={tokenFromStorage} page={page} />

				<h3>Swap Days</h3>
				<SwapDaysButtons
					page={page}
					tokenFromStorage={tokenFromStorage}
					week={menu.week}
					availableSwapDays={availableSwapDays}
					menuID={menu.menuID}
					fetchMenu={fetchMenu}
					closeModal={closeModal}
				/>

				<h3>Change Recipe</h3>
				<div className="change-recipe-container">
					<FilteredRecipes CardType={RecipeRow} onClickHandler={(recipe) => changeHandler(recipe, closeModal)} layoutClass="lg-12" />
				</div>
			</>
		),
	});

	return (
		<>
			{modal}
			<span className="day-settings">
				<Settings onClick={openModal} />
			</span>
		</>
	);
};

const DailyNotes = ({ menu, fetchMenu, tokenFromStorage, page }) => {
	const menuID = menu.menuID;

	const [value, setValue] = useState(menu.dailyNotes);

	const showToast = useToast();

	const notesHandler = async (dayID) => {
		if (dayID) {
			await fetch(`/api/menu/notes/${menuID}`, {
				method: 'POST',
				body: JSON.stringify({ dailyNotes: value }),
				headers: {
					// This is required. NodeJS server won't know how to read it without it.
					'Content-Type': 'application/json',
					Authorization: `Bearer ${tokenFromStorage}`,
				},
			});

			fetchMenu(page);
			showToast('Menu', `Notes saved for ${menu.date}`);
		}
	};

	return (
		<div className="form-floating daily-notes">
			<Input
				className="editInput"
				id="recipe-steps"
				type="textarea"
				placeholder="Daily Notes"
				onChange={(e) => {
					setValue(e.target.value);
				}}
				onBlur={notesHandler}
				value={value}
				rows={3}
			/>
			<label for="recipe-steps">Daily Notes</label>
		</div>
	);
};

const SwapDaysButtons = ({ week, availableSwapDays, menuID, fetchMenu, closeModal, tokenFromStorage, page }) => {
	const swapHandler = async (dayID) => {
		if (dayID) {
			await fetch(`/api/menu/move/${menuID}`, {
				method: 'POST',
				body: JSON.stringify({ swapMenuID: dayID }),
				headers: {
					// This is required. NodeJS server won't know how to read it without it.
					'Content-Type': 'application/json',
					Authorization: `Bearer ${tokenFromStorage}`,
				},
			});
			fetchMenu(page);
			closeModal();
		}
	};

	return (
		<div className="swap-days-buttons">
			<Row>
				{availableSwapDays &&
					availableSwapDays.map((day) => {
						return <SwapButton dayID={day.menuID} dayOfWeek={day.dayOfWeek} recipeName={day.recipeName} currentDay={week} swapHandler={swapHandler} />;
					})}
			</Row>
		</div>
	);
};

const SwapButton = ({ dayID, dayOfWeek, recipeName, currentDay, swapHandler }) => {
	const isToday = dayOfWeek === currentDay;
	const classes = ['site-btn'];
	if (isToday) {
		classes.push('today');
	}
	return (
		<Col lg={3}>
			<Button type="danger" className={classes.join(' ')} onClick={() => swapHandler(dayID)}>
				<div>{dayOfWeek}</div>
				<div className="recipe-name">{recipeName}</div>
			</Button>
		</Col>
	);
};

export default ChangeButton;
