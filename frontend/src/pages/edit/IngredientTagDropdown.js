import { useCallback, useEffect, useState } from 'react';

import './RecipeEditPage.scss';
import { TagBox } from '../../components/EditRecipes/Tag';
import InputWithAutocomplete from '../../components/EditRecipes/InputWithAutocomplete';

const IngredientTagDropdown = ({ currentTagID, tagName, removeTagHandler, ingredientTagUpdateHandler, excludedTagIDs = [] }) => {
	const [selectedValue, setSelectedValue] = useState('');
    const [allResults, setAllResults] = useState([]);

	const setTagHandler = async (value) => {
        await ingredientTagUpdateHandler(value);
		setSelectedValue('');
	};

	const fetchAllTags = useCallback( async () => {
		const response = await fetch('/api/ingredientTags', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		});
		const data = await response.json();
		let ingredients = data.ingredientsWithPrices;

        ingredients = ingredients.filter( t => !excludedTagIDs.includes(t.IngredientTagID) )
        setAllResults(ingredients.map((d) => d.Name));
	}, [excludedTagIDs]);

    useEffect( () => {
        fetchAllTags()
    }, [excludedTagIDs, fetchAllTags]);

	if (tagName) {
		return (
            <TagBox type="ingredient" tag={{ Name: tagName, TagID: currentTagID }} removeTagHandler={removeTagHandler} />
		);
	} else {
		return (
			<InputWithAutocomplete
				id="ingredient-tag"
				label="Search Tag"
				allResults={allResults}
                setAllResults={setAllResults}
				selectedValue={selectedValue}
				setSelectedValue={setSelectedValue}
				onkeyDownHandler={(value) => setTagHandler(value)}
			/>
		);
	}
};

export default IngredientTagDropdown;