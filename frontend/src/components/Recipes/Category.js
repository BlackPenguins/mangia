import { Input } from 'reactstrap';
import './Category.css';

const Category = ({ category, setCategory }) => {
	if (setCategory) {
		return (
			<div className="form-floating">
				<Input
					className="edit-category-dropdown"
					type="select"
					onChange={(e) => {
						setCategory(e.target.value);
					}}
					value={category}
				>
					<option className="none" value="None">
						None
					</option>
					<option className="dinner" value="Dinner">
						Dinner
					</option>
					<option className="sidedish" value="Sidedish">
						Sidedish
					</option>
					<option className="appetizer" value="Appetizer">
						Appetizer
					</option>
					<option className="dessert" value="Dessert">
						Dessert
					</option>
				</Input>
				<label for="edit-category-dropdown">Category</label>
			</div>
			// <Input
			// 	id="recipe-category"
			// 	className="mb-3"
			// 	style={{ width: 'auto' }}
			// 	type="text"
			// 	placeholder="Category"
			// 	onChange={(e) => {
			// 		setCategory(e.target.value);
			// 	}}
			// 	value={category}
			// />
		);
	} else {
		let categoryClass = 'none';
		let categoryLabel = 'None';

		if (category) {
			categoryClass = category.toLowerCase();
			categoryLabel = category;
		}
		return <span className={`v-status ${categoryClass}`}>{categoryLabel}</span>;
	}
};

export default Category;
