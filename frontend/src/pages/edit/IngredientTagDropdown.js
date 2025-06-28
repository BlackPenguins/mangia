import { useState } from 'react';

import './RecipeEditPage.scss';
import { TagBox } from '../../components/EditRecipes/Tag';
import InputWithAutocomplete from '../../components/EditRecipes/InputWithAutocomplete';
import useFetchTags, { clearTagCache } from './useFetchTags';

const IngredientTagDropdown = ({ currentTagID, tagName, removeTagHandler, ingredientTagUpdateHandler, excludedTagIDs, showLabel = true}) => {

	const [selectedValue, setSelectedValue] = useState('');
    const allResults = useFetchTags(excludedTagIDs);
	const setTagHandler = async (value) => {
        await ingredientTagUpdateHandler(value);
		setSelectedValue('');
		if( value.isNewValue ) {
			clearTagCache();
		}
	};

	if (tagName) {
		return (
            <TagBox type="ingredient" tag={{ Name: tagName, TagID: currentTagID }} removeTagHandler={removeTagHandler} />
		);
	} else {
		const tags = allResults && allResults.map( (r) => {
			return {
				id: r.IngredientTagID,
				name: r.Name,
			}
		});

		return (
			<InputWithAutocomplete
				id="ingredient-tag"
				label="Search Tag"
				showLabel={showLabel}
				allResults={tags}
				selectedValue={selectedValue}
				setSelectedValue={setSelectedValue}
				selectionHandler={(value) => setTagHandler(value)}
			/>
		);
	}
};

export default IngredientTagDropdown;