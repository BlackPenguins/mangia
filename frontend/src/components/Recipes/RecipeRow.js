import { useState, useEffect } from 'react';
import { getThumbnailImage } from './RecipeCard';
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
	const thumbnailImageURL = getThumbnailImage(recipe, false);
	const [imgSrc, setImgSrc] = useState(thumbnailImageURL);

	useEffect( () => {
		setImgSrc(thumbnailImageURL);
	}, [recipe]);

	return <img
		alt="thumbnail"
		className="thumbnail"
		src={imgSrc}
		onError={() => setImgSrc('/images/no-thumb.png')}
	/>
}

export const useThumbnailBackgroundStyle = (recipe, hideInformation, height) => {
	const thumbnailImageURL = getThumbnailImage(recipe, hideInformation);
	const [imgSrc, setImgSrc] = useState(thumbnailImageURL);

	let img = new Image();
    img.src = thumbnailImageURL;
    
    img.onerror = () => {
		setImgSrc('/images/no-thumb.png');
    };

	return {
		backgroundImage: `url(${imgSrc})`,
		backgroundSize: 'cover',
		height: '200px',
	};
}

export default RecipeRow;
