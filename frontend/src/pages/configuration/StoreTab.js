import { Col, Row } from 'reactstrap';
import BasicEditPanel from './BasicEditPanel';
import { ColorInput } from './DepartmentTab';

const StoreTab = () => {
	
	return <BasicEditPanel label="Stores" apiFetch="/api/stores" apiInsert="/api/stores" apiUpdate="/api/stores" idColumn="StoreID" 
			AdditionalOption={ExtraControls} />;
};

const ExtraControls = ( {element}) => {
	return (
		<Row>
			<Col lg={6}>
				<ColorInput
					element={element}
					patchURL='/api/stores'
					id={element.StoreID}
					color={element.Color}
					colorColumnName='color'
					label='Primary Color'
				/>
			</Col>
			<Col lg={6}>
				<ColorInput
					element={element}
					patchURL='/api/stores'
					id={element.StoreID}
					color={element.Color2}
					colorColumnName='color2'
					label='Secondary Color'
				/>
			</Col>
		</Row>
	)
}

export default StoreTab;
