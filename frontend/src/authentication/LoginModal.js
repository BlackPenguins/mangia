import useBetterModal from 'components/Common/useBetterModal';
import { useContext, useState } from 'react';
import { Button, Input, InputGroup, InputGroupText } from 'reactstrap';
import AuthContext from './auth-context';

import './LoginModal.css';

const useLoginModal = (openSignUpModal) => {
	const authContext = useContext(AuthContext);
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [errorMessage, setErrorMessage] = useState('');

	const signUpHandler = (closeModal) => {
		closeModal();
		openSignUpModal();
	};

	const loginHandler = (closeModal) => authContext.loginHandler(username, password, setErrorMessage, closeModal);

	const { modal, openModal, closeModal } = useBetterModal({
		title: 'Login',
		size: 'sm',
		content: (closeModal) => (
			<>
				<InputGroup>
					<InputGroupText>Username</InputGroupText>
					<Input
						maxLength={30}
						type="text"
						onChange={(e) => {
							setUsername(e.target.value);
						}}
						value={username}
					/>
				</InputGroup>
				<InputGroup>
					<InputGroupText>Password</InputGroupText>
					<Input
						maxLength={30}
						type="password"
						onChange={(e) => {
							setPassword(e.target.value);
						}}
						value={password}
					/>
				</InputGroup>
				<div>{errorMessage}</div>
				<div className="register">
					Not a user?
					<a className="link" onClick={() => signUpHandler(closeModal)}>
						Register now!
					</a>
				</div>
			</>
		),
		buttons: (closeModal) => (
			<div className="login-button">
				<Button onClick={() => loginHandler(closeModal)}>Login</Button>
			</div>
		),
	});

	return { modal, openModal };
};

export default useLoginModal;
