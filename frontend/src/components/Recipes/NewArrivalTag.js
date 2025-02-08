import './NewArrivalTag.scss';

const NewArrivalTag = ({ recipe }) => {
	if (recipe?.IsNewArrival !== 1) {
		return null;
	}

	return <span className="new-arrival-tag">New Arrival</span>;
};

export default NewArrivalTag;
