import RecipeContainer from 'components/Recipes/RecipeContainer';
import { useState } from 'react';
import FilteredRecipes, { HIDDEN_CATEGORY_FILTER, NEW_ARRIVAL_CATEGORY_FILTER } from '../components/Recipes/FilteredRecipes';
import { Col, Row } from 'reactstrap';

const HomePage = () => {
	const [categoryFilter, setCategoryFilter] = useState('Dinner');
	return (
		<>
			<section>
				<div className="container">
					<Row>
						<Col lg={12}>
							<div className="section-title">
								<h2>Recipe Book</h2>
							</div>
							<div className="featured__controls">
								<ul>
									<li className={categoryFilter === null ? 'active' : ''} onClick={() => setCategoryFilter(null)}>
										All
									</li>
									<li className={categoryFilter === 'Dinner' ? 'active' : ''} data-filter=".fresh-meat" onClick={() => setCategoryFilter('Dinner')}>
										Dinner
									</li>
									<li className={categoryFilter === 'Appetizer' ? 'active' : ''} data-filter=".vegetables" onClick={() => setCategoryFilter('Appetizer')}>
										Appetizers
									</li>
									<li className={categoryFilter === 'Sidedish' ? 'active' : ''} data-filter=".fastfood" onClick={() => setCategoryFilter('Sidedish')}>
										Sidedish
									</li>
									<li className={categoryFilter === 'Dessert' ? 'active' : ''} data-filter=".fastfood" onClick={() => setCategoryFilter('Dessert')}>
										Dessert
									</li>
									<li
										className={categoryFilter === NEW_ARRIVAL_CATEGORY_FILTER ? 'active' : ''}
										data-filter=".fastfood"
										onClick={() => setCategoryFilter(NEW_ARRIVAL_CATEGORY_FILTER)}
									>
										New Arrivals
									</li>
									<li
										className={categoryFilter === HIDDEN_CATEGORY_FILTER ? 'active' : ''}
										data-filter=".fastfood"
										onClick={() => setCategoryFilter(HIDDEN_CATEGORY_FILTER)}
									>
										Hidden
									</li>
								</ul>
							</div>
						</Col>
					</Row>
				</div>
			</section>

			<FilteredRecipes CardType={RecipeContainer} layoutClass="lg-3 recipe-card" categoryFilter={categoryFilter} />
		</>
	);
};

export default HomePage;
