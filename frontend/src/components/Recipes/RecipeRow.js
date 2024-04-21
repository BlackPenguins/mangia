import Category from './Category';
import './RecipeRow.css';

const RecipeRow = ({ recipe, onClickHandler }) => {
	let recipeName = recipe?.Name;
	const thumbnailImage = (recipe?.Image && `http://localhost:6200/thumbs/${recipe?.Image}`) || 'images/no-thumb.png';

	return (
		<div className="recipe-row" onClick={() => onClickHandler(recipe)}>
			<img alt="thumbnail" className="thumbnail" src={thumbnailImage} />
			<div className="recipe-title">{recipeName}</div>
		</div>
	);
};

export default RecipeRow;
