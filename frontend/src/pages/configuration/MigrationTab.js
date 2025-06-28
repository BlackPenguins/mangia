import { useState } from 'react';
import { Button } from 'reactstrap';
import { useAuth } from '@blackpenguins/penguinore-common-ext';

const MigrationTab = () => {
	const authContext = useAuth();
	const tokenFromStorage = authContext.tokenFromStorage;

	const migrationHandler = async (migrationKeyword, setColor) => {
		console.log('Migrating', migrationKeyword);
		setColor('warning');
		const response = await fetch(`/api/migration`, {
			method: 'POST',
			body: JSON.stringify({ migrationKeyword }),
			headers: {
				// This is required. NodeJS server won't know how to read it without it.
				'Content-Type': 'application/json',
				Authorization: `Bearer ${tokenFromStorage}`,
			},
		});

		const data = await response.json();
		setColor(data.success ? 'success' : 'danger');
	};

	return (
		<div>
			<MigrationButton migrationHandler={migrationHandler} migrationKeyword="addPricingHistory" label="v2.1: Add PRICING_HISTORY" />
			<MigrationButton migrationHandler={migrationHandler} migrationKeyword="addReceipts" label="v2.1: Add RECEIPTS" />
			<MigrationButton migrationHandler={migrationHandler} migrationKeyword="addMatchedIngredients" label="v2.0: Add MatchedIngredients to MENU_DAY" />
			<MigrationButton migrationHandler={migrationHandler} migrationKeyword="addFridge" label="v2.0: Add Fridge" />
			<MigrationButton migrationHandler={migrationHandler} migrationKeyword="addDeptColor" label="v2.0: Add Dept Color" />
			<MigrationButton migrationHandler={migrationHandler} migrationKeyword="calculateMissingForIngredients" label="v1.10: Calculate IsMissingUnits for all Ingredients" />
			<MigrationButton migrationHandler={migrationHandler} migrationKeyword="addIsMissingUnits" label="v1.10: Add IsMissingUnits to RECIPE and SHOPPING_INGREDIENT_ITEM" />
			<MigrationButton migrationHandler={migrationHandler} migrationKeyword="addSuggestions" label="v1.9: Add SUGGESTIONS" />
			<MigrationButton migrationHandler={migrationHandler} migrationKeyword="addAuditColumns" label="v1.8: Add Audit Columns to MENU_DAY" />
			<MigrationButton migrationHandler={migrationHandler} migrationKeyword="addNewArrival" label="v1.8: Add IsNewArrival to RECIPE" />
			<MigrationButton migrationHandler={migrationHandler} migrationKeyword="moveThumbnails" label="v1.7: Move Thumbnails from RECIPE to THUMBNAILS" />
			<MigrationButton migrationHandler={migrationHandler} migrationKeyword="addThumbnails" label="v1.7: Add THUMBNAILS" />
			<MigrationButton migrationHandler={migrationHandler} migrationKeyword="nullDayForMenus" label="v1.6: Null Day for MENU_DAY" />
			<MigrationButton migrationHandler={migrationHandler} migrationKeyword="addShoppingListExtra" label="v1.5: Add SHOPPING_LIST_EXTRA Table" />
			<MigrationButton migrationHandler={migrationHandler} migrationKeyword="addPreviousLastMade" label="v1.4: Add PreviousLastMade" />
			<MigrationButton migrationHandler={migrationHandler} migrationKeyword="addPrepTime" label="v1.3: Add PrepTime" />
			<MigrationButton migrationHandler={migrationHandler} migrationKeyword="addPreheat" label="v1.3: Add Preheat" />
			<MigrationButton migrationHandler={migrationHandler} migrationKeyword="updateWeek" label="v1.3: Update Week" />
			<MigrationButton migrationHandler={migrationHandler} migrationKeyword="setWeekIDForAllMenuDays" label="v1.3: Set WeekID for all MENU_DAY" />
			<MigrationButton migrationHandler={migrationHandler} migrationKeyword="addDailyNotes" label="v1.3: Add DailyNotes" />
			<MigrationButton migrationHandler={migrationHandler} migrationKeyword="importFail" label="v1.3: Create ImportFailureURL" />
			<MigrationButton migrationHandler={migrationHandler} migrationKeyword="createStore" label="v1.2: Create Store" />
			<MigrationButton migrationHandler={migrationHandler} migrationKeyword="resizeImages" label="v1.1: Resize Images" />
		</div>
	);
};

const MigrationButton = ({ migrationHandler, migrationKeyword, label }) => {
	const [color, setColor] = useState('');

	return (
		<div className="migration-button">
			<Button className={`mangia-btn ${color}`} onClick={() => migrationHandler(migrationKeyword, setColor)}>
				{label}
			</Button>
		</div>
	);
};

export default MigrationTab;
