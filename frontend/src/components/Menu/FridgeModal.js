import { useAuth, useBetterModal } from '@blackpenguins/penguinore-common-ext';
import { TagBox } from 'components/EditRecipes/Tag';
import IngredientTagDropdown from 'pages/edit/IngredientTagDropdown';
import { useCallback, useEffect, useState } from 'react';
import { Button, Col, Row } from 'reactstrap';
import './FridgeModal.scss';
import { Kitchen } from '@mui/icons-material';

const FridgeModal = () => {
    const [fridgeItems, setFridgeItems] = useState([]);
    const [excludedTagIDs, setExcludedTagsIDs] = useState([]);
	const authContext = useAuth();
	const tokenFromStorage = authContext.tokenFromStorage;

    const fetchFridge = useCallback(async () => {
        const response = await fetch(`/api/fridge`);
        const data = await response.json();
        setFridgeItems(data);
        setExcludedTagsIDs(data.map(f => f.IngredientTagID));
        console.log("F", data)
    }, []);

    useEffect(() => {
        fetchFridge();
    }, [fetchFridge]);

    const updateFridgeHandler = async (value) => {
		const response = await fetch(`/api/fridge`, {
			method: 'PUT',
			body: JSON.stringify(value),
			headers: {
				// This is required. NodeJS server won't know how to read it without it.
				'Content-Type': 'application/json',
				Authorization: `Bearer ${tokenFromStorage}`,
			},
		});

		const data = await response.json();

		if (data.success) {
			console.log('Fridge tag added.', data);
            fetchFridge();
		}
	};

    const removeFromFridgeHandler = async (fridgeID) => {
		const response = await fetch(`/api/fridge/${fridgeID}`, {
			method: 'DELETE',
			headers: {
				// This is required. NodeJS server won't know how to read it without it.
				'Content-Type': 'application/json',
				Authorization: `Bearer ${tokenFromStorage}`,
			},
		});

		const data = await response.json();

		if (data.success) {
			console.log('Fridge tag delete.', data);
            fetchFridge();
		}
	};

    const ingredientTagUpdateHandler = (value) => {
        updateFridgeHandler(value);
    }

    const { modal, openModal } = useBetterModal({
        title: 'The Fridge',
        size: 'lg',
        content: (closeModal) => {
            return (
                <>
                    <IngredientTagDropdown
                        ingredientTagUpdateHandler={ingredientTagUpdateHandler} 
                        excludedTagIDs={excludedTagIDs}
                    />
                    <div className='fridge-section'>
                        <Row>
                            {fridgeItems && fridgeItems.map( (fridgeItem) => {
                                return (
                                    <Col key={fridgeItem.FridgeID} lg={4}>
                                        <TagBox
                                            type="fridge"
                                            tag={{ Name: fridgeItem.IngredientName, TagID: fridgeItem.FridgeID }}
                                            removeTagHandler={removeFromFridgeHandler}
                                            tagColor={fridgeItem.DeptColor || "#950a0a"}
                                        />
                                    </Col>
                                );
                            })}
                        </Row>
                    </div>
                </>
            );
        },
    });

    return (
        <>
            <Button onClick={openModal} className="mangia-btn info">
                <Kitchen/> <span className='non-mobile'>Fridge</span>
            </Button>
            {modal}
        </>
    )
}

export default FridgeModal;