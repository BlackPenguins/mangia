import React, { useCallback, useEffect, useState } from 'react';

const AuthContext = React.createContext({
	// Dummy data to VS Code has auto-complete
	isAdmin: false,
	token: null,
	name: null,
	loginHandler: (username, password, setErrorMessage, closeModalFunction) => {},
	logoutHandler: () => {},
	isNotAdmin: () => {},
});

export const AuthContextProvider = ({ children }) => {
	const [token, setToken] = useState(null);
	const [name, setName] = useState(null);
	const [isAdmin, setIsAdmin] = useState(false);
	const [userID, setUserID] = useState(0);
	const [users, setUsers] = useState([]);

	const loginHandler = async (username, password, setErrorMessage, closeModalFunction) => {
		const credentialsJSON = {
			username,
			password,
		};

		const response = await fetch('/auth/login', {
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
			const token = data.token;
			closeModalFunction();

			// Set token in the localStorage so on page refresh we know we are still logged in
			localStorage.setItem('token', token);

			// Set token in state so the login page disappears
			setToken(token);
		}
	};

	const logoutHandler = () => {
		setToken(null);
		localStorage.removeItem('token');
	};

	const fetchUserData = useCallback(() => {
		const response = fetch(`/auth/checkuser`, {
			method: 'POST',
			headers: {
				// This is required. NodeJS server won't know how to read it without it.
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
		});
		response
			.then((response) => {
				return response.json();
			})
			.then((json) => {
				if (json.message) {
					console.error('Error getting user information: ', json.message);
					setName(null);
					setIsAdmin(false);
					setUserID(0);
				} else {
					console.log('Retrieved user information:', json);
					setName(json.name);
					setIsAdmin(json.isAdmin);
					setUserID(json.userID);
				}
			});
	}, [token]);

	const fetchUsers = useCallback(() => {
		const response = fetch(`/auth/users`, {
			headers: {
				// This is required. NodeJS server won't know how to read it without it.
				'Content-Type': 'application/json',
			},
		});
		response
			.then((response) => {
				return response.json();
			})
			.then((json) => {
				setUsers(json);
			});
	}, []);

	useEffect(() => {
		// If that token changes, or is set, fetch that user information
		fetchUserData();
	}, [fetchUserData, token]);

	useEffect(() => {
		// If you refresh the page, we need to get that token back into the state so we hide the login button
		const tokenFromStorage = localStorage.getItem('token');
		setToken(tokenFromStorage);
		fetchUserData();
		fetchUsers();
	}, [fetchUserData, fetchUsers]);

	const isNotAdmin = () => {
		return userID !== 0 && !isAdmin;
	};

	return (
		<AuthContext.Provider
			value={{
				isAdmin,
				token,
				name,
				userID,
				loginHandler,
				logoutHandler,
				users,
				isNotAdmin,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};

export default AuthContext;
