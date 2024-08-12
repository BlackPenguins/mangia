import { useContext, useState } from 'react';
import AuthContext from './auth-context';
import LoginModal from './LoginModal';
import SignUpModal from './SignUpModal';

const LoginDisplay = () => {
	const authContext = useContext(AuthContext);

	const [showLoginModal, setShowLoginModal] = useState(false);
	const [showSignUpModal, setShowSignUpModal] = useState(false);

	const nameDisplay = authContext.name ? `(${authContext.name})` : '';

	return (
		<>
			{showLoginModal && <LoginModal closeModalHandler={() => setShowLoginModal(false)} showSignUpModal={() => setShowSignUpModal(true)} />}
			{showSignUpModal && <SignUpModal closeModalHandler={() => setShowSignUpModal(false)} />}

			{!authContext.token && (
				<a href="#" onClick={() => setShowLoginModal(true)}>
					<span>Login</span>
				</a>
			)}
			{authContext.token && (
				<>
					<span className="login-name">{nameDisplay}</span>
					<span className="logout-button" onClick={authContext.logoutHandler}>
						Logout
					</span>
				</>
			)}
		</>
	);
};

export default LoginDisplay;
