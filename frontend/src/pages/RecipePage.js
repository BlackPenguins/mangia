import { useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import './RecipePage.scss';
import { Button, Col, Row } from 'reactstrap';
import Rating from '../components/Settings/Rating';
import { utcToZonedTime } from 'date-fns-tz';
import { formatDistance } from 'date-fns';
import { Edit, Trash2 } from 'react-feather';
import LoadingText from '../components/Common/LoadingText';
import { PrepTimeLabel, ThumbnailPreview } from './edit/RecipeEditPage';
import { getThumbnailImage } from 'components/Recipes/RecipeCard';
import NewArrivalTag from 'components/Recipes/NewArrivalTag';
import MenuContext from 'authentication/menu-context';
import { useAuth, useBetterModal } from '@blackpenguins/penguinore-common-ext';

const RecipePage = () => {
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
							<Steps steps={recipe?.steps} />
							{recipe.thumbnails &&
								recipe.thumbnails.map((thumbnail, index) => {
									if (index === 0) {
										// We already show it in the main thumbnail
										return null;
									} else {
										return <ThumbnailPreview key={thumbnail.ThumbnailID} thumbnail={thumbnail} canEdit={false} />;
									}
								})}
						</Col>
					</Row>
					<Notes title="Notes" notes={recipe?.Notes} />
					<Notes title="Day Preparation" notes={recipe?.DayPrep} />

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
	const lastMadeDate = utcToZonedTime(lastMadeDateUTC, 'America/New_York');

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
							<span key={index} className="tag">
								<span className="tag-name">{tag.Name}</span>
							</span>
						);
					})}
				</div>
			)}

			<Description description={recipe?.Description} />
			{recipe?.Category && (
				<div>
					<span className="label">Category:</span> {recipe.Category}
				</div>
			)}
			{recipe?.lastmade && (
				<div>
					<span className="label">Last Made:</span> {days}
				</div>
			)}
			{book && (
				<>
					<div>
						<span className="label">Book:</span> {book.Name} (Page {recipe.Page})
					</div>
				</>
			)}
			{recipe?.Protein && (
				<div>
					<span className="label">Protein:</span> {recipe.Protein}
				</div>
			)}
			{recipe?.Defrost && (
				<div>
					<span className="label">Defrost:</span> {recipe.Defrost}
				</div>
			)}
			{recipe?.PrepTime && (
				<div>
					<span className="label">Prep Time:</span> <PrepTimeLabel value={recipe.PrepTime} />
				</div>
			)}
			{recipe?.Preheat > 0 && (
				<div>
					<span className="label">Preheat Temp:</span> {recipe.Preheat}&deg;
				</div>
			)}
			{recipe?.URL && (
				<div>
					<span className="label">URL:</span> <a href={recipe.URL}>{recipe.URL}</a>
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
	const thumbnailImage = getThumbnailImage(recipe, false);

	const thumbnailStyle = {
		backgroundImage: `url(${thumbnailImage})`,
		backgroundSize: 'cover',
		height: '300px',
	};

	return (
		<div style={thumbnailStyle} className="thumbnail-container">
			<NewArrivalTag recipe={recipe} />
			<Rating rating={recipe?.Rating} size="20" />
		</div>
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
			<h4>Ingredients</h4>
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
							</li>
						);
					})}
			</ul>
		</div>
	);
};

const Steps = ({ steps }) => {
	if (steps?.length === 0) {
		return null;
	}

	return (
		<div className="steps">
			<h4>Steps</h4>
			{steps.map((step) => {
				return (
					<div key={step.stepNumber} className="step">
						<div className="number">
							<div>{step.stepNumber}</div>
						</div>
						<div className="instruction">{step.instruction}</div>
					</div>
				);
			})}
		</div>
	);
};

const Notes = ({ title, notes }) => {
	if (!notes) {
		return null;
	}

	const notesSplit = notes.split('\n');

	return (
		<div className="extraSection">
			<h4>{title}</h4>
			<ul>
				{notesSplit.map((note, index) => {
					return <li key={index}>{note}</li>;
				})}
			</ul>
		</div>
	);
};

const History = ({ history }) => {
	return (
		<div className="extraSection history">
			<h4>History</h4>
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
