import RecipeCard from './RecipeCard';

const RecipeContainer = (props) => {
	return (
		<div className="recipe-container">
			<RecipeCard {...props} />
		</div>
	);
};

export default RecipeContainer;
