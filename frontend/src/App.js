import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import Header from './components/Common/Header';
import NotFoundPage from './pages/NotFound.Page';
import HomePage from './pages/HomePage';
import RecipeEditPage from './pages/edit/RecipeEditPage';
import RecipePage from './pages/RecipePage';
import Footer from './components/Common/Footer.js';
import MenuPage from './pages/MenuPage';
import ShoppingList from './pages/shoppingList/ShoppingList';
import ConfigurationPage from './pages/configuration/ConfigurationPage';
import BooksTab from './pages/configuration/BooksTab';
import IngredientsTab from './pages/configuration/IngredientsTab';
import DepartmentTab from './pages/configuration/DepartmentTab';
import MigrationTab from 'pages/configuration/MigrationTab';
import ImportFailuresTab from 'pages/configuration/ImportFailuresTab';
import StoreTab from 'pages/configuration/StoreTab';
import { ToastProvider } from 'context/toast-context';
import SuggestionsTab from 'pages/configuration/SuggestionsTab';
import AuditTab from 'pages/configuration/AuditTab';

function App() {
	return (
		<div>
			<ToastProvider>
				<Header />
				<div className="app">
					<Routes>
						<Route path="/" element={<Navigate to="home" />} />
						<Route path="home" element={<HomePage />} />
						<Route path="menu" element={<MenuPage />} />
						<Route path="shoppingList" element={<ShoppingList />} />
						<Route path="configuration" element={<ConfigurationPage />}>
							<Route path="audit" element={<AuditTab />} />
							<Route path="suggestions" element={<SuggestionsTab />} />
							<Route path="books" element={<BooksTab />} />
							<Route path="ingredients" element={<IngredientsTab />} />
							<Route path="departments" element={<DepartmentTab />} />
							<Route path="stores" element={<StoreTab />} />
							<Route path="migration" element={<MigrationTab />} />
							<Route path="import-failures" element={<ImportFailuresTab />} />
							<Route path="*" element={<SuggestionsTab />} />
						</Route>
						<Route path="recipe" element={<RecipeEditPage />} />
						<Route path="recipe/:recipeID" element={<RecipePage />} />
						<Route path="recipe/:recipeID/edit" element={<RecipeEditPage />} />
						<Route path="*" element={<NotFoundPage />} />
					</Routes>
				</div>
				<Footer />
			</ToastProvider>
		</div>
	);
}

export default App;
