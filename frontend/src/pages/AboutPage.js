
import './AboutPage.scss';

const AboutPage = () => {
	return (
		<section className="hero">
			<div className="container">
				<div className="section-title">
					<h2>Change Log</h2>
				</div>
				<div className='change-log'>
					<h3>Version 2.3 (11/12/2025)</h3>
					<ul>
						<li>Added step groups</li>
						<li>Fixed import for existing recipe</li>
						<li>Fixed thumbnail download</li>
						<li>Import with step groups</li>
						<li>Added the wake lock (requires https to work)</li>
						<li>Added submit on enter for mobile inputs (enterKeyHint)</li>
						<li>Auto-focus on modal opens</li>
					</ul>
					<h3>Version 2.2 (11/11/2025)</h3>
					<ul>
						<li>Clicking config redirects to ingredients tab</li>
						<li>Checking list item updates the count</li>
						<li>Mobile has numeric pad for price inputs</li>
						<li>Hide recipe names that are skipped or leftovers in swap modal</li>
						<li>When switching categories re-search with the current keyword</li>
					</ul>
					<h3>Version 1.12</h3>
					<ul>
						<li>Improved importing of recipes</li>
						<li>Save the image of the recipe import</li>
						<li>Delete button for mobile</li>
						<li>Default category is All</li>
						<li>Add emojis to headers</li>
						<li>Added totals to shopping lists</li>
					</ul>
					<h3>Version 1.11</h3>
					<ul>
						<li>Added support for emojis in inputs</li>
						<li>Added wishlist to shopping list (red)</li>
						<li>Added recipe names to shopping list</li>
						<li>Added this About page</li>
						<li>Better mobile support of Fridge, Menu</li>
						<li>Bug Fix: Don't display blank notes in Details</li>
						<li>Keep the focus after entering a shopping item</li>
						<li>Use ENTER key to enter the shopping item</li>
						<li>Ability to edit shopping items</li>
					</ul>
				</div>

			</div>
		</section>
	);
};

export default AboutPage;
