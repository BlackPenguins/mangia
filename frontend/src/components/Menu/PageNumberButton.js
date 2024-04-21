import { Button } from 'reactstrap';

const PageNumberButton = ({ page, setPage, label }) => {
	const setPageHandler = () => {
		setPage(page);
	};

	return (
		<Button className="site-btn week-button" onClick={setPageHandler}>
			{label}
		</Button>
	);
};

export default PageNumberButton;
