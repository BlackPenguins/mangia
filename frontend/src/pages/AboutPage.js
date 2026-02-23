
import './AboutPage.scss';

export const LATEST_VERSION = "2.6";
export const LATEST_VERSION_DATE = "Feb 15, 2026";

const AboutPage = () => {
	return (
		<section className="hero">
			<div className="container">
				<div className="section-title">
					<h2>Change Log</h2>
				</div>
				<div className='change-log'>
					<h3>Version 2.7 (2/22/2026)</h3>
					<ul>
						<li>Fixed broken histories with no single dates or weeks</li>
						<li>Include "None" category in Uncategorized filter</li>
						<li>Don't show blank histories</li>
						<li>Add support for ¾ amount</li>
						<li>Handle a menu item that has their recipe deleted - don't hide the entire day in the menu</li>
						<li>Paginated ingredients page to 20 results per page</li>
						<li>Added support for webp thumbnails</li>
					</ul>

					<h3>Version 2.6 (2/15/2026)</h3>
					<ul>
						<li>Display number of linked recipes to delete button of ingredient tags</li>
						<li>Show the history of extra items as the "Week of..."</li>
						<li>Added Audit test board</li>
						<li>Tweaked algorithm weights from 1.4 to 10 for aged recipes</li>
						<li>Added uncategorized category</li>
						<li>Marked Uncategorized red in preview and edit pages</li>
						
					</ul>

					<h3>Version 2.5 (2/8/2026)</h3>
					<ul>
						<li>Fixed images from imported recipes not being the primary image</li>
						<li>Added thumbnails to the Audit tab</li>
						<li>Fixed thumbnails not updating in menu or page changes</li>
						<li>Aligned the thumbnails with no-thumb in the recipe lists</li>
						
					</ul>
					<h3>Version 2.4 (12/30/2025)</h3>
					<ul>
						<li>Add support for "c." for cups</li>
						<li>Clickable thumbnail</li>
						<li>Fix trim bug with recipe search</li>
						<li>Divided up the primary thumbnail (low-res) vs the other thumbnails (hi-res)</li>
						
					</ul>
					<h3>Version 2.3 (11/25/2025)</h3>
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
