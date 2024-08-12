import { Spinner } from 'reactstrap';

const LoadingText = ({ text }) => {
	return (
		<div className="loading">
			<Spinner
				color="success"
				style={{
					height: '2em',
					width: '2em',
				}}
			></Spinner>
			<span className="loading-text">{text}</span>
		</div>
	);
};

export default LoadingText;
