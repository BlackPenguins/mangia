import { FormGroup, Input, Label } from 'reactstrap';

const ShoppingListControls = ({ hideCheckedItems, setHideCheckedItems, hidePrices, setHidePrices }) => {
	return (
		<span class="hide-checked-items">
			<FormGroup switch>
				<Input
					type="switch"
					checked={hideCheckedItems}
					onClick={() => {
						setHideCheckedItems(!hideCheckedItems);
					}}
				/>
				<Label check>Hide Checked Items</Label>
			</FormGroup>
			<FormGroup switch>
				<Input
					type="switch"
					checked={hidePrices}
					onClick={() => {
						setHidePrices(!hidePrices);
					}}
				/>
				<Label check>Hide Prices</Label>
			</FormGroup>
		</span>
	);
};

export default ShoppingListControls;
