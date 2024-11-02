import { useContext, useState } from 'react';
import { Menu, Users } from 'react-feather';
import { useNavigate } from 'react-router-dom';
import AuthContext from 'authentication/auth-context';
import LoginDisplay from 'authentication/LoginDisplay';
import useAddRecipeModal from 'components/Settings/useAddRecipeModal';
import useImportRecipeModal from 'components/Settings/ImportRecipeModal';

const Header = () => {
	const authContext = useContext(AuthContext);
	const navigate = useNavigate();

	const [showSidebar, setShowSidebar] = useState(false);

	const { modal: addModal, openModal: openAddModal } = useAddRecipeModal();
	const { modal: importModal, openModal: openImportModal } = useImportRecipeModal();

	const overlayClasses = ['humberger__menu__overlay'];
	const sidebarClasses = ['humberger__menu__wrapper'];

	if (showSidebar) {
		sidebarClasses.push('show__humberger__menu__wrapper');
		overlayClasses.push('active');
	}

	const navigateTo = (to) => {
		navigate(to);
		setShowSidebar(false);
	};

	const importRecipe = () => {
		openImportModal();
		setShowSidebar(false);
	};

	const addRecipe = () => {
		openAddModal();
		setShowSidebar(false);
	};

	const links = (
		<ul>
			<li>
				<div className="nav-link" onClick={() => navigateTo('home')}>
					<span>Recipe Book</span>
				</div>
			</li>
			<li>
				<div className="nav-link" onClick={() => navigateTo('menu')}>
					<span>Menu</span>
				</div>
			</li>
			{authContext.isAdmin && (
				<>
					<li>
						<div className="nav-link" onClick={addRecipe}>
							<span>Add Recipe</span>
						</div>
					</li>
					<li>
						<div className="nav-link" onClick={importRecipe}>
							<span>Import Recipe</span>
						</div>
					</li>
					<li>
						<div className="nav-link" onClick={() => navigateTo('shoppingList')}>
							<span>Shopping List</span>
						</div>
					</li>
					<li>
						<div className="nav-link" onClick={() => navigateTo('configuration')}>
							<span>Config</span>
						</div>
					</li>
				</>
			)}
		</ul>
	);

	const headerClasses = ['header__top'];
	let title = 'Mangia!';

	if (window.location.host.indexOf('localhost') !== -1) {
		headerClasses.push('test-server');
		title = 'Mangia Test Server!';
	}

	return (
		<>
			{importModal}
			{addModal}
			<div className={overlayClasses.join(' ')} onClick={() => setShowSidebar(false)}></div>
			<div className={sidebarClasses.join(' ')}>
				<div className="humberger__menu__logo">MANGIA!</div>
				<div className="humberger__menu__widget">
					<div className="header__top__right__auth">
						<span>
							<Users size={15} /> <LoginDisplay />
						</span>
					</div>
				</div>
				<nav className="humberger__menu__nav mobile-menu slicknav_nav">{links}</nav>
				<div id="mobile-menu-wrap"></div>
			</div>
			<header className="header">
				<div className={headerClasses.join(' ')}>
					<div className="container">
						<div className="row">
							<div className="col-lg-12 col-md-12">
								<span className="header__top__left">{title}</span>
								<span className="header__top__right">
									<Users size={15} /> <LoginDisplay />
								</span>
							</div>
						</div>
					</div>
				</div>
				<div className="container">
					<div className="row">
						<div className="col-lg-12">
							<nav className="header__menu">{links}</nav>
						</div>
					</div>
					<div
						className="humberger__open"
						onClick={() => {
							setShowSidebar(true);
						}}
					>
						<Menu />
					</div>
				</div>
			</header>
		</>
	);
};

export default Header;
