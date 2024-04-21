export const checkAdminMiddleware = async (req, res, next) => {
	if (req.method === 'OPTIONS') {
		return next();
	}

	console.log('Authentication coming in');
	// Make a call to the auth server to get the details of this user
	const response = await fetch(`http://authentication:${process.env.AUTH_BACKEND_PORT}/auth/checkuser`, {
		method: 'POST',
		headers: req.headers,
	});

	console.log('Response from Auth Server', response.status);

	const data = await response.json();

	if (response.status !== 200) {
		return res.status(response.status).json(data);
	}

	console.log('DA', data);

	if (data.isAdmin) {
		next();
	}

	console.log('Unauthorized');
	return res.status(401).json(data);
};