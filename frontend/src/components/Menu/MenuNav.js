import { useCallback, useContext, useState } from 'react';
import { Button } from 'reactstrap';
import './MenuNav.css';
import PageNumberButton from './PageNumberButton';
import Modal from '../Modal';
import AuthContext from '../../authentication/auth-context';

const MenuNav = ({ menus, weekOfYear, page, setPage, fetchMenu }) => {
	const authContext = useContext(AuthContext);
	const tokenFromStorage = authContext.token;

	const [showConfirmGenerate, setShowConfirmGenerate] = useState(false);

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

	const hasAtLeastOneMenu = menus.filter((m) => m.menuID).length > 0;
	console.log('MENU', menus, hasAtLeastOneMenu);

	const generateButtonHandler = useCallback(() => {
		if (hasAtLeastOneMenu) {
			setShowConfirmGenerate(true);
		} else {
			generateMenu();
		}
	}, [generateMenu, hasAtLeastOneMenu]);

	return (
		<div className="menu-nav-container">
			{showConfirmGenerate && (
				<ConfirmGenerateModal generateMenu={generateMenu} page={page} fetchMenu={fetchMenu} closeModalHandler={() => setShowConfirmGenerate(false)} />
			)}
			{authContext.isAdmin && (
				<div className="generate-button">
					<Button color="success" onClick={generateButtonHandler} className="site-btn">
						Build Menu
					</Button>
				</div>
			)}
			<div className="menu-nav">
				<PageNumberButton label="Prev Week" page={page - 1} setPage={setPage} />
				<span className="week-number">WEEK {weekOfYear + 1}</span>
				<PageNumberButton label="Next Week" page={page + 1} setPage={setPage} />
			</div>
		</div>
	);
};

const ConfirmGenerateModal = ({ generateMenu, closeModalHandler }) => {
	const generateHandler = () => {
		generateMenu();
		closeModalHandler();
	};

	return (
		<>
			<Modal className="confirm-modal" closeHandler={closeModalHandler}>
				<div>Are you sure you want to re-build this menu? Your previous recipes will be lost for this week.</div>
				<div className="buttons">
					<Button onClick={closeModalHandler}>Close</Button>
					<Button color="danger" onClick={generateHandler}>
						Yes, Rebuild
					</Button>
				</div>
			</Modal>
		</>
	);
};

export default MenuNav;
