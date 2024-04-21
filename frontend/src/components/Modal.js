import ReactDOM from 'react-dom';
import './Modal.css';

const Backdrop = ({ closeHandler }) => {
	return <div className="backdrop" onClick={closeHandler}></div>;
};

const ModalWindow = ({ className, children }) => {
	const classes = ['modal-window'];

	if (className) {
		classes.push(className);
	}
	return (
		<>
			<div className={classes.join(' ')}>
				<div className="content">{children}</div>
			</div>
		</>
	);
};

const portalElement = document.getElementById('overlays');

const Modal = ({ className, closeHandler, children }) => {
	const backdrop = ReactDOM.createPortal(<Backdrop closeHandler={closeHandler} />, portalElement);
	const modalWindow = ReactDOM.createPortal(<ModalWindow className={className}>{children}</ModalWindow>, portalElement);

	return (
		<>
			{backdrop}
			{modalWindow}
		</>
	);
};

export default Modal;
