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
import ShoppingList from './pages/ShoppingList';
import ConfigurationPage from './pages/configuration/ConfigurationPage';
import BooksTab from './pages/configuration/BooksTab';
import IngredientsTab from './pages/configuration/IngredientsTab';
import DepartmentTab from './pages/configuration/DepartmentTab';

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
					<Route path="shoppingList" element={<ShoppingList />} />
					<Route path="configuration" element={<ConfigurationPage />}>
						<Route path="books" element={<BooksTab />} />
						<Route path="ingredients" element={<IngredientsTab />} />
						<Route path="department" element={<DepartmentTab />} />
					</Route>
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
