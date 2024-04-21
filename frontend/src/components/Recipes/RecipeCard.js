import { Link } from 'react-router-dom';
import Rating from '../Settings/Rating';
import './RecipeCard.css';
import { utcToZonedTime } from 'date-fns-tz';
import { differenceInDays, formatDistance } from 'date-fns';

const RecipeCard = ({ recipe, isMade, isSkipped, skipReason, isLeftovers, bottomButtons, isMenu }) => {
	let recipeName = '';

	if (recipe) {
		recipeName = recipe.Name;
	}

	const thumbnailImage = (recipe?.Image && !isLeftovers && `http://localhost:6200/thumbs/${recipe?.Image}`) || 'images/no-thumb.png';

	const thumbnailStyle = {
		backgroundImage: `url(${thumbnailImage})`,
		backgroundSize: 'cover',
		height: '200px',
	};

	let thumbnail = (
		<>
			<div style={thumbnailStyle} className="thumbnail-container">
				{!isLeftovers && <Rating size="20" rating={recipe?.Rating} />}
			</div>
		</>
	);

	if (recipe?.RecipeID && !isLeftovers) {
		thumbnail = <Link to={`/recipe/${recipe?.RecipeID}`}>{thumbnail}</Link>;
	}

	const categoryClass = recipe?.Category?.toLowerCase();

	const classes = ['v-product'];

	if (isMenu) {
		classes.push('menu');
	}
	return (
		<div class={classes.join(' ')}>
			<CardStatus isSkipped={isSkipped} skipReason={skipReason} recipe={recipe} isMade={isMade} isLeftovers={isLeftovers} />
			<a href="#" class="img-prod">
				{thumbnail}
			</a>
			<div class="text py-3 pb-4 px-3 text-center">
				<h3 className={`card-title ${categoryClass}`}>
					<span>{recipeName}</span>
				</h3>
				<DaysAgo lastMade={recipe?.lastmade} />
				<div class="d-flex">
					<div class="pricing">
						<p class="price">
							<span class="mr-2 price-dc">{recipe?.Description}</span>
						</p>
					</div>
				</div>
				<div class="bottom-area d-flex px-3">
					<div class="m-auto d-flex">{bottomButtons}</div>
				</div>
			</div>
		</div>
	);
};

const DaysAgo = ({ lastMade }) => {
	console.log('HIT', lastMade);
	if (!lastMade) {
		return null;
	}

	const lastMadeDateUTC = new Date(lastMade);
	const lastMadeDate = utcToZonedTime(lastMadeDateUTC, 'America/New_York');

	const days = formatDistance(lastMadeDate, new Date(), { addSuffix: true });
	const dayCount = differenceInDays(lastMadeDate, new Date());
	const classes = ['last-made'];

	if (dayCount > -21) {
		// Warn with red if in last 3 weeks
		classes.push('recent');
	}

	return <div className={classes.join(' ')}>Last Made: {days}</div>;
};

const CardStatus = ({ isSkipped, skipReason, recipe, isMade, isLeftovers }) => {
	const layerClasses = ['layer'];

	if (isSkipped) {
		layerClasses.push('skipped');
	} else if (isLeftovers) {
		layerClasses.push('leftovers');
	} else if (isMade) {
		layerClasses.push('made');
	} else if (!recipe) {
		layerClasses.push('available');
	}

	let statusLabel = null;
	if (!!isSkipped) {
		const reasonText = skipReason || 'SKIPPED';
		statusLabel = <span className="skipped-label layer-label">{reasonText}</span>;
	} else if (!recipe) {
		// No recipe yet
		statusLabel = <span className="available-label layer-label">AVAILABLE</span>;
	} else if (isMade) {
		// No recipe yet
		statusLabel = <span className="made-label layer-label">MADE</span>;
	} else if (isLeftovers) {
		// No recipe yet
		statusLabel = <span className="leftovers-label layer-label">LEFTOVERS</span>;
	} else {
		//Recipe chosen, no status
		statusLabel = null;
	}

	return (
		<>
			<div className={layerClasses.join(' ')}></div>
			{statusLabel}
		</>
	);
};

export default RecipeCard;
