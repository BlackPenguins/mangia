import { useState, useEffect } from 'react';
import { useThumbnailImage } from './RecipeCard';
import './RecipeRow.scss';

const RecipeRow = ({ recipe, onClickHandler }) => {
	let recipeName = recipe?.Name;

	return (
		<div className="recipe-row" onClick={() => onClickHandler(recipe)}>
			<Thumbnail recipe={recipe}/>
			<div className="recipe-title">{recipeName}</div>
		</div>
	);
};

const Thumbnail = ( {recipe} ) => {
	const [thumbnail, setThumbnail] = useThumbnailImage(recipe, false);

	return <img
		alt="thumbnail"
		className="thumbnail"
		src={thumbnail}
		onError={() => setThumbnail('/images/no-thumb.png')}
	/>
}

export const useThumbnailBackgroundStyle = (recipe, hideInformation) => {
	const [thumbnail, setThumbnail] = useThumbnailImage(recipe, hideInformation);

	let img = new Image();
    img.src = thumbnail;
    
    img.onerror = () => {
		setThumbnail('/images/no-thumb.png');
    };

	return {
		backgroundImage: `url(${thumbnail})`,
		backgroundSize: 'cover',
		height: '200px',
		thumbnail
	};
}

export default RecipeRow;
