import { useEffect, useState } from 'react';
import { Input } from 'reactstrap';

/**
 * allResults should always be an array of { id, name }
 */
const InputWithAutocomplete = ({ selectedValue, setSelectedValue, selectionHandler, label, id, allResults, showLabel }) => {
	const [filteredResults, setFilteredResults] = useState([]);
	const [resultSuggestionIndex, setResultSuggestionIndex] = useState(0);
	const [showSuggestions, setShowSuggestions] = useState(false);

	const filterResultsHandler = (searchString) => {
		if (!searchString.trim()) {
			// No value, show no results
			// We only want results the second we have a character to filter on
			setFilteredResults([]);
		} else {
			const lowercaseSearchString = searchString.toLowerCase();
			setFilteredResults(allResults.filter((result) => result.name.toLowerCase().indexOf(lowercaseSearchString) !== -1));
		}
	};

	const inputKeyDownHandler = (e) => {
		if (e.key === 'Enter' || e.key === 'done') {
			if (showSuggestions && filteredResults.length && resultSuggestionIndex > 0) {
				// Use the selected suggestion
				selectionHandler(filteredResults[resultSuggestionIndex - 1]);
			} else {
				// There is no result, use the exact value in the input
				selectionHandler({
					isNewValue: true,
					name: selectedValue
				}, true);
			}

			// Once we select something from dropodown, hide the suggestions until we type again
			setResultSuggestionIndex(0);
			setShowSuggestions(false);
		} else if (e.key === 'ArrowUp') {
			if (resultSuggestionIndex === 0) {
				// You cannot go above the first suggestion
				return;
			}
			setResultSuggestionIndex((prev) => prev - 1);
		} else if (e.key === 'ArrowDown') {
			if (resultSuggestionIndex === filteredResults.length) {
				// You can not go below the last suggestion
				return;
			}
			setResultSuggestionIndex((prev) => prev + 1);
		} else if (e.key === 'Escape') {
			setResultSuggestionIndex(0);
			setShowSuggestions(false);
		}
	};

	const onKeyDownHandler = (selectionIndex) => {
		selectionHandler(filteredResults[selectionIndex]);

		// Once we select something from dropodown, hide the suggestions until we type again
		setResultSuggestionIndex(0);
		setShowSuggestions(false);
	};

	const focusHandler = (e) => {
		e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
	};

	useEffect(() => {
		setFilteredResults([]);
	}, []);

	// form-floating is what puts the label in the left corner when focused
	// If you want to save padding, set showLabel to false
	return (
		<div className={showLabel ? "form-floating" : ""}>
			<Input
				enterKeyHint="done"
				className="editInput"
				autoComplete="off"
				id={id}
				type="text"
				placeholder={label}
				maxLength={50}
				onChange={(e) => {
					setSelectedValue(e.target.value); // The current value of the input
					filterResultsHandler(e.target.value); // Attempt to filter the results by current value
					setResultSuggestionIndex(0); // Each new character we reset the suggestion selected
					setShowSuggestions(true); // Show the suggestions once we start typing
				}}
				onKeyDown={inputKeyDownHandler}
				value={selectedValue}
				onFocus={focusHandler}
			></Input>
			{showLabel && <label htmlFor={id}>{label}</label>}

			{filteredResults.length > 0 && showSuggestions && (
				<ul className="suggestions">
					{filteredResults.map((result, index) => {
						const selectionIndex = index + 1;
						let className;

						if (selectionIndex === resultSuggestionIndex) {
							className = 'suggestion-active';
						}

						return (
							<li key={index} onClick={() => onKeyDownHandler(index)} selectionIndex={selectionIndex} className={className}>
								{result.name}
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
};

export default InputWithAutocomplete;
