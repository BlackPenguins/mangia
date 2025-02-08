import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';
import { MenuContextProvider } from './authentication/menu-context.js';
import { AuthProvider, ToastProvider } from '@blackpenguins/penguinore-common-ext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
	<BrowserRouter>
		<AuthProvider>
			<ToastProvider>
			<MenuContextProvider>
				<App />
			</MenuContextProvider>
			</ToastProvider>
		</AuthProvider>
	</BrowserRouter>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
