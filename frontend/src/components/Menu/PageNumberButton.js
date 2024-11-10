import { Button } from 'reactstrap';

const PageNumberButton = ({ page, setPage, mobileLabel, label }) => {
	const setPageHandler = () => {
		setPage(page);
	};

	return (
		<Button className="mangia-btn muted week-button" onClick={setPageHandler}>
			<span className="page-button-label">{label}</span>
			<span className="page-button-mobile-label">{mobileLabel}</span>
		</Button>
	);
};

export default PageNumberButton;
