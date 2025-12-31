import { useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import './RecipePage.scss';
import { Button, Col, Row } from 'reactstrap';
import Rating from '../components/Settings/Rating';
import { formatDistance } from 'date-fns';
import { Edit, Trash2 } from 'react-feather';
import useWakeLock from '../components/Common/useWakeLock';
import LoadingText from '../components/Common/LoadingText';
import { PrepTimeLabel, ThumbnailPreview } from './edit/RecipeEditPage';
import NewArrivalTag from 'components/Recipes/NewArrivalTag';
import MenuContext from 'authentication/menu-context';
import { useAuth, useBetterModal } from '@blackpenguins/penguinore-common-ext';
import { useThumbnailBackgroundStyle } from 'components/Recipes/RecipeRow';
import { TZDate } from '@date-fns/tz';

const RecipePage = () => {
	// Keep screen alive on mobile phones on this page
	useWakeLock();

	const params = useParams();
	const recipeID = params.recipeID;
	const [recipe, setRecipe] = useState(null);
	const [book, setBook] = useState(null);

	const fetchRecipe = useCallback(async () => {
		if (recipeID) {
			const response = await fetch(`/api/recipes/${recipeID}`);
			const data = await response.json();
			setRecipe(data);

			if (data.BookID) {
				const response = await fetch(`/api/books/${data.BookID}`);
				const bookData = await response.json();
				setBook(bookData);
			}
		}
	}, [recipeID]);

	useEffect(() => {
		fetchRecipe();
	}, [fetchRecipe]);

	console.log("Recipe of Page", recipe);
	if (recipe === null) {
		return (
			<div className="container">
				<LoadingText text="Loading recipe" />
			</div>
		);
	} else {
		return (
			<section className="hero">
				<div className="container recipe-details-container">
					<RecipeTitle recipe={recipe} />
					<Row className="topSection">
						<Col lg={4}>
							<HeaderImage recipe={recipe} />
						</Col>
						<Col lg={8}>
							<Statistics recipe={recipe} book={book} />
						</Col>
					</Row>
					<Row className="mainSection">
						<Col lg={4}>
							<Ingredients ingredients={recipe?.ingredients} />
						</Col>
						<Col lg={8}>
							<StepGroups stepGroups={recipe?.stepGroups} />
							{recipe.thumbnails &&
								recipe.thumbnails.map((thumbnail, index) => {
									if (thumbnail.IsPrimary === 1) {
										// We already show it in the main thumbnail
										return null;
									} else {
										return <ThumbnailPreview key={thumbnail.ThumbnailID} thumbnail={thumbnail} canEdit={false} />;
									}
								})}
						</Col>
					</Row>
					<Notes icon={<span className='section-icon'>&#128466;</span>} title="Notes" notes={recipe?.Notes} />
					<Notes icon={<span className='section-icon'>&#128298;</span>} title="Day Preparation" notes={recipe?.DayPrep} />

					<History history={recipe?.history} />

					<Controls recipe={recipe} />
				</div>
			</section>
		);
	}
};

const RecipeTitle = ({ recipe }) => {
	const menuContext = useContext(MenuContext);
	const recipeID = recipe.RecipeID;

	const nameClasses = ['section-title'];

	if (!recipe?.IsActive) {
		nameClasses.push('hidden');
	}

	const isMenuRecipe = menuContext.isMenuRecipeHandler(recipeID);

	return (
		<div className={nameClasses.join(' ')}>
			
			<MenuButton isMenuRecipe={isMenuRecipe} label="Prev" labelMobile="<" action={() => menuContext.redirectToPreviousRecipeHandler(recipeID)} />
			<span className="desktop">
				<h2>{recipe.Name}</h2>
			</span>
			<span className="mobile">
				<h2>{recipe.Name}</h2>
			</span>
			<MenuButton isMenuRecipe={isMenuRecipe} label="Next" labelMobile=">" action={() => menuContext.redirectToNextRecipeHandler(recipeID)} />
		</div>
	);
};

const MenuButton = ({ isMenuRecipe, label, labelMobile, action }) => {
	if (!isMenuRecipe) {
		return null;
	}

	return (
		<Button className="mangia-btn muted recipe-menu-button" onClick={action}>
			<span className="desktop">{label}</span>
			<span className="mobile">{labelMobile}</span>
		</Button>
	);
};

const Statistics = ({ recipe, book }) => {
	const lastMadeDateUTC = new Date(recipe.lastmade);
	const [recipeTags, setRecipeTags] = useState([]);

	const lastMadeDate = new TZDate(lastMadeDateUTC, 'America/New_York');

	const days = formatDistance(lastMadeDate, new Date(), { addSuffix: true });

	const fetchRecipeTags = useCallback(async () => {
		const response = await fetch(`/api/recipes/${recipe.RecipeID}/tags`);
		const data = await response.json();
		console.log('Retrieved Recipe Tags from Server', data);
		setRecipeTags(data);
	}, [recipe]);

	useEffect(() => {
		fetchRecipeTags();
	}, [fetchRecipeTags]);

	return (
		<div className="quick-facts">
			{recipeTags.length > 0 && (
				<div className="tag-container">
					{recipeTags.map((tag, index) => {
						return (
							<span key={index} className="tag-box-1 recipe">
								<span className="tag-name-1">{tag.Name}</span>
							</span>
						);
					})}
				</div>
			)}

			<Description description={recipe?.Description} />
			{recipe?.Category && (
				<div>
					<span className="label"><span className='section-icon'>&#x1F4C2;</span> Category:</span> {recipe.Category}
				</div>
			)}
			{recipe?.lastmade && (
				<div>
					<span className="label"><span className='section-icon'>&#x1F552;</span> Last Made:</span> {days}
				</div>
			)}
			{book && (
				<>
					<div>
						<span className="label"><span className='section-icon'>&#x1F4D6;</span> Book:</span> {book.Name} (Page {recipe.Page})
					</div>
				</>
			)}
			{recipe?.Protein && (
				<div>
					<span className="label"><span className='section-icon'>&#127831;</span> Protein:</span> {recipe.Protein}
				</div>
			)}
			{recipe?.Defrost && (
				<div>
					<span className="label"><span className='section-icon'>&#129482;</span> Defrost:</span> {recipe.Defrost}
				</div>
			)}
			{recipe?.PrepTime && (
				<div>
					<span className="label"><span className='section-icon'>&#8987;</span> Prep Time:</span> <PrepTimeLabel value={recipe.PrepTime} />
				</div>
			)}
			{recipe?.Preheat > 0 && (
				<div>
					<span className="label"><span className='section-icon'>&#128293;</span> Preheat Temp:</span> {recipe.Preheat}&deg;
				</div>
			)}
			{recipe?.URL && (
				<div>
					<span className="label"><span className='section-icon'>&#x1F517;</span> URL:</span> <a href={recipe.URL}>{recipe.URL}</a>
				</div>
			)}
		</div>
	);
};

const Controls = ({ recipe }) => {
	const authContext = useAuth();

	const { modal, openModal } = useConfirmDeleteModal(recipe?.RecipeID);

	const navigate = useNavigate();

	if (!authContext.isAdmin) {
		return null;
	}

	return (
		<>
			{modal}

			<div className="bottom-buttons">
				<Button className="mangia-btn danger" onClick={() => openModal()}>
					<Trash2 /> Delete
				</Button>
				<Button className="mangia-btn success" onClick={() => navigate(`/recipe/${recipe?.RecipeID}/edit`)}>
					<Edit /> Edit
				</Button>
			</div>
		</>
	);
};
const HeaderImage = ({ recipe }) => {
	const thumbnailStyle = useThumbnailBackgroundStyle(recipe, false);

	return (
		<a href={thumbnailStyle.thumbnailImageURL} target='_blank'>
			<div style={thumbnailStyle} className="thumbnail-container">
				<NewArrivalTag recipe={recipe} />
				<Rating rating={recipe?.Rating} size="20" />
			</div>
		</a>
	);
};

const Description = ({ description }) => {
	return <div className="description">{description}</div>;
};

const Ingredients = ({ ingredients }) => {
	if (ingredients?.length === 0) {
		return null;
	}
	return (
		<div className="ingredients">
			<h4><span className='section-icon'>&#x1F955;</span>Ingredients</h4>
			<ul>
				{ingredients &&
					ingredients.map((ingredient, index) => {
						const classes = [];
						if (ingredient.tagID != null) {
							classes.push('tagged');
						}
						return (
							<li className={classes.join(' ')} key={index}>
								{ingredient.name}

								{ingredient?.isMissingUnits === 1 && (
									<span className='missing-units'>
										Missing Units
									</span>
								)}

							</li>
						);
					})}
			</ul>
		</div>
	);
};

const StepGroups = ({ stepGroups }) => {
	if (stepGroups?.length === 0) {
		return null;
	}

	return stepGroups.map( (stepGroup) => {
		return (
			<div className="steps">
				<h4><span className='section-icon'>&#x1F4DD;</span>{stepGroup.header}</h4>
				<StepGroup stepGroup={stepGroup}/>
			</div>
		);
	});
};

const StepGroup = ({ stepGroup }) => {
	if (stepGroup.steps?.length === 0 || stepGroup.steps == null) {
		return null;
	}

	return stepGroup.steps.split("\n").filter( s => !!s).map((step, stepNumber) => <Step step={step} stepNumber={stepNumber + 1}/>);
};

const Step = ({ step, stepNumber }) => {
	return (
		<div key={stepNumber} className="step">
			<div className="number">
				<div>{stepNumber}</div>
			</div>
			<div className="instruction">{step}</div>
		</div>
	);
};

const Notes = ({ icon, title, notes }) => {
	if (!notes) {
		return null;
	}

	const notesSplit = notes.split('\n');

	return (
		<div className="extraSection">
			<h4>{icon}{title}</h4>
			<ul>
				{notesSplit.map((note, index) => {
					if( note ) {
						return <li key={index}>{note}</li>;
					}
				})}
			</ul>
		</div>
	);
};

const History = ({ history }) => {
	return (
		<div className="extraSection history">
			<h4><span className='section-icon'>&#x1F552;</span> History</h4>
			<ul>
				{history &&
					history.map((historyItem, index) => {
						const classes = [];
						if (historyItem.IsMade) {
							classes.push('made');
						}
						return (
							<li className={classes.join(' ')} key={index}>
								{historyItem.date}
							</li>
						);
					})}
			</ul>
		</div>
	);
};

const useConfirmDeleteModal = (recipeID) => {
	const authContext = useAuth();
	const tokenFromStorage = authContext.tokenFromStorage;

	const navigate = useNavigate();

	const deleteHandler = async () => {
		await fetch(`/api/recipes/${recipeID}`, {
			method: 'DELETE',
			headers: {
				// This is required. NodeJS server won't know how to read it without it.
				'Content-Type': 'application/json',
				Authorization: `Bearer ${tokenFromStorage}`,
			},
		});
		navigate('/home');
	};

	const { modal, openModal } = useBetterModal({
		title: 'Delete this Recipe',
		content: (closeModal) => <div>Are you sure you want to delete this recipe?</div>,
		footer: (closeModal) => (
			<>
				<Button className="mangia-btn danger" onClick={deleteHandler}>
					Yes, Delete
				</Button>
			</>
		),
	});
	return { modal, openModal };
};

export default RecipePage;
