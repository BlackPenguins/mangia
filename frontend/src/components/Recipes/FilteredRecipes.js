import { useCallback, useEffect, useState } from 'react';
import { Input, Row } from 'reactstrap';
import LoadingText from '../Common/LoadingText';

export const HIDDEN_CATEGORY_FILTER = 'Hidden';
const FilteredRecipes = ({ CardType, layoutClass, onClickHandler, categoryFilter }) => {
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

	const isFilteredByCategory = useCallback(
		(recipe) => {
			const matchesAll = !categoryFilter && recipe.IsActive;
			const matchesCategory = categoryFilter && recipe.Category === categoryFilter && recipe.IsActive;
			const matchesHidden = categoryFilter === HIDDEN_CATEGORY_FILTER && !recipe?.IsActive;
			return matchesAll || matchesHidden || matchesCategory;
		},
		[categoryFilter]
	);
	const filterRecipesHandler = useCallback(
		(searchString) => {
			const lowercaseSearchString = searchString.toLowerCase();
			setFilteredRecipes(
				allRecipes &&
					allRecipes.filter((recipe) => {
						const matchesName = recipe && recipe.Name.toLowerCase().indexOf(lowercaseSearchString) !== -1;
						return isFilteredByCategory(recipe) && matchesName;
					})
			);
		},
		[allRecipes, isFilteredByCategory]
	);

	useEffect(() => {
		setFilteredRecipes(
			allRecipes &&
				allRecipes.filter((recipe) => {
					return isFilteredByCategory(recipe);
				})
		);
		setSearch('');
	}, [categoryFilter, allRecipes, isFilteredByCategory]);

	return (
		<section className="hero">
			<div className="container">
				<SearchBox search={search} setSearch={setSearch} filteredRecipes={filteredRecipes} filterRecipesHandler={filterRecipesHandler} />

				{filteredRecipes === null && <LoadingText text="Loading recipes" />}
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

const SearchBox = ({ search, setSearch, filteredRecipes, filterRecipesHandler }) => {
	return (
		<div className="hero__search">
			<div className="search-container">
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
				</form>
			</div>
		</div>
	);
};

export default FilteredRecipes;
