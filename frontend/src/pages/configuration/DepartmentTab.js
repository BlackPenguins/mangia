import { useState } from 'react';
import { Input, Row, Col } from 'reactstrap';
import BasicEditPanel from './BasicEditPanel';
import { useAuth } from '@blackpenguins/penguinore-common-ext';

const DepartmentTab = () => {
	return (
		<BasicEditPanel
			label="Departments"
			apiFetch="/api/ingredientDepartments"
			apiInsert="/api/ingredientDepartments"
			apiUpdate="/api/ingredientDepartments"
			idColumn="IngredientDepartmentID"
			AdditionalOption={ExtraControls}
		/>
	);
};

const ExtraControls = ( {element}) => {
	return (
		<Row>
			<Col lg={6}>
				<PositionInput element={element}/>
			</Col>
			<Col lg={6}>
				<ColorInput
					element={element}
					patchURL='/api/ingredientDepartments'
					id={element.IngredientDepartmentID}
					color={element.Color}
					colorColumnName='color'
					label='Color'
				/>
			</Col>
		</Row>
	)
}
export const ColorInput = ({patchURL, id, color, colorColumnName, label}) => {
	const authContext = useAuth();
	const tokenFromStorage = authContext.tokenFromStorage;

	const [newColor, setNewColor] = useState(color || "#000000");

	const changeColor = async () => {
		const payload = { id };
		payload[colorColumnName] = newColor;
		
		await fetch(patchURL, {
			method: 'PATCH',
			body: JSON.stringify(payload),
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${tokenFromStorage}`,
			},
		});
	};

	const updateColor = (option) => {
		setNewColor(option);
	};

	return (
		<span className="form-floating">
			<Input
				type="color"
				onChange={(e) => {
					updateColor(e.target.value);
				}}
				onBlur={(e) => {
					changeColor();
				}}
				value={newColor}
			/>
			<label htmlFor="edit-book-dropdown">{label}</label>
		</span>
		
	)
}
const PositionInput = ({ element }) => {
	const authContext = useAuth();
	const tokenFromStorage = authContext.tokenFromStorage;

	const changePosition = async (option) => {
		await fetch('/api/ingredientDepartments', {
			method: 'PATCH',
			body: JSON.stringify({ id: element.IngredientDepartmentID, position: option }),
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${tokenFromStorage}`,
			},
		});
	};

	const [position, setPosition] = useState(element.Position || 0);

	const updatePosition = (option) => {
		setPosition(option);
		changePosition(option);
	};

	return (
		<span className="form-floating">
			<Input
				className="edit-book-dropdown"
				type="number"
				onChange={(e) => {
					updatePosition(e.target.value);
				}}
				value={position}
			/>
			<label htmlFor="edit-book-dropdown">Position</label>
		</span>
	);
};

export default DepartmentTab;
