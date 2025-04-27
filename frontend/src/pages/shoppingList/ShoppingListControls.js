import { FormGroup, Input, Label } from 'reactstrap';

const ShoppingListControls = ({ showCheckedItems, setShowCheckedItems, showPrices, setShowPrices }) => {
	return (
		<span className="hide-checked-items">
			<FormGroup switch>
				<Input
					type="switch"
					checked={showCheckedItems}
					onChange={() => {
						setShowCheckedItems(!showCheckedItems);
					}}
				/>
				<Label check>Show Checked Items</Label>
			</FormGroup>
			<FormGroup switch>
				<Input
					type="switch"
					checked={showPrices}
					onChange={() => {
						setShowPrices(!showPrices);
					}}
				/>
				<Label check>Show Prices</Label>
			</FormGroup>
		</span>
	);
};

export default ShoppingListControls;
