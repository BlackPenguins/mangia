import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import NotFoundPage from './pages/NotFound.Page';
import HomePage from './pages/HomePage';
import RecipeDetailsPage from './pages/RecipeEditPage';
import RecipePage from './pages/RecipePage';
import NewHomePage from './pages/NewHomePage';
import Footer from './components/Footer.js';
import MenuPage from './pages/MenuPage';

function App() {
	return (
		<div>
			<Header />
			<div className="app">
				<Routes>
					<Route path="/" element={<Navigate to="home" />} />
					<Route path="home" element={<HomePage />} />
					<Route path="newhome" element={<NewHomePage />} />
					<Route path="menu" element={<MenuPage />} />
					<Route path="recipe" element={<RecipeDetailsPage />} />
					<Route path="recipe/:recipeID" element={<RecipePage />} />
					<Route path="recipe/:recipeID/edit" element={<RecipeDetailsPage />} />
					<Route path="*" element={<NotFoundPage />} />
				</Routes>
			</div>
			<Footer />
		</div>
	);
}

export default App;
