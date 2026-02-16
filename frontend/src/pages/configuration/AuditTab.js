import { BeforeAfter, MatchedIngredients } from 'components/Menu/MenuSection';
import RecipeRow from 'components/Recipes/RecipeRow';
import { useCallback, useEffect, useState } from 'react';
import { Col, Row, Button } from 'reactstrap';
import './AuditTab.scss';
import { DaysAgo } from 'components/Recipes/RecipeCard';

const AuditTab = () => {
	const [recipeIDs, setRecipeIDs] = useState(null);

	const fetchAuditTest = useCallback(async () => {
		const response = await fetch('/api/menu/audit/test', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		});
		const data = await response.json();
		const recipes = data.pickedRecipes;
		setRecipeIDs(recipes.map((s) => s.RecipeID));
	}, []);
	
	useEffect(() => {
		fetchAuditTest();
	}, [fetchAuditTest]);

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
		fetchAuditTest();
	}, [fetchAudit]);


	return (
		<>
			<div className="container audit-list quick-audit-list">
				<Button
					className="mangia-btn muted"
					onClick={() => fetchAuditTest()}
				>
					Test Audit
				</Button>
				
				<Row>
					{weightedRecipes?.map((recipe) => {
						const classes = [];

						if( recipeIDs && recipeIDs.includes(recipe.RecipeID)) {
							classes.push("picked");
						}

						return (
							<Col className={classes.join(' ')} lg={1}>{recipe.adjustedWeight}</Col>
						);
					})}
				</Row>
			</div>

			<div className="container audit-list">
				<Row>
					
					<Col lg={6}>Name</Col>
					<Col lg={1}>Factors</Col>
					<Col lg={2}>&nbsp;</Col>
					<Col lg={2}>Weight</Col>
				</Row>

				{weightedRecipes?.map((recipe) => {

					console.log("rec", recipe)
					const classes = [];

					if( recipeIDs && recipeIDs.includes(recipe.RecipeID)) {
						classes.push("picked");
					} else if( recipe.lastmade === null ) {
						classes.push("never-made");
					} else if( recipe.IsNewArrival ) {
						classes.push("new-arrival");
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
		</>
	);
};


export default AuditTab;
