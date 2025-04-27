import { useCallback, useContext, useEffect, useState } from 'react';
import { Button, Col, Row } from 'reactstrap';
import './MenuSection.scss';
import RecipeCard, { DaysAgo } from '../Recipes/RecipeCard';
import MenuNav from './MenuNav';
import RerollButton from './RecipeButtons/RerollButton';
import SkipButton from './RecipeButtons/SkipButton';
import MadeButton from './RecipeButtons/MadeButton';
import { AcUnit, Lightbulb } from '@mui/icons-material';
import LeftoversButton from './RecipeButtons/LeftoversButton';
import ChangeButton from './RecipeButtons/ChangeButton';
import LoadingText from 'components/Common/LoadingText';
import MenuContainer from './MenuContainer';
import { PrepTimeLabel } from 'pages/edit/RecipeEditPage';
import { Clock, PlusCircle, Thermometer } from 'react-feather';
import FilteredRecipes from 'components/Recipes/FilteredRecipes';
import RecipeRow from 'components/Recipes/RecipeRow';
import MenuContext from 'authentication/menu-context';
import { useAuth, useBetterModal } from '@blackpenguins/penguinore-common-ext';
import DailyNotesButton from './RecipeButtons/DailyNotesButton';

const MenuSection = () => {
	const [page, setPage] = useState(0);
	const [currentRecipeIDs, setCurrentRecipeIDs] = useState([]);
	const { setMenuRecipeIDsHandler } = useContext(MenuContext);

	const [menus, setMenus] = useState(null);
	const [suggestions, setSuggestions] = useState([]);

	const fetchMenu = useCallback(async (page) => {
		const response = await fetch(`/api/menu/${page}`);
		const data = await response.json();
		const menu = data.days;
		console.log('Retrieved Menu from Server', menu);
		setWeekOfYear(data.weekOfYear);
		setMenus(menu);
		setSuggestions(data?.suggestions);
		const recipeIDs = menu.map((m) => m.recipe?.RecipeID);
		const menuRecipeIDs = menu.filter((m) => m.isSkipped !== 1 && m.isLeftovers !== 1).map((m) => m.recipe?.RecipeID);
		setCurrentRecipeIDs(recipeIDs);
		setMenuRecipeIDsHandler(menuRecipeIDs);
	}, [setMenuRecipeIDsHandler]);

	useEffect(() => {
		fetchMenu(page);
	}, [fetchMenu, page]);


	const [showAuditInformation, setShowAuditInformation] = useState(false);

	const [weekOfYear, setWeekOfYear] = useState(null);

	if (menus === null) {
		return (
			<section className="hero">
				<div className="container">
					<LoadingText text="Loading menu" />
				</div>
			</section>
		);
	} else {
		const availableSwapDays = menus.map((m) => ({
			dayOfWeek: m?.week,
			menuID: m?.menuID,
			recipeName: m?.recipe?.Name,
		}));

		return (
			<section className="hero">
				<div className="container">
					<MenuNav
						menus={menus}
						weekOfYear={weekOfYear}
						page={page}
						setPage={setPage}
						fetchMenu={fetchMenu}
						setShowAuditInformation={setShowAuditInformation}
						showAuditInformation={showAuditInformation}
					/>
					{menus?.length === 0 && <span>No menu found. This should not happen!</span>}
					<SuggestionRow suggestions={suggestions} />
					<MenuRow menus={menus} fetchMenu={fetchMenu} page={page} currentRecipeIDs={currentRecipeIDs} size={5} availableSwapDays={availableSwapDays} showAuditInformation={showAuditInformation} />
				</div>
			</section>
		);
	}
};

const SuggestionRow = ({ suggestions }) => {
	return (
		<Row className="menu---suggestion-list">
			{suggestions &&
				suggestions?.map((suggestion, i) => {
					return (
						<Col key={i} md={6}>
							<SuggestionCard suggestion={suggestion} />
						</Col>
					);
				})}
		</Row>
	);
};

const SuggestionCard = ({ suggestion }) => {
	return (
		<div className="suggestion-card">
			<Lightbulb />
			<span className="name">{suggestion.Name}</span>
			<span className="suggestion-expires">
				<DaysAgo label="Expires" lastMade={suggestion.ExpirationDate} recentDayThreshold={14} />
			</span>
		</div>
	);
};

const MenuRow = ({ menus, fetchMenu, page, currentRecipeIDs, availableSwapDays, showAuditInformation }) => {
	const authContext = useAuth();
	const tokenFromStorage = authContext.tokenFromStorage;

	const weekID = menus[0].weekID;

	const addItemHandler = async (recipe, closeModal) => {
		const recipeID = recipe.RecipeID;

		await fetch(`/api/menu`, {
			method: 'PUT',
			body: JSON.stringify({ recipeID, weekID }),
			headers: {
				// This is required. NodeJS server won't know how to read it without it.
				'Content-Type': 'application/json',
				Authorization: `Bearer ${tokenFromStorage}`,
			},
		});
		fetchMenu(page);
		closeModal();
	};

	const { modal: extraModal, openModal: openAddExtraModal } = useBetterModal({
		title: 'Add Menu Item',
		size: 'md',
		content: (closeModal) => (
			<>
				<h3>Add Recipe</h3>
				<div className="change-recipe-container">
					<FilteredRecipes CardType={RecipeRow} onClickHandler={(recipe) => addItemHandler(recipe, closeModal)} layoutClass="lg-12" />
				</div>
			</>
		),
	});

	return (
		<>
			<Row className="menu---list">
				{menus?.map((menu, index) => {
					const tomorrowsMenu = menus[index + 1];
					return (
						<MenuCard
							key={index}
							availableSwapDays={availableSwapDays}
							fetchMenu={fetchMenu}
							menu={menu}
							page={page}
							currentRecipeIDs={currentRecipeIDs}
							tomorrowsMenu={tomorrowsMenu}
							showAuditInformation={showAuditInformation}
						/>
					);
				})}
				{extraModal}
				{authContext.isAdmin && <NewMenuButton openAddExtraModal={openAddExtraModal} /> }
			</Row>
		</>
	);
};

const NewMenuButton = ({ openAddExtraModal }) => {
	return (
		<Col md={6} lg={3} className='new-menu-card menu-card'>
			<div className="menu-container">
				<Button className="mangia-btn success" onClick={openAddExtraModal}>
					<PlusCircle />
				</Button>
			</div>
		</Col>
	);
};

const MenuCard = ({ menu, fetchMenu, page, currentRecipeIDs, tomorrowsMenu, availableSwapDays, showAuditInformation }) => {
	const authContext = useAuth();

	const cardClasses = ['day-header'];

	if (menu.hasNoDate) {
		cardClasses.push('extra');
	} else if (menu.isToday) {
		cardClasses.push('today');
	}

	const bottomButtons = [];
	if (authContext.isAdmin) {
		bottomButtons.push(<MadeButton key="made" fetchMenu={fetchMenu} menu={menu} page={page} recipe={menu?.recipe} />);
		bottomButtons.push(<SkipButton key="skip" fetchMenu={fetchMenu} menu={menu} page={page} />);
		bottomButtons.push(<LeftoversButton key="leftovers" fetchMenu={fetchMenu} menu={menu} page={page} />);
		bottomButtons.push(
			<RerollButton key="reroll" fetchMenu={fetchMenu} menuID={menu.menuID} page={page} currentRecipeIDs={currentRecipeIDs} isSkipped={menu?.isSkipped} />
		);
	}

	return (
		<Col md={6} lg={3} className="ftco-animate fadeInUp ftco-animated recipe-card menu-card">
			<MenuContainer>
				<div className={cardClasses.join(' ')}>
					{authContext.isAdmin && <ChangeButton fetchMenu={fetchMenu} menu={menu} page={page} availableSwapDays={availableSwapDays} />}
					{authContext.isAdmin && <DailyNotesButton fetchMenu={fetchMenu} menu={menu} page={page} />}
					{menu.hasNoDate && (
						<>
							<div>EXTRA ITEM</div>
							<div>&nbsp;</div>
						</>
					)}
					{!menu.hasNoDate && (
						<>
							<div>{menu.week}</div>
							<div>{menu.date}</div>
						</>
					)}
				</div>
				<RecipeCard
					key={menu.id}
					isMenu
					recipe={menu.recipe}
					isMade={menu?.isMade}
					isSkipped={menu?.isSkipped}
					skipReason={menu?.skipReason}
					isLeftovers={menu?.isLeftovers}
					bottomButtons={bottomButtons}
				/>
				<DailyNotes menu={menu} />
				<DayPreparation tomorrowsMenu={tomorrowsMenu} />
				<AuditInformation menu={menu} showAuditInformation={showAuditInformation} />
			</MenuContainer>
		</Col>
	);
};

const DailyNotes = ({ menu }) => {
	const notes = menu.dailyNotes;
	const prepTime = menu.recipe?.PrepTime;
	const preheat = menu.recipe?.Preheat;

	if (!notes && !prepTime && !preheat) {
		return null;
	}
	return (
		<div className="menu-footer daily-notes">
			{(prepTime || preheat) && (
				<div className="menu-prep-icons">
					{preheat && (
						<span className="preheat">
							<Thermometer size={14} />
							{preheat}&deg;
						</span>
					)}

					{prepTime && (
						<>
							<Clock size={14} />
							<PrepTimeLabel value={prepTime} />
						</>
					)}
				</div>
			)}
			{notes && (
				<>
					<div className="menu-footer-title">Daily Notes</div>
					<div>
						<div className="content">{notes}</div>
					</div>
				</>
			)}
		</div>
	);
};

const DayPreparation = ({ tomorrowsMenu }) => {
	if ((tomorrowsMenu?.isSkipped === 1 || tomorrowsMenu?.isLeftovers === 1)) {
		return null;
	}

	const tomorrowsRecipe = tomorrowsMenu?.recipe;
	const dayPrep = tomorrowsRecipe?.DayPrep;
	const defrost = tomorrowsRecipe?.Defrost;

	if( !dayPrep && !defrost ) {
		return null;
	}

	const dayPrepSplit = (dayPrep && dayPrep.split('\n')) || [];
	const defrostSplit = (defrost && defrost.split(',')) || [];

	return (
		<div className="menu-footer prep">
			<div className="menu-footer-title">Tomorrow's Prep</div>
			<div>
				{defrostSplit.map((defrost, index) => {
					return (
						<div key={index} className="content">
							<AcUnit fontSize="small" /> {defrost}
						</div>
					);
				})}
				{dayPrepSplit.map((dayPrep, index) => {
					return (
						<div key={index} className="prep-notes">
							{dayPrep}
						</div>
					);
				})}
			</div>
		</div>
	);
};

const AuditInformation = ({ menu, showAuditInformation }) => {
	if (!showAuditInformation || !menu.originalRanking) {
		return null;
	}

	return (
		<div className="menu-footer audit">
			<div className="menu-footer-title">Audit</div>
			<table>
				<BeforeAfter label="Rank" before={menu.originalRanking} after={menu.adjustedRanking} extra={` / ${menu.totalRankings}`} />
				<BeforeAfter label="Weight" before={menu.originalWeight} after={menu.adjustedWeight} />
				<tr>
					<td className="aged">{menu.isAged === 1 ? 'Aged' : ''}</td>
					<td><MatchedIngredients menu={menu}/></td>
					<td className="new">{menu.isNewArrival === 1 ? 'New' : ''}</td>
				</tr>
			</table>
		</div>
	);
};

export const MatchedIngredients = ( {menu}) => {
	if( !menu.matchedIngredients) {
		return <>&nbsp;</>;
	}

	return <span className='matched-ingredients'>{menu.matchedIngredients} &#129365;</span>;
}

export const BeforeAfter = ({ label, before, after, extra }) => {
	const difference = Math.round(after - before);

	let differenceClass;
	let differenceLabel;

	if (difference > 0) {
		differenceLabel = `+${difference}`;
		differenceClass = 'positive';
	} else {
		differenceLabel = difference;
		differenceClass = 'negative';
	}

	return (
		<tr className="before-after">
			<td className="label">{label}</td>
			<td className="value">
				{after}
				{extra}
			</td>
			{difference !== 0 && <td className={differenceClass}>({differenceLabel})</td>}
			{difference === 0 && <td>&nbsp;</td>}
		</tr>
	);
};

export default MenuSection;
