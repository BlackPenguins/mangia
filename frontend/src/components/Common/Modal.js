import ReactDOM from 'react-dom';
import './Modal.css';

const Backdrop = ({ closeHandler }) => {
	return <div className="backdrop" onClick={closeHandler}></div>;
};

const ModalWindow = ({ title, buttons, children }) => {
	return (
		<>
			<div className="modal-window">
				<div className="modal-title">{title}</div>
				<div className="content">
					{children}
					<div className="buttons">{buttons}</div>
				</div>
			</div>
		</>
	);
};

const portalElement = document.getElementById('overlays');

const Modal = ({ title, closeHandler, buttons, children }) => {
	const backdrop = ReactDOM.createPortal(<Backdrop closeHandler={closeHandler} />, portalElement);
	const modalWindow = ReactDOM.createPortal(
		<ModalWindow title={title} buttons={buttons}>
			{children}
		</ModalWindow>,
		portalElement
	);

	return (
		<>
			{backdrop}
			{modalWindow}
		</>
	);
};

export default Modal;
