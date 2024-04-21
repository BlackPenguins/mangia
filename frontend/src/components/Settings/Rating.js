import { Star } from 'react-feather';
import './Rating.css';

const Rating = ({ rating, setRating, size }) => {
	let ratingRemaining = rating;
	const stars = [];

	const starClasses = ['star'];
	const ratingClasses = ['rating-container'];

	// if (size) {
	// 	starClasses.push(size);
	// }

	if (setRating) {
		ratingClasses.push('edit');
		starClasses.push('edit');
	}

	for (let starNumber = 1; starNumber <= 5; starNumber++) {
		const setRatingHandler = () => setRating && setRating(starNumber);
		const fill = ratingRemaining > 0 ? 'yellow' : 'none';

		// stars.push(<img alt={`rating_${starNumber}`} key={starNumber} className={starClasses.join(' ')} onClick={setRatingHandler} src={`/images/${ratingImage}`} />);
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
