import { useCallback, useContext, useEffect, useState } from 'react';
import { debounce } from 'lodash';

import { useNavigate, useParams } from 'react-router-dom';
import { Button, Col, FormGroup, FormText, Input, Label, Row } from 'reactstrap';

import './RecipeEditPage.scss';
import Rating from '../../components/Settings/Rating';
import Category from '../../components/Recipes/Category';
import Tag, { TagBox } from '../../components/EditRecipes/Tag';
import { ArrowUpCircle, Eye, Printer, Trash2 } from 'react-feather';
import useScanModal from '../../components/Settings/useScanModal';
import AuthContext from '../../authentication/auth-context';
import InputWithAutocomplete from '../../components/EditRecipes/InputWithAutocomplete';
import ImportRecipeModal from '../../components/Settings/ImportRecipeModal';
import { useToast } from 'context/toast-context';
import NewIngredientInput from './NewIngredientInput';

const RecipeEditPage = () => {
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
	const [preheat, setPreheat] = useState('');
	const [prepTime, setPrepTime] = useState('');
	const [defrost, setDefrost] = useState('');
	const [description, setDescription] = useState('');
	const [steps, setSteps] = useState('');
	const [ingredients, setIngredients] = useState([]);
	const [ingredientsBulk, setIngredientsBulk] = useState('');
	const [bookID, setBookID] = useState(0);
	const [isActive, setIsActive] = useState(true);
	const [page, setPage] = useState('');
	const [notes, setNotes] = useState('');
	const [dayPrep, setDayPrep] = useState('');
	const [rating, setRating] = useState(1);
	const [url, setURL] = useState('');
	const [attachments, setAttachments] = useState([]);
	const [thumbnails, setThumbnails] = useState([]);

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
			setCategory(recipe.Category || '');
			setProtein(recipe.Protein || '');
			setPreheat(recipe.Preheat || '');
			setPrepTime(recipe.PrepTime || '');
			setDefrost(recipe.Defrost || '');
			setNotes(recipe.Notes || '');
			setDayPrep(recipe.DayPrep || '');
			setRating(recipe.Rating || 0);
			setURL(recipe.URL || '');
			setIsActive(recipe.IsActive === 1);
			setAttachments(recipe.attachments);
			setThumbnails(recipe.thumbnails);

			const finalSteps = recipe.steps.map((step) => step.instruction).join('\n\n');
			setSteps(finalSteps);

			const ingredientsBulk = recipe.ingredients.map((ingredient) => ingredient.name).join('\n');
			setIngredients(recipe.ingredients);
			setIngredientsBulk(ingredientsBulk);
		}
	}, [recipeID]);

	useEffect(() => {
		fetchRecipe();
	}, [fetchRecipe]);

	const previewAction = () => navigate(`/recipe/${recipeID}`);

	const [showImportModal, setShowImportModal] = useState(false);

	const showToast = useToast();

	const updateRecipe = async (recipe, label) => {
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

		showToast('Recipe Edited', `${label} has been saved`);
		fetchRecipe();
	};

	const updateImage = async (imageFile) => {
		if (imageFile) {
			const imageData = new FormData();
			imageData.append('imageFile', imageFile);

			await fetch(`/api/recipes/image/${recipeID}`, {
				method: 'POST',
				body: imageData,
				headers: {
					Authorization: `Bearer ${tokenFromStorage}`,
				},
			});

			showToast('Recipe Edited', 'Thumbnail has been uploaded');
			fetchRecipe();
		}
	};

	const debounceEditFunction = useCallback(debounce(updateRecipe, 1500), [tokenFromStorage]);

	const isActiveHandler = (value) => {
		setIsActive(value);
		debounceEditFunction({ isActive: value }, 'Show Recipe in Book');
	};

	const nameHandler = (value) => {
		setName(value);
		debounceEditFunction({ name: value }, 'Name');
	};

	const descriptionHandler = (value) => {
		setDescription(value);
		debounceEditFunction({ description: value }, 'Description');
	};

	const categoryHandler = (value) => {
		setCategory(value);
		debounceEditFunction({ category: value }, 'Category');
	};

	const proteinHandler = (value) => {
		setProtein(value);
		debounceEditFunction({ protein: value }, 'Protein');
	};

	const preheatHandler = (value) => {
		setPreheat(value);
		debounceEditFunction({ preheat: value }, 'Preheat');
	};

	const prepTimeHandler = (value) => {
		setPrepTime(value);
		debounceEditFunction({ prepTime: value }, 'Prep Time');
	};

	const stepsHandler = (value) => {
		setSteps(value);
		debounceEditFunction({ steps: value.split('\n') }, 'Steps');
	};

	const ingredientsHandler = (value) => {
		setIngredientsBulk(value);
		debounceEditFunction({ ingredients: value.split('\n') }, 'Ingredients');
	};

	const notesHandler = (value) => {
		setNotes(value);
		debounceEditFunction({ notes: value }, 'Notes');
	};

	const dayPrepHandler = (value) => {
		setDayPrep(value);
		debounceEditFunction({ dayPrep: value }, 'Day Prep');
	};

	const urlHandler = (value) => {
		setURL(value);
		debounceEditFunction({ url: value }, 'URL');
	};

	const thumbnailHandler = (value) => {
		updateImage(value);
	};

	const ratingHandler = (value) => {
		setRating(value);
		debounceEditFunction({ rating: value }, 'Rating');
	};

	const defrostHandler = (value) => {
		setDefrost(value);
		debounceEditFunction({ defrost: value }, 'Defrost');
	};

	const pageHandler = (value) => {
		setPage(value);
		debounceEditFunction({ page: value }, 'Book Page');
	};

	const bookIDHandler = (value) => {
		setBookID(value);
		debounceEditFunction({ bookID: value }, 'Book');
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
							<PrepTimeDropdown value={prepTime} setValue={prepTimeHandler} />
							<PreheatInput value={preheat} setValue={preheatHandler} />
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
							<ThumbnailSection tokenFromStorage={tokenFromStorage} fetchRecipe={fetchRecipe} thumbnails={thumbnails} setValue={thumbnailHandler} />
						</Col>
					</Row>

					<Tag recipeID={recipeID} />

					<Row>
						<Col lg={12}>
							<IngredientsLines ingredients={ingredients} recipeID={recipeID} fetchRecipe={fetchRecipe} />
						</Col>
					</Row>

					<IngredientsTextarea value={ingredientsBulk} setValue={ingredientsHandler} />

					<div className="bottom-buttons">
						<Button className="mangia-btn muted" onClick={previewAction}>
							<Eye /> Preview
						</Button>
						<Button className="mangia-btn muted" onClick={() => setShowImportModal(true)}>
							<ArrowUpCircle /> Import
						</Button>
					</div>
				</div>
			</section>
		</div>
	);
};

const ThumbnailSection = ({ tokenFromStorage, fetchRecipe, thumbnails, setValue }) => {
	const fileChangeHandler = (event) => {
		setValue(event.target.files[0]);
	};

	return (
		<FormGroup row>
			<Col sm={12}>
				<Input id="recipe-image" name="file" type="file" onChange={fileChangeHandler} />
				<FormText>The preview image for the recipe.</FormText>
				{thumbnails &&
					thumbnails.map((thumbnail) => {
						return (
							<ThumbnailPreview key={thumbnail.ThumbnailID} thumbnail={thumbnail} tokenFromStorage={tokenFromStorage} fetchRecipe={fetchRecipe} canEdit={true} />
						);
					})}
			</Col>
		</FormGroup>
	);
};

export const ThumbnailPreview = ({ tokenFromStorage, fetchRecipe, thumbnail, canEdit }) => {
	const imageSource = `http://${process.env.REACT_APP_HOST_NAME}:6200/thumbs/${thumbnail.FileName}`;

	const removeHandler = async () => {
		await fetch(`/api/recipes/image/${thumbnail.ThumbnailID}`, {
			method: 'DELETE',
			headers: {
				// This is required. NodeJS server won't know how to read it without it.
				'Content-Type': 'application/json',
				Authorization: `Bearer ${tokenFromStorage}`,
			},
		});

		fetchRecipe();
	};

	const openImage = () => {
		window.open(imageSource, '_blank');
	};

	return (
		<span className="thumbnail-preview" onClick={canEdit ? removeHandler : openImage}>
			{canEdit && (
				<span className="over">
					<span className="black-cover" />
					<span className="trash-icon">
						<Trash2 />
					</span>
				</span>
			)}

			<img src={imageSource} />
		</span>
	);
};

const ActiveCheckbox = ({ value, setValue }) => {
	return (
		<div>
			<FormGroup check inline>
				<Input
					checked={value}
					onChange={() => {
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
			<label htmlFor="recipe-name">Name</label>
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
			<label htmlFor="recipe-description">Description</label>
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
			<label htmlFor="protein-dropdown">Protein</label>
		</div>
	);
};

export const PrepTimeLabel = ({ value }) => {
	let display = '';

	switch (value) {
		case 'OneHour':
			display = 'One Hour';
			break;
		case 'FewHours':
			display = 'Few Hours';
			break;
		case 'AllDay':
			display = 'All Day';
			break;
	}

	return <span className="prep-time-label">{display}</span>;
};

const PrepTimeDropdown = ({ value, setValue }) => {
	return (
		<div className="form-floating">
			<Input
				id="prep-time-dropdown"
				className="edit-prep-time-dropdown"
				type="select"
				onChange={(e) => {
					setValue(e.target.value);
				}}
				value={value}
			>
				<option value="OneHour">One Hour</option>
				<option value="FewHours">Few Hours</option>
				<option value="AllDay">All Day</option>
			</Input>
			<label htmlFor="prep-time-dropdown">Prep Time</label>
		</div>
	);
};

const IngredientsLines = ({ ingredients, recipeID, fetchRecipe }) => {
	const authContext = useContext(AuthContext);
	const tokenFromStorage = authContext.token;

	const updateIngredientHandler = async (ingredientID, value) => {
		const response = await fetch(`/api/recipes/${recipeID}/ingredient/${ingredientID}`, {
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

	return (
		<div className="ingredient-section">
			{ingredients &&
				ingredients.map((singleIngredient, index) => {
					return (
						<IngredientLine
							key={singleIngredient.ingredientID}
							index={index}
							singleIngredient={singleIngredient}
							debounceEditFunction={debounceEditFunction}
							updateIngredientHandler={updateIngredientHandler}
							recipeID={recipeID}
							fetchRecipe={fetchRecipe}
							tokenFromStorage={tokenFromStorage}
						/>
					);
				})}

			<NewIngredientInput tokenFromStorage={tokenFromStorage} recipeID={recipeID} fetchRecipe={fetchRecipe} />
		</div>
	);
};

const IngredientLine = ({ index, singleIngredient, debounceEditFunction, updateIngredientHandler, recipeID, fetchRecipe, tokenFromStorage }) => {
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

	const removeHandler = async () => {
		await fetch(`/api/recipes/${recipeID}/ingredient/${singleIngredient.ingredientID}`, {
			method: 'DELETE',
			headers: {
				// This is required. NodeJS server won't know how to read it without it.
				'Content-Type': 'application/json',
				Authorization: `Bearer ${tokenFromStorage}`,
			},
		});

		fetchRecipe();
	};

	return (
		<Row className="ingredient-row">
			<Col lg={9}>
				<Button tabIndex={-1} className="mangia-btn danger delete-ingredient-btn" size="small" onClick={removeHandler}>
					<Trash2 />
				</Button>
				<div className="ingredient-input form-floating">
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
					<label htmlFor="recipe-ingredients">{`Ingredient ${index + 1}`}</label>
				</div>
			</Col>
			<Col lg={3}>
				<IngredientTagDropdown
					singleIngredient={singleIngredient}
					tagName={tagName}
					removeTagHandler={removeTagHandler}
					updateIngredientHandler={updateIngredientHandler}
					setTagName={setTagName}
				/>
			</Col>
		</Row>
	);
};
const IngredientTagDropdown = ({ singleIngredient, tagName, updateIngredientHandler, removeTagHandler, setTagName }) => {
	const [selectedValue, setSelectedValue] = useState('');

	const setTagHandler = (value) => {
		setTagName(value);
		updateIngredientHandler(singleIngredient.ingredientID, { tagName: value });
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
		const ingredients = data.ingredientsWithPrices;

		return ingredients.map((d) => d.Name);
	};

	if (tagName) {
		return (
			<span className="tag-container ingredient-tag">
				<TagBox type="ingredient" tag={{ Name: tagName, TagID: singleIngredient?.tagID }} removeTagHandler={removeTagHandler} />
			</span>
		);
	} else {
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
	}
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
			<label htmlFor="recipe-ingredients">Bulk Ingredients</label>
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
			<label htmlFor="recipe-steps">Steps</label>
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
			<label htmlFor="recipe-notes">Notes</label>
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
			<label htmlFor="recipe-day-prep">Day Earlier Preparation</label>
		</div>
	);
};

const PreheatInput = ({ value, setValue }) => {
	return (
		<div className="form-floating">
			<Input
				id="preheat"
				className="mb-3"
				style={{ width: '100%' }}
				type="text"
				placeholder="Preheat"
				onChange={(e) => {
					setValue(e.target.value);
				}}
				value={value}
			/>
			<label htmlFor="preheat">Preheat Temp.</label>
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
			<label htmlFor="defrost">Defrost</label>
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
			<label htmlFor="recipe-url">URL</label>
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
					<label htmlFor="edit-book-dropdown">Book</label>
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
					<label htmlFor="page">Page</label>
				</div>
			</Col>
			<Col lg={6} className="recipe-edit-btn">
				<Button className="mangia-btn muted" onClick={openModal}>
					<Printer /> Scan
				</Button>
			</Col>
		</Row>
	);
};
export default RecipeEditPage;
