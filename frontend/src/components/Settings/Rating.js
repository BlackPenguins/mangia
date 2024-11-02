import { Star } from 'react-feather';
import './Rating.scss';

const Rating = ({ rating, setRating, size }) => {
	if (!rating && !setRating) {
		// No rating yet, hide the stars
		// But don't hide if it's the edit rating control or there would be no way to edit it
		return null;
	}

	let ratingRemaining = rating;
	const stars = [];

	const ratingClasses = ['rating-container'];

	if (setRating) {
		ratingClasses.push('editable');
	}

	for (let starNumber = 1; starNumber <= 5; starNumber++) {
		const setRatingHandler = () => setRating && setRating(starNumber);
		const fill = ratingRemaining > 0 ? 'yellow' : 'none';

		stars.push(
			<span key={starNumber} onClick={setRatingHandler}>
				<Star color="#82ae46" size={size} fill={fill} />
			</span>
		);

		ratingRemaining--;
	}

	return <span className={ratingClasses.join(' ')}>{stars}</span>;
};

export default Rating;
