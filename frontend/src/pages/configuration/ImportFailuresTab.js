import AuthContext from 'authentication/auth-context';
import { useCallback, useContext, useEffect, useState } from 'react';

const ImportFailuresTab = () => {
	const authContext = useContext(AuthContext);
	const tokenFromStorage = authContext.token;

	const [urls, setURLs] = useState([]);

	const getURLs = useCallback(async () => {
		const response = await fetch(`/api/recipe/importFailureURLs`, {
			method: 'GET',
			headers: {
				// This is required. NodeJS server won't know how to read it without it.
				'Content-Type': 'application/json',
				Authorization: `Bearer ${tokenFromStorage}`,
			},
		});

		const data = await response.json();
		setURLs(data);
	}, [tokenFromStorage]);

	useEffect(() => {
		getURLs();
	}, [getURLs]);

	return (
		<div className="container book-list">
			<h3>Import Failures</h3>
			{urls &&
				urls.map((url) => {
					const date = new Date(url.Date);
					const formattedDate = date.toLocaleDateString('en-US', {
						year: 'numeric',
						month: 'long',
						day: 'numeric',
					});
					return (
						<div>
							{formattedDate} - <a href={url.URL}>{url.URL}</a>
						</div>
					);
				})}
		</div>
	);
};
export default ImportFailuresTab;
