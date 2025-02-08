import { FormGroup, Input, Label } from 'reactstrap';

const ShoppingListControls = ({ showCheckedItems, setShowCheckedItems, showPrices, setShowPrices }) => {
	return (
		<span class="hide-checked-items">
			<FormGroup switch>
				<Input
					type="switch"
					checked={showCheckedItems}
					onClick={() => {
						setShowCheckedItems(!showCheckedItems);
					}}
				/>
				<Label check>Show Checked Items</Label>
			</FormGroup>
			<FormGroup switch>
				<Input
					type="switch"
					checked={showPrices}
					onClick={() => {
						setShowPrices(!showPrices);
					}}
				/>
				<Label check>Show Prices</Label>
			</FormGroup>
		</span>
	);
};

export default ShoppingListControls;
