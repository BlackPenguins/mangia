import RecipeContainer from 'components/Recipes/RecipeContainer';
import { useState } from 'react';
import FilteredRecipes, { HIDDEN_CATEGORY_FILTER } from '../components/Recipes/FilteredRecipes';

const HomePage = () => {
	const [categoryFilter, setCategoryFilter] = useState('Dinner');
	return (
		<>
			<section>
				<div className="container">
					<div className="row">
						<div className="col-lg-12">
							<div className="section-title">
								<h2>Recipe Book</h2>
							</div>
							<div className="featured__controls">
								<ul>
									<li class={categoryFilter === null ? 'active' : ''} onClick={() => setCategoryFilter(null)}>
										All
									</li>
									<li class={categoryFilter === 'Dinner' ? 'active' : ''} data-filter=".fresh-meat" onClick={() => setCategoryFilter('Dinner')}>
										Dinner
									</li>
									<li class={categoryFilter === 'Appetizer' ? 'active' : ''} data-filter=".vegetables" onClick={() => setCategoryFilter('Appetizer')}>
										Appetizers
									</li>
									<li class={categoryFilter === 'Sidedish' ? 'active' : ''} data-filter=".fastfood" onClick={() => setCategoryFilter('Sidedish')}>
										Sidedish
									</li>
									<li class={categoryFilter === 'Dessert' ? 'active' : ''} data-filter=".fastfood" onClick={() => setCategoryFilter('Dessert')}>
										Dessert
									</li>
									<li
										class={categoryFilter === HIDDEN_CATEGORY_FILTER ? 'active' : ''}
										data-filter=".fastfood"
										onClick={() => setCategoryFilter(HIDDEN_CATEGORY_FILTER)}
									>
										Hidden
									</li>
								</ul>
							</div>
						</div>
					</div>
				</div>
			</section>

			<FilteredRecipes CardType={RecipeContainer} layoutClass="lg-3 recipe-card" categoryFilter={categoryFilter} />
		</>
	);
};

export default HomePage;
