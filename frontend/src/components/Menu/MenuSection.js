import { useCallback, useContext, useEffect, useState } from 'react';
import { Row, Spinner } from 'reactstrap';
import './MenuSection.css';
import RecipeCard from '../Recipes/RecipeCard';
import MenuNav from './MenuNav';
import RerollButton from './RecipeButtons/RerollButton';
import SkipButton from './RecipeButtons/SkipButton';
import MadeButton from './RecipeButtons/MadeButton';
import { AcUnit } from '@mui/icons-material';
import LeftoversButton from './RecipeButtons/LeftoversButton';
import ChangeButton from './RecipeButtons/ChangeButton';
import AuthContext from '../../authentication/auth-context';

const MenuSection = () => {
	const [page, setPage] = useState(0);
	const [currentRecipeIDs, setCurrentRecipeIDs] = useState([]);

	const fetchMenu = useCallback(async (page) => {
		const response = await fetch(`/api/menu/${page}`);
		const data = await response.json();
		const menu = data.days;
		console.log('Retrieved Menu from Server', menu);
		setWeekOfYear(data.weekOfYear);
		setMenus(menu);
		setCurrentRecipeIDs(menu.map((m) => m.recipe?.RecipeID));
	}, []);

	useEffect(() => {
		fetchMenu(page);
	}, [fetchMenu, page]);

	const [menus, setMenus] = useState(null);
	const [weekOfYear, setWeekOfYear] = useState(null);

	if (menus === null) {
		return (
			<section className="hero">
				<div className="container">
					<Spinner
						color="success"
						style={{
							height: '2em',
							width: '2em',
						}}
					></Spinner>
					<span className="loading-text">Loading menu</span>
				</div>
			</section>
		);
	} else {
		const sundayRecipe = menus[1]?.recipe;

		const availableSwapDays = menus.map((m) => ({
			dayOfWeek: m?.week,
			menuID: m?.menuID,
			recipeName: m?.recipe?.Name,
		}));

		return (
			<section className="hero">
				<div className="container">
					<MenuNav menus={menus} weekOfYear={weekOfYear} page={page} setPage={setPage} fetchMenu={fetchMenu} />
					{menus?.length === 0 && <span>No menu found. This should not happen!</span>}
					<MenuRow menus={menus} fetchMenu={fetchMenu} page={page} currentRecipeIDs={currentRecipeIDs} size={5} availableSwapDays={availableSwapDays} />
				</div>
			</section>
		);
	}
};

const MenuRow = ({ menus, fetchMenu, page, currentRecipeIDs, size, availableSwapDays }) => {
	return (
		<Row>
			{menus?.map((menu, index) => {
				const tomorrowsRecipe = menus[index + 1]?.recipe;
				let cardSize = size;
				if (index === 0) {
					cardSize = {
						size,
						offset: 1,
					};
				}

				return (
					<MenuCard
						key={index}
						availableSwapDays={availableSwapDays}
						fetchMenu={fetchMenu}
						menu={menu}
						page={page}
						currentRecipeIDs={currentRecipeIDs}
						tomorrowsRecipe={tomorrowsRecipe}
					/>
				);
			})}
		</Row>
	);
};

const MenuCard = ({ menu, fetchMenu, page, currentRecipeIDs, tomorrowsRecipe, availableSwapDays }) => {
	const authContext = useContext(AuthContext);

	const cardClasses = ['day-header'];

	if (menu.isToday) {
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
		<div className="col-md-6 col-lg-3 ftco-animate fadeInUp ftco-animated recipe-card">
			<div className={cardClasses.join(' ')}>
				{authContext.isAdmin && <ChangeButton fetchMenu={fetchMenu} menu={menu} page={page} availableSwapDays={availableSwapDays} />}
				<div>{menu.week}</div>
				<div>{menu.date}</div>
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
			<DayPreparation tomorrowsRecipe={tomorrowsRecipe} />
		</div>
	);
};

const DayPreparation = ({ tomorrowsRecipe }) => {
	const dayPrep = tomorrowsRecipe?.DayPrep;
	const defrost = tomorrowsRecipe?.Defrost;

	if (!dayPrep && !defrost) {
		return null;
	}

	const dayPrepSplit = (dayPrep && dayPrep.split('\n')) || [];
	const defrostSplit = (defrost && defrost.split(',')) || [];

	return (
		<div className="prep-footer">
			<div className="prep-title">Tomorrow's Prep</div>
			<div>
				{defrostSplit.map((defrost, index) => {
					return (
						<div key={index} className="defrost">
							<AcUnit /> {defrost}
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

export default MenuSection;
