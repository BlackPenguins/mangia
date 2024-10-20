import { Col, Row } from 'reactstrap';
import ShoppingListExtraTableRow from './ShoppingListExtraTableRow';

const ShoppingListExtraTable = ({ shoppingListExtras, hideCheckedItems, tokenFromStorage }) => {
	return (
		<div className="container">
			<div className="shopping-list">
				<Row className="heading non-menu">
					<Col className="col" lg={12} sm={12} xs={12}>
						Non-Menu Items
					</Col>
				</Row>
				{shoppingListExtras &&
					shoppingListExtras.map((item) => {
						return <ShoppingListExtraTableRow item={item} hideCheckedItems={hideCheckedItems} tokenFromStorage={tokenFromStorage} />;
					})}
			</div>
		</div>
	);
};

export default ShoppingListExtraTable;
