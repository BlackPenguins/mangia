import { useContext, useState } from 'react';
import { Menu, Users } from 'react-feather';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../authentication/auth-context';
import LoginDisplay from '../authentication/LoginDisplay';
import ImportRecipeModal from './Settings/ImportRecipeModal';

const Header = () => {
	const authContext = useContext(AuthContext);
	const navigate = useNavigate();

	const [showImportModal, setShowImportModal] = useState(false);
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
						<div className="nav-link" onClick={() => navigateTo('recipe')}>
							<span>Add Recipe</span>
						</div>
					</li>
					<li>
						<div className="nav-link" onClick={importRecipe}>
							<span>Import Recipe</span>
						</div>
					</li>
				</>
			)}
		</ul>
	);

	return (
		<>
			{showImportModal && <ImportRecipeModal closeModalHandler={() => setShowImportModal(true)} />}
			<div className={overlayClasses.join(' ')} onClick={() => setShowSidebar(false)}></div>
			<div className={sidebarClasses.join(' ')}>
				<div class="humberger__menu__logo">MANGIA!</div>
				<div class="humberger__menu__widget">
					<div class="header__top__right__auth">
						<a href="#">
							<Users size={15} /> <LoginDisplay />
						</a>
					</div>
				</div>
				<nav class="humberger__menu__nav mobile-menu slicknav_nav">{links}</nav>
				<div id="mobile-menu-wrap"></div>
			</div>

			<header class="header">
				<div class="header__top">
					<div class="container">
						<div class="row">
							<div class="col-lg-6 col-md-6">
								<div class="header__top__left">
									<ul>MANGIA!</ul>
								</div>
							</div>
							<div class="col-lg-6 col-md-6">
								<div class="header__top__right">
									<div class="header__top__right__auth">
										<a href="#">
											<Users size={15} /> <LoginDisplay />
										</a>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div class="container">
					<div class="row">
						<div class="col-lg-3">
							<div class="header__logo">
								<a href="./index.html">
									<img src="img/logo.png" alt="" />
								</a>
							</div>
						</div>
						<div class="col-lg-6">
							<nav class="header__menu">{links}</nav>
						</div>
					</div>
					<div class="humberger__open" onClick={() => setShowSidebar(true)}>
						<Menu />
					</div>
				</div>
			</header>
		</>
	);
};

export default Header;
