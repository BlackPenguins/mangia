import React, { createContext, useState, useContext, useCallback } from 'react';
import { Toast, ToastBody, ToastHeader } from 'reactstrap';

import './toast-context.scss';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
	const [toasts, setToasts] = useState([]);

	const clearToast = (id) => {
		setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
	};

	const showToast = useCallback((title, message) => {
		const id = Date.now(); // Use a timestamp as a unique ID for each toast
		setToasts((currentToasts) => [...currentToasts, { id, title, message, visible: true }]);

		setTimeout(() => {
			clearToast(id);
		}, 8000);
	}, []);

	return (
		<ToastContext.Provider value={showToast}>
			{children}
			<div className="toast-container">
				{toasts.map((toast) => (
					<Toast
						fade={true}
						key={toast.id}
						isOpen={toast.visible}
						className="mb-2" // Adds space between toasts
					>
						<ToastHeader toggle={() => clearToast(toast.id)}>{toast.title}</ToastHeader>
						<ToastBody>{toast.message}</ToastBody>
					</Toast>
				))}
			</div>
		</ToastContext.Provider>
	);
};

export const useToast = () => useContext(ToastContext);
