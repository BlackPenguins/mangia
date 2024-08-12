import { useEffect, useState } from 'react';
import { Input } from 'reactstrap';

const InputWithAutocomplete = ({ fetchAvailableResults, selectedValue, setSelectedValue, onkeyDownHandler, label, id }) => {
	const [allResults, setAllResults] = useState([]);
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
			setFilteredResults(allResults.filter((result) => result.toLowerCase().indexOf(lowercaseSearchString) !== -1));
		}
	};

	const inputKeyDownHandler = (e) => {
		if (e.keyCode === 13) {
			// ENTER KEY
			if (showSuggestions && filteredResults.length) {
				// Use the selected suggestion
				onkeyDownHandler(filteredResults[resultSuggestionIndex]);
			} else {
				// There is no result, use the exact value in the input
				onkeyDownHandler(selectedValue);
			}

			// Once we select something from dropodown, hide the suggestions until we type again
			setResultSuggestionIndex(0);
			setShowSuggestions(false);
			fetchData();
		} else if (e.keyCode === 38) {
			// UP ARROW KEY
			if (resultSuggestionIndex === 0) {
				// You cannot go above the first suggestion
				return;
			}
			setResultSuggestionIndex((prev) => prev - 1);
		} else if (e.keyCode === 40) {
			// DOWN ARROW KEY
			if (resultSuggestionIndex - 1 === filteredResults.length) {
				// You can not go below the last suggestion
				return;
			}
			setResultSuggestionIndex((prev) => prev + 1);
		}
	};

	const fetchData = async () => {
		// Call the supplier function passed from the parent component to get all possible suggestions
		const newData = await fetchAvailableResults();
		setAllResults(newData);
	};

	useEffect(() => {
		fetchData();
		setFilteredResults([]);
	}, []);

	return (
		<div className="form-floating">
			<Input
				className="editInput"
				autoComplete="off"
				id={id}
				type="text"
				placeholder="Name"
				maxLength={50}
				onChange={(e) => {
					setSelectedValue(e.target.value); // The current value of the input
					filterResultsHandler(e.target.value); // Attempt to filter the results by current value
					setResultSuggestionIndex(0); // Each new character we reset the suggestion selected
					setShowSuggestions(true); // Show the suggestions once we start typing
				}}
				onKeyDown={inputKeyDownHandler}
				value={selectedValue}
			></Input>
			<label for={id}>{label}</label>

			{filteredResults.length > 0 && showSuggestions && (
				<ul className="suggestions">
					{filteredResults.map((result, index) => {
						let className;

						if (index === resultSuggestionIndex) {
							className = 'suggestion-active';
						}

						return (
							<li index={index} className={className}>
								{result}
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
};

export default InputWithAutocomplete;
