import { useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import './Modal.scss';

const useBetterModal = ({ title, content, buttons, inputRef, size }) => {
	const [isOpen, setIsOpen] = useState(false);
	const toggle = () => setIsOpen(!isOpen);
	const openModal = () => setIsOpen(true);
	const closeModal = () => setIsOpen(false);

	const onOpen = () => {
		if (inputRef) {
			inputRef.current?.focus();
		}
	};

	const contentWithAction = (content && content(closeModal)) || null;
	const buttonsWithAction = (buttons && buttons(closeModal)) || null;

	const modal = (
		<Modal size={size} isOpen={isOpen} toggle={toggle} autoFocus={true} onOpened={onOpen} keyboard={true} backdrop={true} className="modal-window">
			<ModalHeader toggle={toggle}>{title}</ModalHeader>
			<ModalBody>{contentWithAction}</ModalBody>
			<ModalFooter>{buttonsWithAction}</ModalFooter>
		</Modal>
	);

	return { modal, openModal, closeModal };
};

export default useBetterModal;
