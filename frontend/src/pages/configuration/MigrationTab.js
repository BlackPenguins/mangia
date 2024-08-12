import AuthContext from 'authentication/auth-context';
import { useContext, useState } from 'react';
import { Button } from 'reactstrap';

const MigrationTab = () => {
	const authContext = useContext(AuthContext);
	const tokenFromStorage = authContext.token;

	const migrationHandler = async (migrationKeyword, setColor) => {
		console.log('Migrating', migrationKeyword);
		setColor('warning');
		const response = await fetch(`/api/migration`, {
			method: 'POST',
			body: JSON.stringify({ migrationKeyword }),
			headers: {
				// This is required. NodeJS server won't know how to read it without it.
				'Content-Type': 'application/json',
				Authorization: `Bearer ${tokenFromStorage}`,
			},
		});

		const data = await response.json();
		setColor(data.success ? 'success' : 'danger');
	};

	return (
		<div>
			<MigrationButton migrationHandler={migrationHandler} migrationKeyword="resizeImages" label="v1.1: Resize Images" />
		</div>
	);
};

const MigrationButton = ({ migrationHandler, migrationKeyword, label }) => {
	const [color, setColor] = useState('primary');

	return (
		<Button color={color} onClick={() => migrationHandler(migrationKeyword, setColor)}>
			{label}
		</Button>
	);
};

export default MigrationTab;
