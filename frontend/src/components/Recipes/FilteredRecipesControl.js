import { useEffect, useState } from 'react';
import { Input, Row, Spinner } from 'reactstrap';
import './FilteredRecipesControl.css';

const FilteredRecipesControl = ({ CardType, layoutClass, onClickHandler, categoryFilter }) => {
	const fetchRecipes = async () => {
		const response = await fetch('/api/recipes');
		const data = await response.json();
		if (response.status === 200) {
			console.log('Retrieved Recipes from Server', data);
			const activeData = data.filter((r) => r.IsActive);

			setAllRecipes(data);
			setFilteredRecipes(activeData);
		} else {
			console.log('ERR', data);
		}
	};

	useEffect(() => {
		fetchRecipes();
	}, []);

	const [allRecipes, setAllRecipes] = useState(null);
	const [search, setSearch] = useState('');

	const [filteredRecipes, setFilteredRecipes] = useState(null);

	const filterRecipesHandler = (searchString) => {
		const lowercaseSearchString = searchString.toLowerCase();
		setFilteredRecipes(
			allRecipes.filter((recipe) => {
				if (lowercaseSearchString === 'hidden') {
					return !recipe.IsActive;
				} else {
					const matchesCategory = !categoryFilter || (categoryFilter && recipe.Category === categoryFilter);
					const matchesName = recipe && recipe.Name.toLowerCase().indexOf(lowercaseSearchString) !== -1;
					return matchesCategory && matchesName && recipe.IsActive;
				}
			})
		);
	};

	useEffect(() => {
		if (categoryFilter) {
			setFilteredRecipes(allRecipes.filter((recipe) => recipe && recipe.Category === categoryFilter));
		} else {
			setFilteredRecipes(allRecipes);
		}
		setSearch('');
	}, [categoryFilter, allRecipes]);

	return (
		<section class="hero">
			<div class="container">
				<SearchBox search={search} setSearch={setSearch} filteredRecipes={filteredRecipes} filterRecipesHandler={filterRecipesHandler} />

				{filteredRecipes === null && <LoadingText />}
				{filteredRecipes?.length === 0 && <span>No recipes found</span>}
				{filteredRecipes?.length > 0 && (
					<Row className="recipes">
						{filteredRecipes?.map((recipe) => (
							<div className={`col-md-6 col-${layoutClass} ftco-animate fadeInUp ftco-animated`}>
								<CardType key={recipe.RecipeID} recipe={recipe} onClickHandler={onClickHandler} />
							</div>
						))}
					</Row>
				)}
			</div>
		</section>
	);
};

const LoadingText = () => {
	return (
		<>
			<Spinner
				color="success"
				style={{
					height: '2em',
					width: '2em',
				}}
			></Spinner>
			<span className="loading-text">Loading recipes</span>
		</>
	);
};

const SearchBox = ({ search, setSearch, filteredRecipes, filterRecipesHandler }) => {
	return (
		<div class="row">
			<div class="col-lg-9">
				<div class="hero__search">
					<div class="hero__search__form">
						<form action="#">
							<Input
								id="recipe-category"
								type="text"
								placeholder={!search && `Search all ${filteredRecipes?.length || ''} recipes...`}
								onChange={(e) => {
									setSearch(e.target.value);
									filterRecipesHandler(e.target.value);
								}}
								value={search}
							/>
							<button type="submit" class="site-btn">
								SEARCH
							</button>
						</form>
					</div>
				</div>
			</div>
		</div>
	);
};

export default FilteredRecipesControl;
