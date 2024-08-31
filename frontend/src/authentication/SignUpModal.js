import useBetterModal from 'components/Common/useBetterModal';
import { useState } from 'react';
import { Button, Input, InputGroup, InputGroupText } from 'reactstrap';

const useSignUpModal = () => {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [passwordConfirm, setPasswordConfirm] = useState('');
	const [name, setName] = useState('');
	const [errorMessage, setErrorMessage] = useState('');

	const signUpHandler = async (closeModal) => {
		const credentialsJSON = {
			username,
			password,
			passwordConfirm,
			name,
		};

		console.log('SENDING', credentialsJSON);
		const response = await fetch('/auth/register', {
			method: 'POST',
			body: JSON.stringify(credentialsJSON),
			headers: {
				'Content-Type': 'application/json',
			},
		});

		const data = await response.json();

		if (response.status !== 200) {
			setErrorMessage(data.message);
		} else {
			closeModal();
		}
	};

	const { modal, openModal, closeModal } = useBetterModal({
		title: 'Join Penguinore!',
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
				<InputGroup>
					<InputGroupText>Password Confirm</InputGroupText>
					<Input
						maxLength={30}
						type="password"
						onChange={(e) => {
							setPasswordConfirm(e.target.value);
						}}
						value={passwordConfirm}
					/>
				</InputGroup>
				<InputGroup>
					<InputGroupText>Name</InputGroupText>
					<Input
						maxLength={30}
						type="text"
						onChange={(e) => {
							setName(e.target.value);
						}}
						value={name}
					/>
				</InputGroup>
				<div>{errorMessage}</div>
			</>
		),
		buttons: (closeModal) => <Button onClick={() => signUpHandler(closeModal)}>Register!</Button>,
	});

	return { modal, openModal };
};

export default useSignUpModal;
