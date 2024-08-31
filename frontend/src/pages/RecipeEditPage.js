import { useCallback, useContext, useEffect, useState } from 'react';
import { debounce } from 'lodash';

import { useNavigate, useParams } from 'react-router-dom';
import { Button, Col, FormGroup, FormText, Input, Label, Row } from 'reactstrap';

import './RecipeEditPage.scss';
import Rating from '../components/Settings/Rating';
import Category from '../components/Recipes/Category';
import Tag, { TagBox } from '../components/EditRecipes/Tag';
import { ArrowDown, ArrowUpCircle, Book, Eye, PlusCircle, Printer, Save } from 'react-feather';
import useScanModal from '../components/Settings/useScanModal';
import AuthContext from '../authentication/auth-context';
import InputWithAutocomplete from '../components/EditRecipes/InputWithAutocomplete';
import ImportRecipeModal from '../components/Settings/ImportRecipeModal';

const RecipeDetailsPage = () => {
	const navigate = useNavigate();
	const authContext = useContext(AuthContext);
	const tokenFromStorage = authContext.token;

	if (authContext.isNotAdmin()) {
		console.log('Kicking the non-admin out of the edit page!');
		navigate('/home');
	}

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
	const [ingredients, setIngredients] = useState([]);
	const [ingredientsBulk, setIngredientsBulk] = useState('');
	const [ingredientsDebug, setIngredientsDebug] = useState('');
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

			const ingredientsBulk = recipe.ingredients.map((ingredient) => ingredient.name).join('\n');
			console.log('SET IT', ingredientsBulk);
			setIngredients(recipe.ingredients);
			setIngredientsBulk(ingredientsBulk);
			setIngredientsDebug(recipe.ingredients);
		}
	}, [recipeID]);

	useEffect(() => {
		fetchRecipe();
	}, [fetchRecipe]);

	const previewAction = () => navigate(`/recipe/${recipeID}`);

	const [showImportModal, setShowImportModal] = useState(false);

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
	};

	const updateImage = async (imageFile) => {
		console.log('Image updated successfully.', imageFile);

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
		}
	};

	const debounceEditFunction = useCallback(debounce(updateRecipe, 1500), [tokenFromStorage]);

	const isActiveHandler = (value) => {
		setIsActive(value);
		debounceEditFunction({ isActive: value });
	};

	const nameHandler = (value) => {
		setName(value);
		debounceEditFunction({ name: value });
	};

	const descriptionHandler = (value) => {
		setDescription(value);
		debounceEditFunction({ description: value });
	};

	const categoryHandler = (value) => {
		setCategory(value);
		debounceEditFunction({ category: value });
	};

	const proteinHandler = (value) => {
		setProtein(value);
		debounceEditFunction({ protein: value });
	};

	const stepsHandler = (value) => {
		setSteps(value);
		debounceEditFunction({ steps: value.split('\n') });
	};

	const ingredientsHandler = (value) => {
		setIngredientsBulk(value);
		debounceEditFunction({ ingredients: value.split('\n') });
	};

	const notesHandler = (value) => {
		setNotes(value);
		debounceEditFunction({ notes: value });
	};

	const dayPrepHandler = (value) => {
		setDayPrep(value);
		debounceEditFunction({ dayPrep: value });
	};

	const urlHandler = (value) => {
		setURL(value);
		debounceEditFunction({ url: value });
	};

	const thumbnailHandler = (value) => {
		setImageFile(value);
		updateImage(value);
	};

	const ratingHandler = (value) => {
		setRating(value);
		debounceEditFunction({ rating: value });
	};

	const defrostHandler = (value) => {
		setDefrost(value);
		debounceEditFunction({ defrost: value });
	};

	const pageHandler = (value) => {
		setPage(value);
		debounceEditFunction({ page: value });
	};

	const bookIDHandler = (value) => {
		setBookID(value);
		debounceEditFunction({ bookID: value });
	};

	const nameClasses = ['section-title'];

	if (!isActive) {
		nameClasses.push('hidden');
	}

	return (
		<div className="container recipe-edit-container">
			{showImportModal && <ImportRecipeModal closeModalHandler={() => setShowImportModal(true)} currentRecipeID={recipeID} />}

			<div className={nameClasses.join(' ')}>
				<h2>Edit Recipe</h2>
			</div>

			<section className="hero">
				<div>
					<Row>
						<Col lg={12}>
							<ActiveCheckbox value={isActive} setValue={isActiveHandler} />
						</Col>
					</Row>
					<Row>
						<Col lg={9}>
							<NameInput value={name} setValue={nameHandler} filteredRecipes={filteredRecipes} filterRecipesHandler={filterRecipesHandler} />
							<DescriptionInput value={description} setValue={descriptionHandler} />
							<Row>
								<Col lg={4}>
									<Category category={category} setCategory={categoryHandler} />
								</Col>
								<Col lg={8}>
									<ProteinDropdown value={protein} setValue={proteinHandler} />
								</Col>
							</Row>
							<Row>
								<Col lg={12}>
									<StepsTextarea value={steps} setValue={stepsHandler} />
								</Col>
							</Row>
						</Col>
						<Col lg={3}>
							<NotesTextarea value={notes} setValue={notesHandler} />
							<DayPrepTextarea value={dayPrep} setValue={dayPrepHandler} />
							<DefrostInput value={defrost} setValue={defrostHandler} />
						</Col>
					</Row>
					<Row>
						<Col lg={9}>
							<BooksSection
								bookID={bookID}
								setBookID={bookIDHandler}
								page={page}
								setPage={pageHandler}
								attachments={attachments}
								fetchRecipe={fetchRecipe}
								recipeID={recipeID}
							/>
						</Col>
						<Col lg={3} className="rating-row">
							<Rating rating={rating} setRating={ratingHandler} size="48" />
						</Col>
					</Row>

					<Row>
						<Col>
							<URLInput value={url} setValue={urlHandler} />
						</Col>
					</Row>
					<Row>
						<Col>
							<ThumbnailSection setValue={thumbnailHandler} />
						</Col>
					</Row>

					<Tag recipeID={recipeID} />

					<Row>
						<Col lg={12}>
							<IngredientsLines ingredients={ingredients} />
						</Col>
					</Row>

					<IngredientsTextarea value={ingredientsBulk} setValue={ingredientsHandler} />

					<div className="bottom-buttons">
						<Button className="site-btn muted" onClick={previewAction}>
							<Eye /> Preview
						</Button>
						<Button className="site-btn muted" onClick={() => setShowImportModal(true)}>
							<ArrowUpCircle /> Import
						</Button>
					</div>
				</div>
			</section>
		</div>
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
				<Label check>Show Recipe in Book</Label>
			</FormGroup>
		</div>
	);
};

const NameInput = ({ value, setValue, filteredRecipes, filterRecipesHandler }) => {
	return (
		<div className="form-floating">
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
					{filteredRecipes.map((recipe, index) => {
						return (
							<div key={index} className="recipe-name-option">
								{recipe}
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
};

const DescriptionInput = ({ value, setValue }) => {
	return (
		<div className="form-floating">
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
		<div className="form-floating">
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

const IngredientsLines = ({ ingredients }) => {
	const authContext = useContext(AuthContext);
	const tokenFromStorage = authContext.token;

	const updateIngredientHandler = async (ingredientID, value) => {
		console.log('Set Tag', value);
		const response = await fetch(`/api/recipes/123/ingredient/${ingredientID}`, {
			method: 'PATCH',
			body: JSON.stringify(value),
			headers: {
				// This is required. NodeJS server won't know how to read it without it.
				'Content-Type': 'application/json',
				Authorization: `Bearer ${tokenFromStorage}`,
			},
		});
		const data = await response.json();

		if (data.success) {
			console.log('Ingredient updated successfully.', data);
		}
	};

	const debounceEditFunction = useCallback(debounce(updateIngredientHandler, 1500), [tokenFromStorage]);

	console.log('INGREDIDENT ON EDIT PAGE', ingredients);
	return (
		<div>
			{ingredients &&
				ingredients.map((singleIngredient, index) => {
					return (
						<IngredientLine
							index={index}
							singleIngredient={singleIngredient}
							debounceEditFunction={debounceEditFunction}
							updateIngredientHandler={updateIngredientHandler}
						/>
					);
				})}
		</div>
	);
};

const IngredientLine = ({ index, singleIngredient, debounceEditFunction, updateIngredientHandler }) => {
	const [value, setValue] = useState(singleIngredient.name);
	const [tagName, setTagName] = useState(singleIngredient?.tagName);

	const updateIngredientByID = (value) => {
		setValue(value);
		debounceEditFunction(singleIngredient.ingredientID, { value });
	};

	const removeTagHandler = () => {
		setTagName(null);
		updateIngredientHandler(singleIngredient.ingredientID, { tagName: null });
	};

	return (
		<Row>
			<Col lg={7}>
				<div className="form-floating ingredients">
					<Input
						className="editInput form-control"
						id="recipe-ingredients"
						type="text"
						placeholder="Ingredients"
						onChange={(e) => {
							updateIngredientByID(e.target.value);
						}}
						value={value}
						tabIndex={-1}
					/>
					<label for="recipe-ingredients">{`Ingredient ${index + 1}`}</label>
				</div>
			</Col>
			<Col lg={3} className="tag-container">
				<TagBox type="ingredient" tag={{ Name: tagName, TagID: singleIngredient?.tagID }} removeTagHandler={removeTagHandler} />
			</Col>
			<Col lg={2}>
				<IngredientTagDropdown ingredientID={singleIngredient.ingredientID} updateIngredientHandler={updateIngredientHandler} setTagName={setTagName} />
			</Col>
		</Row>
	);
};
const IngredientTagDropdown = ({ ingredientID, updateIngredientHandler, setTagName }) => {
	const [selectedValue, setSelectedValue] = useState('');

	const setTagHandler = (value) => {
		setTagName(value);
		updateIngredientHandler(ingredientID, { tagName: value });
		setSelectedValue('');
	};

	const fetchAllTags = async () => {
		const response = await fetch('/api/ingredientTags', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		});
		const data = await response.json();
		return data.map((d) => d.Name);
	};

	return (
		<InputWithAutocomplete
			id="ingredient-tag"
			label="Search Tag"
			fetchAvailableResults={fetchAllTags}
			selectedValue={selectedValue}
			setSelectedValue={setSelectedValue}
			onkeyDownHandler={(value) => setTagHandler(value)}
		/>
	);
};
const IngredientsTextarea = ({ value, setValue }) => {
	return (
		<div className="form-floating ingredients">
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
			<label for="recipe-ingredients">Bulk Ingredients</label>
		</div>
	);
};

const StepsTextarea = ({ value, setValue }) => {
	return (
		<div className="form-floating steps">
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
		<div className="form-floating notes">
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
		<div className="form-floating notes">
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
		<div className="form-floating">
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
		<div className="form-floating">
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

	const { modal, openModal } = useScanModal(fetchRecipe, attachments, recipeID);

	const bookOptions = books.map((book) => {
		return (
			<option key={book.BookID} value={book.BookID}>
				{book.Name}
			</option>
		);
	});

	return (
		<Row>
			{modal}
			<Col lg={4}>
				<div className="form-floating">
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
				<div className="form-floating">
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
			<Col lg={6} className="recipe-edit-btn">
				<Button className="site-btn muted" onClick={openModal}>
					<Printer /> Scan
				</Button>
			</Col>
		</Row>
	);
};
export default RecipeDetailsPage;
