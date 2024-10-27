import { getThumbnailImage } from './RecipeCard';
import './RecipeRow.scss';

const RecipeRow = ({ recipe, onClickHandler }) => {
	let recipeName = recipe?.Name;

	const thumbnailImage = getThumbnailImage(recipe, false);

	return (
		<div className="recipe-row" onClick={() => onClickHandler(recipe)}>
			<img alt="thumbnail" className="thumbnail" src={thumbnailImage} />
			<div className="recipe-title">{recipeName}</div>
		</div>
	);
};

export default RecipeRow;
