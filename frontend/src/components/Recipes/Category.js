import { Input } from 'reactstrap';

const Category = ({ category, setCategory }) => {
	return (
		<div className="form-floating">
			<Input
				id="edit-category-dropdown"
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
			<label htmlFor="edit-category-dropdown">Category</label>
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
};

export default Category;
