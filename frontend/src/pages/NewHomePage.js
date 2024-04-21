import FilteredRecipesControl from '../components/Recipes/FilteredRecipesControl';
import RecipeCard from '../components/Recipes/RecipeCard';

const NewHomePage = () => {
	return <FilteredRecipesControl CardType={RecipeCard} layoutClass="lg-6" />;
	// return <FilteredRecipesControl CardType={RecipeRow} layoutClass={''} />;
};

export default NewHomePage;
