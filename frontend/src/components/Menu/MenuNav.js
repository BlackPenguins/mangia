import { useCallback, useContext, useState } from 'react';
import { Button } from 'reactstrap';
import './MenuNav.scss';
import PageNumberButton from './PageNumberButton';
import AuthContext from 'authentication/auth-context';
import useBetterModal from 'components/Common/useBetterModal';

const MenuNav = ({ menus, weekOfYear, page, setPage, fetchMenu }) => {
	const authContext = useContext(AuthContext);
	const tokenFromStorage = authContext.token;

	const hasAtLeastOneMenu = menus.filter((m) => m.menuID).length > 0;

	const generateMenu = useCallback(async () => {
		await fetch(`/api/menu/generate/${page}`, {
			method: 'POST',
			headers: {
				// This is required. NodeJS server won't know how to read it without it.
				'Content-Type': 'application/json',
				Authorization: `Bearer ${tokenFromStorage}`,
			},
		});
		fetchMenu(page);
	}, [page, fetchMenu]);

	const { modal, openModal } = useBetterModal({
		title: 'Rebuild the Menu',
		size: 'md',
		buttons: (closeModal) => (
			<>
				<Button
					className="mangia-btn danger"
					onClick={() => {
						generateMenu();
						closeModal();
					}}
				>
					Yes, Rebuild
				</Button>
			</>
		),
		content: (closeModal) => <div>Are you sure you want to re-build this menu? Your previous recipes will be lost for this week.</div>,
	});

	const generateButtonHandler = useCallback(() => {
		if (hasAtLeastOneMenu) {
			openModal();
		} else {
			generateMenu();
		}
	}, [generateMenu, hasAtLeastOneMenu]);

	return (
		<div className="menu-nav-container">
			{modal}
			{authContext.isAdmin && (
				<div className="generate-button">
					<Button onClick={generateButtonHandler} className="mangia-btn success">
						Build Menu
					</Button>
				</div>
			)}
			<div className="menu-nav">
				<PageNumberButton mobileLabel="<" label="Prev Week" page={page - 1} setPage={setPage} />
				<span className="week-number">WEEK {weekOfYear + 1}</span>
				<PageNumberButton mobileLabel=">" label="Next Week" page={page + 1} setPage={setPage} />
			</div>
		</div>
	);
};

export default MenuNav;
