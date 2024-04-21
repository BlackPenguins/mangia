import { useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import './RecipePage.css';
import { Button, Col, Row, Spinner } from 'reactstrap';
import Rating from '../components/Settings/Rating';
import Modal from '../components/Modal';
import { utcToZonedTime } from 'date-fns-tz';
import { formatDistance } from 'date-fns';
import { Edit, Trash2 } from 'react-feather';
import AuthContext from '../authentication/auth-context';

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
		<div>
			<Spinner
				color="success"
				style={{
					height: '2em',
					width: '2em',
				}}
			></Spinner>
			<span className="loading-text">Loading recipe</span>
		</div>;
	} else {
		return (
			<section class="hero">
				<div class="container">
					<div class="section-title">
						<h2>{recipe.Name}</h2>
					</div>

					{/* <Title recipe={recipe} /> */}
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
						</Col>
					</Row>
					<Notes title="Notes" notes={recipe?.Notes} />
					<Notes title="Day Preparation" notes={recipe?.DayPrep} />

					<Controls recipe={recipe} />
				</div>
			</section>
		);
	}
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
	}, []);

	useEffect(() => {
		fetchRecipeTags();
	}, [fetchRecipeTags]);

	return (
		<div className="statistics">
			{recipeTags.length > 0 && (
				<div class="tag-section">
					{recipeTags.map((tag) => {
						return (
							<span className="tag">
								<span className="tag-name">{tag.Name}</span>
							</span>
						);
					})}
				</div>
			)}

			<Description description={recipe?.Description} />
			{recipe?.Category && (
				<div>
					<span className="statisticLabel">Category:</span> {recipe.Category}
				</div>
			)}
			{recipe?.lastmade && (
				<div>
					<span className="statisticLabel">Last Made:</span> {days}
				</div>
			)}
			{book && (
				<>
					<div>
						<span className="statisticLabel">Book:</span> {book.Name} (Page {recipe.Page})
					</div>
				</>
			)}
			{recipe?.Protein && (
				<div>
					<span className="statisticLabel">Protein:</span> {recipe.Protein}
				</div>
			)}
			{recipe?.Defrost && (
				<div>
					<span className="statisticLabel">Defrost:</span> {recipe.Defrost}
				</div>
			)}
			{recipe?.URL && (
				<div>
					<span className="statisticLabel">URL:</span> <a href={recipe.URL}>{recipe.URL}</a>
				</div>
			)}
		</div>
	);
};

const Controls = ({ recipe }) => {
	const authContext = useContext(AuthContext);

	const [showConfirmDelete, setShowConfirmDelete] = useState(false);
	const navigate = useNavigate();

	if (!authContext.isAdmin) {
		return null;
	}

	return (
		<>
			{showConfirmDelete && <ConfirmDeleteModal recipeID={recipe?.RecipeID} closeModalHandler={() => setShowConfirmDelete(false)} />}

			<div className="bottom-buttons">
				<Button className="site-btn danger" color="danger" onClick={() => setShowConfirmDelete(true)}>
					<Trash2 /> Delete
				</Button>
				<Button className="site-btn" color="success" onClick={() => navigate(`/recipe/${recipe?.RecipeID}/edit`)}>
					<Edit /> Edit
				</Button>
			</div>
		</>
	);
};
const HeaderImage = ({ recipe }) => {
	const thumbnailImage = (recipe?.Image && `http://mangia.penguinore.net:6200/thumbs/${recipe?.Image}`) || '/images/no-thumb.png';

	const thumbnailStyle = {
		backgroundImage: `url(${thumbnailImage})`,
		backgroundSize: 'cover',
		height: '300px',
	};

	return (
		<div style={thumbnailStyle} className="thumbnail-container">
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
						return (
							<li key={index}>
								{ingredient.amount} {ingredient.rawname}
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
					<div className="step" key={step.stepNumber}>
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
		<div className="notes">
			<h4>{title}</h4>
			<ul>
				{notesSplit.map((note) => {
					return <li>{note}</li>;
				})}
			</ul>
		</div>
	);
};

const ConfirmDeleteModal = ({ recipeID, closeModalHandler }) => {
	const navigate = useNavigate();

	const deleteHandler = async () => {
		await fetch(`/api/recipes/${recipeID}`, {
			method: 'DELETE',
			headers: {
				// This is required. NodeJS server won't know how to read it without it.
				'Content-Type': 'application/json',
			},
		});
		navigate('/home');
	};

	return (
		<>
			<Modal className="confirm-modal" closeHandler={closeModalHandler}>
				<div>Are you sure you want to delete this recipe?</div>
				<div className="buttons">
					<Button onClick={closeModalHandler}>Close</Button>
					<Button color="danger" onClick={deleteHandler}>
						Yes, Delete
					</Button>
				</div>
			</Modal>
		</>
	);
};

export default RecipePage;
