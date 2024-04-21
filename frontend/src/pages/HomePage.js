import { useState } from 'react';
import FilteredRecipesControl from '../components/Recipes/FilteredRecipesControl';
import RecipeCard from '../components/Recipes/RecipeCard';

const HomePage = () => {
	const [categoryFilter, setCategoryFilter] = useState(null);
	return (
		<>
			<section>
				<div class="container">
					<div class="row">
						<div class="col-lg-12">
							<div class="section-title">
								<h2>Recipe Book</h2>
							</div>
							<div class="featured__controls">
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
								</ul>
							</div>
						</div>
					</div>
				</div>
			</section>

			<FilteredRecipesControl CardType={RecipeCard} layoutClass="lg-3 recipe-card" categoryFilter={categoryFilter} />
		</>
	);
};

export default HomePage;
