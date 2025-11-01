
import './AboutPage.scss';

const AboutPage = () => {
	return (
		<section className="hero">
			<div className="container">
				<div className="section-title">
					<h2>Change Log</h2>
				</div>
				<div className='change-log'>
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
