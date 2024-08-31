import { useContext, useState } from 'react';
import AuthContext from './auth-context';
import useLoginModal from './LoginModal';
import useSignUpModal from './SignUpModal';

const LoginDisplay = () => {
	const authContext = useContext(AuthContext);

	const nameDisplay = authContext.name ? `(${authContext.name})` : '';

	const { modal: signUpModal, openModal: openSignUpModal } = useSignUpModal();
	const { modal: loginModal, openModal: openLoginModal } = useLoginModal(openSignUpModal);

	return (
		<>
			{loginModal}
			{signUpModal}

			{!authContext.token && (
				<a href="#" onClick={() => openLoginModal()}>
					<span className="login-logout-button">Login</span>
				</a>
			)}
			{authContext.token && (
				<>
					<span className="login-name">{nameDisplay}</span>
					<span className="login-logout-button" onClick={authContext.logoutHandler}>
						Logout
					</span>
				</>
			)}
		</>
	);
};

export default LoginDisplay;
