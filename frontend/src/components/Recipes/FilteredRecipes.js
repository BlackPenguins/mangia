import { useCallback, useEffect, useState } from 'react';
import { Input, Row } from 'reactstrap';
import LoadingText from '../Common/LoadingText';

export const HIDDEN_CATEGORY_FILTER = 'Hidden';
export const UNCATEGORIZED_CATEGORY_FILTER = 'Uncategorized';
export const NEW_ARRIVAL_CATEGORY_FILTER = 'NewArrival';

const FilteredRecipes = (({ inputRef, CardType, layoutClass, onClickHandler, categoryFilter }) => {
	const [allRecipes, setAllRecipes] = useState(null);
	const [search, setSearch] = useState('');

	const [filteredRecipes, setFilteredRecipes] = useState(null);

	const fetchRecipes = useCallback(async () => {
		const response = await fetch('/api/recipes');
		const data = await response.json();
		if (response.status === 200) {
			console.log('Retrieved Recipes from Server', data);
			const activeData = data.filter((r) => r.IsActive);

			setAllRecipes(data);
			setFilteredRecipes(activeData);
		} else {
			console.log('Error while fetching the recipes', data);
		}
	},[]);

	useEffect(() => {
		fetchRecipes();
	}, [fetchRecipes]);

	const isFilteredByCategory = useCallback(
		(recipe) => {
			const matchesAll = !categoryFilter && recipe.IsActive;
			const matchesCategory = categoryFilter && recipe.Category === categoryFilter && recipe.IsActive;
			const matchesHidden = categoryFilter === HIDDEN_CATEGORY_FILTER && !recipe?.IsActive;
			const matchesUncategorized = categoryFilter === UNCATEGORIZED_CATEGORY_FILTER && recipe.IsActive && (recipe?.Category === "None" || !recipe?.Category);
			const matchesNewArrival = categoryFilter === NEW_ARRIVAL_CATEGORY_FILTER && recipe?.IsNewArrival;
			return matchesAll || matchesHidden || matchesCategory || matchesNewArrival || matchesUncategorized;
		},
		[categoryFilter]
	);
	const filterRecipesHandler = useCallback(
		(searchString, doSort) => {
			const lowercaseSearchString = searchString.toLowerCase().trim();

			if( allRecipes ) {
				// Sort modifies the original, we want a copy
				let filteredArray = [...allRecipes].filter((recipe) => {
					const matchesName = recipe && recipe.Name.toLowerCase().indexOf(lowercaseSearchString) !== -1;
					return isFilteredByCategory(recipe) && matchesName;
				});
				
				if( doSort ) {
					filteredArray.sort( (a,b) => a.Name.localeCompare(b.Name));
				}
				
				setFilteredRecipes(filteredArray);
			}
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
	}, [categoryFilter, allRecipes, isFilteredByCategory]);

	useEffect( () => {
		filterRecipesHandler(search, false);
	}, [categoryFilter, filterRecipesHandler, search])

	return (
		<section className="hero">
			<div className="container">
				<SearchBox inputRef={inputRef} search={search} setSearch={setSearch} filteredRecipes={filteredRecipes} filterRecipesHandler={(search) => filterRecipesHandler(search, true)} />

				{filteredRecipes === null && <LoadingText text="Loading recipes" />}
				{filteredRecipes?.length === 0 && <span>No recipes found</span>}
				{filteredRecipes?.length > 0 && (
					<Row className="recipes">
						{filteredRecipes?.map((recipe) => (
							<div key={recipe.RecipeID} className={`col-md-6 col-${layoutClass} ftco-animate fadeInUp ftco-animated`}>
								<CardType recipe={recipe} onClickHandler={onClickHandler} />
							</div>
						))}
					</Row>
				)}
			</div>
		</section>
	);
});

const SearchBox = (({ inputRef, search, setSearch, filteredRecipes, filterRecipesHandler }) => {
	return (
		<div className="hero__search">
			<div className="search-container">
				<form action="#">
					<Input
						innerRef={inputRef}
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
});

export default FilteredRecipes;
