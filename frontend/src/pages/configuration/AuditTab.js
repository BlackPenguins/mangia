import { BeforeAfter, MatchedIngredients } from 'components/Menu/MenuSection';
import RecipeRow from 'components/Recipes/RecipeRow';
import { useCallback, useEffect, useState } from 'react';
import { Col, Row } from 'reactstrap';
import './AuditTab.scss';
import { DaysAgo } from 'components/Recipes/RecipeCard';

const AuditTab = () => {
	const [recipeIDs, setRecipeIDs] = useState(null);

	const fetchMenu = useCallback(async () => {
		const response = await fetch(`/api/menu/0`);
		const data = await response.json();
		const menu = data.days;
		const recipeIDs = menu.map((m) => m.recipe?.RecipeID);
		setRecipeIDs(recipeIDs);
	}, []);

	useEffect(() => {
		fetchMenu();
	}, [fetchMenu]);

	const [weightedRecipes, setWeightedRecipes] = useState(null);

	const fetchAudit = useCallback(async () => {
		const response = await fetch('/api/menu/audit', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		});
		const data = await response.json();
		setWeightedRecipes(data.sortedRecipes.reverse());
	}, []);

	useEffect(() => {
		fetchAudit();
	}, [fetchAudit]);


	return (
		<div className="container audit-list">
			<Row>
				<Col lg={1}>Rank</Col>
				<Col lg={6}>Name</Col>
				<Col lg={1}>Factors</Col>
				<Col lg={2}>&nbsp;</Col>
				<Col lg={2}>Weight</Col>
			</Row>

			{weightedRecipes?.map((recipe) => {
				const classes = [];

				if( recipeIDs && recipeIDs.includes(recipe.RecipeID)) {
					classes.push("this-week");
				}

				return (
					<Row key={recipe.RecipeID} className={classes.join(' ')}>
						<Col lg={1} className='data'>
							<table>
								<tbody>
									<BeforeAfter label="" before={recipe.originalRanking} after={recipe.adjustedRanking}/>
								</tbody>
							</table>
							{recipe.isAged}
						</Col>
						<Col lg={6}>
							<RecipeRow key={recipe.RecipeID} recipe={recipe} onClickHandler={() => {}} />
						</Col>
						<Col lg={1} className='data'>
							<span><MatchedIngredients menu={recipe}/></span>
						</Col>
						<Col lg={2} className='data'>
							<span className="aged">{recipe.isAged ? 'Aged' : ''}</span>
							<span className="new">{recipe.IsNewArrival === 1 ? 'New' : ''}</span>
							<DaysAgo lastMade={recipe?.lastmade} recentDayThreshold={21} />
						</Col>
						

						<Col lg={2} className='data'>
							<table>
								<tbody>
									<BeforeAfter label="" before={recipe.originalWeight} after={recipe.adjustedWeight} />
								</tbody>
							</table>
						</Col>
					</Row>
				);
			})}
		</div>
	);
};


export default AuditTab;
