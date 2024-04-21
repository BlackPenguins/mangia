const { createProxyMiddleware } = require('http-proxy-middleware');

const proxy = {
	target: `http://mangia-backend:${process.env.MANGIA_BACKEND_PORT}`,
	changeOrigin: true,
};

const authProxy = {
	target: `http://authentication:${process.env.AUTH_BACKEND_PORT}`,
	changeOrigin: true,
};

module.exports = function (app) {
	app.use('/api', createProxyMiddleware(proxy));
	app.use('/auth', createProxyMiddleware(authProxy));
};
