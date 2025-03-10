import { useCallback, useEffect, useState } from 'react';

import { useNavigate, useParams } from 'react-router-dom';
import { Button, Col, FormGroup, FormText, Input, Label, Row } from 'reactstrap';
import { Bookmark, Save } from '@mui/icons-material';
import { useToast } from '@blackpenguins/penguinore-common-ext';

import './RecipeEditPage.scss';
import Rating from '../../components/Settings/Rating';
import Tag, { TagBox } from '../../components/EditRecipes/Tag';
import { ArrowUpCircle, Eye, Printer, Trash2 } from 'react-feather';
import useScanModal from '../../components/Settings/useScanModal';
import InputWithAutocomplete from '../../components/EditRecipes/InputWithAutocomplete';
import NewIngredientInput from './NewIngredientInput';
import { useAuth } from '@blackpenguins/penguinore-common-ext';
import useImportRecipeModal from '../../components/Settings/ImportRecipeModal';

const RecipeEditPage = () => {
	const [dirty, setDirty] = useState(false);
	const [dirtyData, setDirtyData] = useState({});
	const [dirtyIngredients, setDirtyIngredients] = useState({});

	const navigate = useNavigate();
	const authContext = useAuth();
	const tokenFromStorage = authContext.tokenFromStorage;

	if (!authContext.isAdmin) {
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

	const showToast = useToast();

	const saveHandler = async () => {
		await updateIngredients();
		await updateRecipe();
		setDirty(false);
		setDirtyData({});
		setDirtyIngredients({});
	}

	const updateIngredients = async () => {
		for( const [ingredientID, value] of Object.entries(dirtyIngredients)) {
			await updateIngredientHandler(ingredientID, { value });
		}
	}

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

	const updateRecipe = async () => {
		const cleanedData = dirtyData;

		const preheat = cleanedData['preheat'];
		if(preheat) {
			if(isNaN(preheat)) {
				showToast('Bad Data', "The preheat must be a number.", false);
				delete cleanedData.preheat;
			}
		}

		console.log('Updating recipe', cleanedData);

		const response = await fetch(`/api/recipes/${recipeID}`, {
			method: 'PATCH',
			body: JSON.stringify(cleanedData),
			headers: {
				// This is required. NodeJS server won't know how to read it without it.
				'Content-Type': 'application/json',
				Authorization: `Bearer ${tokenFromStorage}`,
			},
		});

		await response.json();

		showToast('Saved', `Recipe has been saved`);
		fetchRecipe();
	};

	const updateImage = async (imageFile) => {
		if (imageFile) {
			const imageData = new FormData();
			imageData.append('imageFile', imageFile);

			fetch(`/api/recipes/image/${recipeID}`, {
				method: 'POST',
				body: imageData,
				headers: {
					Authorization: `Bearer ${tokenFromStorage}`,
				},
			})
				.then((data) => {
					console.log('DATA', data);
					if( data.status === 200) {
						showToast('Recipe Edited', `Thumbnail has been uploaded.`);
					} else {
						showToast('Upload Failed', `Thumbnail could not be uploaded`, false);
					}
					fetchRecipe();
				})
				.catch((error) => {
					showToast('Thumbnail Failure', error, false);
				});
		}
	};

	const stageChange = ( name, value ) => {
		setDirtyData( (prevState) => ({
			...prevState,
			[name]: value,
		}));
		setDirty(true);
	};

	const stageIngredientChange = ( name, value ) => {
		setDirtyIngredients( (prevState) => ({
			...prevState,
			[name]: value,
		}));
		setDirty(true);
	};

	const isActiveHandler = (value) => {
		setIsActive(value);
		stageChange('isActive', value);
		setDirty(true);
	};

	const thumbnailHandler = (value) => {
		updateImage(value);
	};

	const ratingHandler = (value) => {
		setRating(value);
		stageChange( 'rating', value );
		setDirty(true);
	};

	const nameClasses = ['section-title'];

	if (!isActive) {
		nameClasses.push('hidden');
	}

	const {modal, openModal} = useImportRecipeModal();


	return (
		<div className="container recipe-edit-container">

			{dirty && (
				<div className='unsaved-changes'>
					<a href='#saveButton'>
					<Bookmark/> You have unsaved changes!
					</a>
				</div>
			)}

			{modal}

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
							<NameInput value={name} setValue={setName} filteredRecipes={filteredRecipes} filterRecipesHandler={filterRecipesHandler} stageChange={stageChange} dirty={dirty} />
							<EditTextarea label='Description' name='description' value={description} setValue={setDescription} stageChange={stageChange} rows={2} dirty={dirty}/>
							<Row>
								<Col lg={4}>
									<EditDropdown label='Category' name='category' value={category} setValue={setCategory} stageChange={stageChange} dirty={dirty}>
										<option className="none" value="None">None</option>
										<option className="dinner" value="Dinner">Dinner</option>
										<option className="sidedish" value="Sidedish">Sidedish</option>
										<option className="appetizer" value="Appetizer">Appetizer</option>
										<option className="dessert" value="Dessert">Dessert</option>
									</EditDropdown>
								</Col>
								<Col lg={8}>
									<EditDropdown label='Protein' name='protein' value={protein} setValue={setProtein} stageChange={stageChange} dirty={dirty}>
										<option value="None">None</option>
										<option value="Fish">Fish</option>
										<option value="Steak">Steak</option>
									</EditDropdown>
								</Col>
							</Row>
							<Row>
								<Col lg={12}>
									<EditTextarea label='Steps' name='steps' value={steps} setValue={setSteps} stageChange={stageChange} dirty={dirty} rows={15} valueModifier={(value) => value.split("\n")}/>
								</Col>
							</Row>
						</Col>
						<Col lg={3}>
							<EditTextarea label='Notes' name='notes' value={notes} setValue={setNotes} stageChange={stageChange} dirty={dirty} rows={16}/>
							<EditDropdown label='Prep Time' name='prepTime' value={prepTime} setValue={setPrepTime} stageChange={stageChange} dirty={dirty}>
								<option value="OneHour">One Hour</option>
								<option value="FewHours">Few Hours</option>
								<option value="AllDay">All Day</option>
							</EditDropdown>
							<EditTextInput label='Preheat Temp.' name='preheat' value={preheat} setValue={setPreheat} stageChange={stageChange} dirty={dirty} />
							<EditTextarea label='Day Earlier Preparation' name='dayPrep' value={dayPrep} setValue={setDayPrep} stageChange={stageChange} dirty={dirty} rows={5}/>
							<EditTextInput label='Defrost' name='defrost' value={defrost} setValue={setDefrost} stageChange={stageChange} dirty={dirty}/>
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
								stageChange={stageChange}
								dirty={dirty}
							/>
						</Col>
						<Col lg={3} className="rating-row">
							<Rating rating={rating} setRating={ratingHandler} size="48" />
						</Col>
					</Row>

					<Row>
						<Col>
							<EditTextInput label='URL' name='url' value={url} setValue={setURL} stageChange={stageChange} dirty={dirty}/>
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
							<IngredientsLines updateIngredientHandler={updateIngredientHandler} stageIngredientChange={stageIngredientChange} ingredients={ingredients} recipeID={recipeID} fetchRecipe={fetchRecipe} dirty={dirty} />
						</Col>
					</Row>

					<EditTextarea label='Bulk Ingredients' name='ingredients' value={ingredientsBulk} setValue={setIngredientsBulk} stageChange={stageChange} dirty={dirty} rows={15} valueModifier={(value) => value.split("\n")} />

					<div className="bottom-buttons">
						<Button className="mangia-btn muted" onClick={previewAction}>
							<Eye /> Preview
						</Button>
						<Button className="mangia-btn muted" onClick={() => openModal()}>
							<ArrowUpCircle /> Import
						</Button>
						<Button id='saveButton' className="mangia-btn success" onClick={() => saveHandler()}>
							<Save /> Save
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

			<img alt='thumbnail' src={imageSource} />
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

const NameInput = ({ value, setValue, filteredRecipes, filterRecipesHandler, stageChange }) => {
	const nameHandler = ( newValue ) => {
		setValue(newValue);
		filterRecipesHandler(newValue);
	};

	return (
		<>
			<EditTextInput label='Name' name='name' value={value} setValue={nameHandler} stageChange={stageChange} />
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
		</>
	);
};

const EditTextInput = ({ label, name, value, setValue, stageChange, dirty, children }) => {
	return <EditInput label={label} name={name} value={value} setValue={setValue} stageChange={stageChange} dirty={dirty} type='text' children={children} />
}

const EditTextarea = ({ label, name, value, setValue, stageChange, dirty, rows, valueModifier, children }) => {
	return <EditInput label={label} name={name} value={value} setValue={setValue} stageChange={stageChange} dirty={dirty} type='textarea' rows={rows} valueModifier={valueModifier} children={children}/>
}

const EditDropdown = ({ label, name, value, setValue, stageChange, dirty, rows, valueModifier, children }) => {
	return <EditInput label={label} name={name} value={value} setValue={setValue} stageChange={stageChange} dirty={dirty} type='select' rows={rows} valueModifier={valueModifier} children={children}/>
}

const EditInput = ({ label, name, value, setValue, stageChange, dirty, type, rows, valueModifier, children }) => {
	const containerID = `recipe-${name}`;
	const inputID = `${containerID}-input`;

	const [dirtyInput, setDirtyInput] = useState(false);

	const classes = ["editInput"];

	if( dirtyInput && dirty ) {
		classes.push("dirty-input");
	}

	const handleInput = (value) => {
		setValue(value);

		let newValue = value;
		if( valueModifier ) {
			newValue = valueModifier(value);
		}

		stageChange(name, newValue);
		setDirtyInput(true);
	}

	return (
		<div className={`form-floating ${containerID}`}>
			<Input
				id={inputID}
				className={classes.join(' ')}
				type={type}
				rows={rows}
				onChange={(e) => {
					handleInput(e.target.value);
				}}
				value={value}
			>
				{children}
			</Input>
			<label htmlFor={inputID}>{label}</label>
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
		default:
			display = "Unknown";
	}

	return <span className="prep-time-label">{display}</span>;
};



const IngredientsLines = ({ updateIngredientHandler, stageIngredientChange, dirty, ingredients, recipeID, fetchRecipe }) => {
	return (
		<div className="ingredient-section">
			{ingredients &&
				ingredients.map((singleIngredient, index) => {
					return (
						<IngredientLine
							key={singleIngredient.ingredientID}
							index={index}
							singleIngredient={singleIngredient}
							dirty={dirty}
							stageIngredientChange={stageIngredientChange}
							recipeID={recipeID}
							fetchRecipe={fetchRecipe}
							updateIngredientHandler={updateIngredientHandler}
						/>
					);
				})}

			<NewIngredientInput recipeID={recipeID} fetchRecipe={fetchRecipe} />
		</div>
	);
};

const IngredientLine = ({ index, singleIngredient, dirty, updateIngredientHandler, recipeID, fetchRecipe, stageIngredientChange }) => {
	const authContext = useAuth();
	const tokenFromStorage = authContext.tokenFromStorage;

	const [value, setValue] = useState(singleIngredient.name);
	const [tagName, setTagName] = useState(singleIngredient?.tagName);

	const removeTagHandler = async () => {
		setTagName(null);
		await updateIngredientHandler(singleIngredient.ingredientID, { tagName: null });
		fetchRecipe();
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

	const ingredientInputClasses = ['ingredient-input', 'form-floating'];

	if( singleIngredient.isMissingUnits === 1) {
		ingredientInputClasses.push("missing-units");
	}

	return (
		<Row className="ingredient-row">
			<Col lg={9}>
				<Button tabIndex={-1} className="mangia-btn danger delete-ingredient-btn" size="small" onClick={removeHandler}>
					<Trash2 />
				</Button>
				<div className={ingredientInputClasses.join(' ')}>
					<EditTextInput label={`Ingredient ${index + 1}`} name={singleIngredient.ingredientID} value={value} setValue={setValue} stageChange={stageIngredientChange} dirty={dirty} />
				</div>
			</Col>
			<Col lg={3}>
				<IngredientTagDropdown
					singleIngredient={singleIngredient}
					tagName={tagName}
					removeTagHandler={removeTagHandler}
					updateIngredientHandler={updateIngredientHandler}
					setTagName={setTagName}
					fetchRecipe={fetchRecipe}
				/>
			</Col>
		</Row>
	);
};
const IngredientTagDropdown = ({ singleIngredient, tagName, updateIngredientHandler, removeTagHandler, setTagName, fetchRecipe }) => {
	const [selectedValue, setSelectedValue] = useState('');

	const setTagHandler = async (value) => {
		setTagName(value);
		await updateIngredientHandler(singleIngredient.ingredientID, { tagName: value });
		setSelectedValue('');
		fetchRecipe();
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

const BooksSection = ({ bookID, setBookID, page, setPage, fetchRecipe, attachments, recipeID, stageChange, dirty }) => {
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
				<EditDropdown label='Book' name='bookID' value={bookID} setValue={setBookID} stageChange={stageChange} dirty={dirty}>
					<option value={0}>None</option>
					{bookOptions}
				</EditDropdown>
			</Col>
			<Col lg={2}>
				<EditTextInput label='Page' name='page' value={page} setValue={setPage} stageChange={stageChange} dirty={dirty}/>
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
