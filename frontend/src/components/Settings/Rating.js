import { ThumbsUp, ThumbsDown, Heart } from 'react-feather';
import './Rating.scss';

const Rating = ({ rating, setRating, size }) => {
	if (!rating && !setRating) {
		// No rating yet, hide the stars
		// But don't hide if it's the edit rating control or there would be no way to edit it
		return null;
	}

	const ratingClasses = ['rating-container'];

	if (setRating) {
		ratingClasses.push('editable');
	}

	return (
		<span className={ratingClasses.join(' ')}>
			<RatingButton Icon={ThumbsDown} strokeColor ='#06008d' fillColor='#605aff' currentRating={rating} setRating={setRating} ratingValue={1} size={size}/>
			<RatingButton Icon={ThumbsUp} strokeColor ='#0b8500' fillColor='#6cff5f' currentRating={rating} setRating={setRating} ratingValue={2} size={size}/>
			<RatingButton Icon={Heart} strokeColor='#9b0049' fillColor='#ff6dd5' currentRating={rating} setRating={setRating} ratingValue={3} size={size}/>
		</span>
	);
};

const RatingButton = ({Icon, strokeColor, fillColor, currentRating, setRating, ratingValue, size}) => {

	const setRatingHandler = () => setRating && setRating(ratingValue);
	let currentStroke = 'grey';
	let currentFill = 'grey';

	if( currentRating == ratingValue) {
		// This value is selected
		currentStroke = strokeColor;
		currentFill = fillColor;
	} else if( !setRating ) {
		return null;
	}

	return <Icon color={currentStroke} fill={currentFill} size={size} onClick={setRatingHandler} />
}

export default Rating;
