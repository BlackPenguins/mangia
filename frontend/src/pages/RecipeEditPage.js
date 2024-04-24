import { useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Col, FormGroup, FormText, Input, Label, Row } from 'reactstrap';

import './RecipeEditPage.css';
import EditBooksModal from '../components/Settings/EditBooksModal';
import Rating from '../components/Settings/Rating';
import Category from '../components/Recipes/Category';
import Tag from '../components/EditRecipes/Tag';
import { Book, Eye, PlusCircle, Printer, Save } from 'react-feather';
import ScanModal from '../components/Settings/ScanModal';
import AuthContext from '../authentication/auth-context';

const RecipeDetailsPage = () => {
	const navigate = useNavigate();
	const authContext = useContext(AuthContext);
	const tokenFromStorage = authContext.token;

	if (!authContext.isAdmin) {
		navigate('/home');
	}
	// TODO: Edit anything it autosaves, without needing a button click
	// TODO: Create action js tom handle all the handlers
	// TODO: Test the algorithm, show last mades on the page, something is off
	//

	const fetchRecipes = useCallback(async () => {
		const response = await fetch('/api/recipes');
		const data = await response.json();
		console.log('Retrieved Recipes from Server', data);
		setAllRecipes(data.map((r) => r.Name));
		setFilteredRecipes([]);
	}, []);

	useEffect(() => {
		fetchRecipes();
	}, [fetchRecipes]);

	const [allRecipes, setAllRecipes] = useState([]);

	const [filteredRecipes, setFilteredRecipes] = useState([]);

	const filterRecipesHandler = (searchString) => {
		if (!searchString.trim()) {
			setFilteredRecipes([]);
		} else {
			const lowercaseSearchString = searchString.toLowerCase();
			setFilteredRecipes(allRecipes.filter((recipeName) => recipeName && recipeName.toLowerCase().indexOf(lowercaseSearchString) !== -1));
		}
	};

	const params = useParams();
	const recipeID = params.recipeID;

	const [name, setName] = useState('');
	const [category, setCategory] = useState('');
	const [protein, setProtein] = useState('');
	const [defrost, setDefrost] = useState('');
	const [description, setDescription] = useState('');
	const [steps, setSteps] = useState('');
	const [ingredients, setIngredients] = useState('');
	const [bookID, setBookID] = useState(0);
	const [isActive, setIsActive] = useState(true);
	const [page, setPage] = useState('');
	const [notes, setNotes] = useState('');
	const [dayPrep, setDayPrep] = useState('');
	const [rating, setRating] = useState(1);
	const [url, setURL] = useState('');
	const [imageFile, setImageFile] = useState('');
	const [attachments, setAttachments] = useState([]);

	const fetchRecipe = useCallback(async () => {
		if (recipeID) {
			const response = await fetch(`/api/recipes/${recipeID}`);
			const data = await response.json();
			const recipe = data;
			console.log('Retrieved Recipe from Server', recipe);
			setName(recipe.Name);
			setDescription(recipe.Description);
			setBookID(recipe.BookID === null ? 0 : recipe.BookID);
			setPage(recipe.Page);
			setCategory(recipe.Category);
			setProtein(recipe.Protein);
			setDefrost(recipe.Defrost);
			setNotes(recipe.Notes);
			setDayPrep(recipe.DayPrep);
			setRating(recipe.Rating);
			setURL(recipe.URL);
			setIsActive(recipe.IsActive === 1);
			setAttachments(recipe.attachments);

			const finalSteps = recipe.steps.map((step) => step.instruction).join('\n\n');
			setSteps(finalSteps);

			const finalIngredients = recipe.ingredients
				.map((ingredient) => {
					if (ingredient.amount === 0) {
						return ingredient.rawname;
					} else {
						return `${ingredient.amount} ${ingredient.rawname}`;
					}
				})
				.join('\n');
			setIngredients(finalIngredients);
		}
	}, [recipeID]);

	useEffect(() => {
		fetchRecipe();
	}, [fetchRecipe]);

	const addRecipe = async (recipe) => {
		console.log('Adding new recipe', recipe);
		const response = await fetch('/api/recipes', {
			method: 'PUT',
			body: JSON.stringify(recipe),
			headers: {
				// This is required. NodeJS server won't know how to read it without it.
				'Content-Type': 'application/json',
				Authorization: `Bearer ${tokenFromStorage}`,
			},
		});
		const data = await response.json();

		if (response.status === 200) {
			console.log('Recipe added successfully.', data);
			navigate(`/recipe/${data.recipeID}`);
		} else {
			console.error('ERROR: ' + data.message);
		}
	};

	const previewAction = () => navigate(`/recipe/${recipeID}`);

	const updateRecipe = async (recipe) => {
		console.log('Updating recipe', recipe);
		const response = await fetch(`/api/recipes/${recipeID}`, {
			method: 'PATCH',
			body: JSON.stringify(recipe),
			headers: {
				// This is required. NodeJS server won't know how to read it without it.
				'Content-Type': 'application/json',
				Authorization: `Bearer ${tokenFromStorage}`,
			},
		});
		const data = await response.json();

		if (data.success) {
			console.log('Recipe updated successfully.', data);

			if (imageFile) {
				const imageData = new FormData();
				imageData.append('imageFile', imageFile);

				console.log('posting', imageFile);
				await fetch(`/api/recipes/image/${recipeID}`, {
					method: 'POST',
					body: imageData,
					headers: {
						Authorization: `Bearer ${tokenFromStorage}`,
					},
				});
				// const data = await response.json();
			}
		}
	};

	const onSaveHandler = (event) => {
		event.preventDefault();

		const recipeJSON = {
			name,
			description,
			category,
			protein,
			defrost,
			bookID,
			page,
			notes,
			dayPrep,
			rating,
			url,
			isActive,
		};

		recipeJSON.steps = steps.split('\n');
		recipeJSON.ingredients = ingredients.split('\n');

		if (recipeID) {
			updateRecipe(recipeJSON);
		} else {
			addRecipe(recipeJSON);
		}
	};

	return (
		<>
			<div class="section-title">
				<h2>{recipeID ? 'Edit' : 'Add'} Recipe</h2>
			</div>

			<section class="hero edit-recipe-section">
				<div class="container">
					<div>
						<Row>
							<Col lg={12}>
								<ActiveCheckbox value={isActive} setValue={setIsActive} />
							</Col>
						</Row>
						<Row>
							<Col lg={9}>
								<NameInput value={name} setValue={setName} filteredRecipes={filteredRecipes} filterRecipesHandler={filterRecipesHandler} />
								<DescriptionInput value={description} setValue={setDescription} />
								<Row>
									<Col lg={4}>
										<Category category={category} setCategory={setCategory} />
									</Col>
									<Col lg={8}>
										<ProteinDropdown value={protein} setValue={setProtein} />
									</Col>
								</Row>
								<Row>
									<Col lg={4}>
										<IngredientsTextarea value={ingredients} setValue={setIngredients} />
									</Col>
									<Col lg={8}>
										<StepsTextarea value={steps} setValue={setSteps} />
									</Col>
								</Row>
							</Col>
							<Col lg={3}>
								<NotesTextarea value={notes} setValue={setNotes} />
								<DayPrepTextarea value={dayPrep} setValue={setDayPrep} />
								<DefrostInput value={defrost} setValue={setDefrost} />
							</Col>
						</Row>
						<Row>
							<Col lg={9}>
								<BooksSection
									bookID={bookID}
									setBookID={setBookID}
									page={page}
									setPage={setPage}
									attachments={attachments}
									fetchRecipe={fetchRecipe}
									recipeID={recipeID}
								/>
							</Col>
							<Col lg={3} className="rating-row">
								<Rating rating={rating} setRating={setRating} size="48" />
							</Col>
						</Row>

						<Row>
							<Col>
								<URLInput value={url} setValue={setURL} />
							</Col>
						</Row>
						<Row>
							<Col>
								<ThumbnailSection setValue={setImageFile} />
							</Col>
						</Row>

						<Tag recipeID={recipeID} />

						<div className="bottom-buttons">
							<Button className="site-btn muted" onClick={previewAction}>
								<Eye /> Preview
							</Button>
							<Button className="site-btn" onClick={onSaveHandler}>
								{!recipeID && (
									<span>
										<PlusCircle /> Add Recipe
									</span>
								)}
								{recipeID && (
									<span>
										<Save /> Save Changes
									</span>
								)}
							</Button>
						</div>
					</div>
				</div>
			</section>
		</>
	);
};

const ThumbnailSection = ({ setValue }) => {
	const fileChangeHandler = (event) => {
		setValue(event.target.files[0]);
	};

	return (
		<FormGroup row>
			<Col sm={12}>
				<Input id="recipe-image" name="file" type="file" onChange={fileChangeHandler} />
				<FormText>The preview image for the recipe.</FormText>
			</Col>
		</FormGroup>
	);
};
const ActiveCheckbox = ({ value, setValue }) => {
	return (
		<div>
			<FormGroup check inline>
				<Input
					checked={value}
					onClick={() => {
						setValue(!value);
					}}
					type="checkbox"
				/>
				<Label check>Active</Label>
			</FormGroup>
		</div>
	);
};

const NameInput = ({ value, setValue, filteredRecipes, filterRecipesHandler }) => {
	return (
		<div class="form-floating">
			<Input
				className="editInput"
				id="recipe-name"
				type="text"
				maxLength={50}
				placeholder="Name"
				onChange={(e) => {
					setValue(e.target.value);
					filterRecipesHandler(e.target.value);
				}}
				value={value}
			></Input>
			<label for="recipe-name">Name</label>
			{filteredRecipes.length > 0 && (
				<div className="recipe-name-results">
					{filteredRecipes.map((recipe) => {
						return <div className="recipe-name-option">{recipe}</div>;
					})}
				</div>
			)}
		</div>
	);
};

const DescriptionInput = ({ value, setValue }) => {
	return (
		<div class="form-floating">
			<Input
				className="editInput"
				id="recipe-description"
				type="textarea"
				placeholder="Description"
				onChange={(e) => {
					setValue(e.target.value);
				}}
				value={value}
			/>
			<label for="recipe-description">Description</label>
		</div>
	);
};

const ProteinDropdown = ({ value, setValue }) => {
	return (
		<div class="form-floating">
			<Input
				id="protein-dropdown"
				className="edit-protein-dropdown"
				type="select"
				onChange={(e) => {
					setValue(e.target.value);
				}}
				value={value}
			>
				<option value="None">None</option>
				<option value="Fish">Fish</option>
				<option value="Steak">Steak</option>
			</Input>
			<label for="protein-dropdown">Protein</label>
		</div>
	);
};

const IngredientsTextarea = ({ value, setValue }) => {
	return (
		<div class="form-floating ingredients">
			<Input
				className="editInput form-control"
				id="recipe-ingredients"
				type="textarea"
				placeholder="Ingredients"
				onChange={(e) => {
					setValue(e.target.value);
				}}
				value={value}
				rows={15}
			/>
			<label for="recipe-ingredients">Ingredients</label>
		</div>
	);
};

const StepsTextarea = ({ value, setValue }) => {
	return (
		<div class="form-floating steps">
			<Input
				className="editInput"
				id="recipe-steps"
				type="textarea"
				placeholder="Steps"
				onChange={(e) => {
					setValue(e.target.value);
				}}
				value={value}
				rows={15}
			/>
			<label for="recipe-steps">Steps</label>
		</div>
	);
};

const NotesTextarea = ({ value, setValue }) => {
	return (
		<div class="form-floating notes">
			<Input
				className="editInput"
				id="recipe-notes"
				type="textarea"
				placeholder="Notes"
				rows={16}
				onChange={(e) => {
					setValue(e.target.value);
				}}
				value={value}
			/>
			<label for="recipe-notes">Notes</label>
		</div>
	);
};

const DayPrepTextarea = ({ value, setValue }) => {
	return (
		<div class="form-floating notes">
			<Input
				className="editInput"
				id="recipe-day-prep"
				type="textarea"
				placeholder="Day Preparation"
				rows={5}
				onChange={(e) => {
					setValue(e.target.value);
				}}
				value={value}
			/>
			<label for="recipe-day-prep">Day Earlier Preparation</label>
		</div>
	);
};

const DefrostInput = ({ value, setValue }) => {
	return (
		<div class="form-floating">
			<Input
				id="defrost"
				className="mb-3"
				style={{ width: '100%' }}
				type="text"
				placeholder="Defrost"
				onChange={(e) => {
					setValue(e.target.value);
				}}
				value={value}
			/>
			<label for="defrost">Defrost</label>
		</div>
	);
};

const URLInput = ({ value, setValue }) => {
	return (
		<div class="form-floating">
			<Input
				id="recipe-url"
				className="mb-3"
				type="text"
				placeholder="URL"
				onChange={(e) => {
					setValue(e.target.value);
				}}
				value={value}
			></Input>
			<label for="recipe-url">URL</label>
		</div>
	);
};
const BooksSection = ({ bookID, setBookID, page, setPage, fetchRecipe, attachments, recipeID }) => {
	const [books, setBooks] = useState([]);
	const [showEditBookModal, setShowEditBookModal] = useState(false);
	const [showScanModal, setShowScanModal] = useState(false);

	const showEditBookModalHandler = () => setShowEditBookModal(true);
	const hideEditBookModalHandler = () => setShowEditBookModal(false);

	const showScanModalHandler = () => setShowScanModal(true);
	const hideScanModalHandler = () => setShowScanModal(false);

	const fetchBooks = useCallback(async () => {
		const response = await fetch('/api/books', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		});
		const data = await response.json();
		const books = data;
		setBooks(books);
	}, []);

	useEffect(() => {
		fetchBooks();
	}, [fetchBooks]);

	console.log('BOK', books);
	const bookOptions = books.map((book) => {
		return (
			<option key={book.BookID} value={book.BookID}>
				{book.Name}
			</option>
		);
	});

	return (
		<Row>
			{showEditBookModal && <EditBooksModal books={books} fetchBooks={fetchBooks} closeModalHandler={hideEditBookModalHandler} />}
			{showScanModal && <ScanModal fetchRecipe={fetchRecipe} attachments={attachments} closeModalHandler={hideScanModalHandler} recipeID={recipeID} />}
			<Col lg={4}>
				<div class="form-floating">
					<Input
						className="edit-book-dropdown"
						type="select"
						onChange={(e) => {
							setBookID(e.target.value);
						}}
						value={bookID}
					>
						<option value={0}>None</option>
						{bookOptions}
					</Input>
					<label for="edit-book-dropdown">Book</label>
				</div>
			</Col>
			<Col lg={2}>
				<div class="form-floating">
					<Input
						id="page"
						type="text"
						placeholder="Page"
						onChange={(e) => {
							setPage(e.target.value);
						}}
						value={page}
					></Input>
					<label for="page">Page</label>
				</div>
			</Col>
			<Col lg={3} className="recipe-edit-btn">
				<Button className="site-btn muted" onClick={showEditBookModalHandler}>
					<Book /> Edit Books
				</Button>
			</Col>
			<Col lg={3} className="recipe-edit-btn">
				<Button className="site-btn muted" onClick={showScanModalHandler}>
					<Printer /> Scan
				</Button>
			</Col>
		</Row>
	);
};
export default RecipeDetailsPage;
