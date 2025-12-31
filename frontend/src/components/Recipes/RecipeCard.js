import { Link } from 'react-router-dom';
import Rating from '../Settings/Rating';
import './RecipeCard.scss';
// import { utcToZonedTime } from 'date-fns-tz';
import { differenceInDays, formatDistance } from 'date-fns';
import NewArrivalTag from './NewArrivalTag';
import { useThumbnailBackgroundStyle } from './RecipeRow';
import { TZDate } from '@date-fns/tz';

const RecipeCard = ({ recipe, isMade, isSkipped, skipReason, isLeftovers, bottomButtons, isMenu }) => {
	let recipeName = '';

	if (recipe) {
		recipeName = recipe.Name;
	}

	const hideInformation = isSkipped || isLeftovers;

	const thumbnailStyle = useThumbnailBackgroundStyle(recipe, hideInformation);

	let thumbnail = (
		<>
			<div style={thumbnailStyle} className="thumbnail-container">
				{!hideInformation && <Rating size="20" rating={recipe?.Rating} />}
			</div>
		</>
	);

	if (recipe?.RecipeID && !hideInformation) {
		thumbnail = <Link to={`/recipe/${recipe?.RecipeID}`}>{thumbnail}</Link>;
	}

	const categoryClass = recipe?.Category?.toLowerCase();

	const classes = ['v-product', categoryClass];

	if (isMenu) {
		classes.push('menu');
	}
	return (
		<div className={classes.join(' ')}>
			<NewArrivalTag recipe={recipe} />
			<CardStatus isSkipped={isSkipped} skipReason={skipReason} recipe={recipe} isMade={isMade} isLeftovers={isLeftovers} />
			<span className="img-prod">
				{thumbnail}
			</span>
			<div className="text py-3 pb-4 px-3 text-center">
				{!hideInformation && (
					<>
						<h3 className={`category-label ${categoryClass}`}>
							<span>{recipeName}</span>
						</h3>
						<DaysAgo label="Last Made:" lastMade={recipe?.lastmade} recentDayThreshold={21} />
						<div className="d-flex">
							<div className="pricing">
								<p className="price">
									<span className="mr-2 price-dc">{recipe?.Description}</span>
								</p>
							</div>
						</div>
					</>
				)}

				<div className="bottom-area d-flex px-3">
					<div className="m-auto d-flex">{bottomButtons}</div>
				</div>
			</div>
		</div>
	);
};

export const getThumbnailImage = (recipe, hideInformation) => {
	const thumbnail = recipe?.thumbnails.find( s => s.IsPrimary === 1);

	return (
		(thumbnail && !hideInformation && `http://${process.env.REACT_APP_HOST_NAME}:6200/thumbs/${thumbnail.FileName}`) ||
		'/images/no-thumb.png'
	);
};

export const DaysAgo = ({ label, lastMade, recentDayThreshold }) => {
	if (!lastMade) {
		return null;
	}

	const lastMadeDateUTC = new Date(lastMade);

	const lastMadeDate = new TZDate(lastMadeDateUTC, 'America/New_York');

	const days = formatDistance(lastMadeDate, new Date(), { addSuffix: true });
	const dayCount = differenceInDays(lastMadeDate, new Date());
	const classes = ['last-made'];

	if (Math.abs(dayCount) <= recentDayThreshold) {
		// Warn with red if in last 3 weeks
		classes.push('recent');
	}

	return (
		<div className={classes.join(' ')}>
			{label} {days}
		</div>
	);
};

const CardStatus = ({ isSkipped, skipReason, recipe, isMade, isLeftovers }) => {
	const layerClasses = ['status-overlay'];

	if (isSkipped) {
		layerClasses.push('skipped');
	} else if (isMade) {
		layerClasses.push('made');
	} else if (isLeftovers) {
		layerClasses.push('leftovers');
	} else if (!recipe) {
		layerClasses.push('available');
	} else {
		layerClasses.push('on-menu');
	}

	let statusText = null;
	if (!!isSkipped) {
		statusText = skipReason || 'SKIPPED';
	} else if (!recipe) {
		// No recipe yet
		statusText = 'AVAILABLE';
	} else if (isMade) {
		// No recipe yet
		statusText = 'MADE';
	} else if (isLeftovers) {
		// No recipe yet
		statusText = 'LEFTOVERS';
	}

	return (
		<>
			<div className={layerClasses.join(' ')}>
				<div className="status-overlay-background" />
				<span className="status-overlay-label">{statusText}</span>
			</div>
		</>
	);
};

export default RecipeCard;
