import { useContext, useState } from 'react';
import { Menu, Users } from 'react-feather';
import { useNavigate } from 'react-router-dom';
import AuthContext from 'authentication/auth-context';
import LoginDisplay from 'authentication/LoginDisplay';
import AddRecipeModal from 'components/Settings/AddRecipeModal';
import ImportRecipeModal from 'components/Settings/ImportRecipeModal';

const Header = () => {
	const authContext = useContext(AuthContext);
	const navigate = useNavigate();

	const [showImportModal, setShowImportModal] = useState(false);
	const [showAddRecipeModal, setShowAddRecipeModal] = useState(false);
	const [showSidebar, setShowSidebar] = useState(false);

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
		setShowImportModal(true);
		setShowSidebar(false);
	};

	const addRecipe = () => {
		setShowAddRecipeModal(true);
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

	return (
		<>
			{showImportModal && <ImportRecipeModal closeModalHandler={() => setShowImportModal(false)} />}
			{showAddRecipeModal && <AddRecipeModal closeModalHandler={() => setShowAddRecipeModal(false)} />}
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
				<div className="header__top">
					<div className="container">
						<div className="row">
							<div className="col-lg-12 col-md-12">
								<span className="header__top__left">MANGIA!</span>
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
							console.log('OPE');
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
