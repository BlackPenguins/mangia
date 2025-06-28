
/**
 * Hook that centralizes and caches the fetching of the tags so its done once
 */
import { useEffect, useMemo, useState } from "react";

// Not a state, so its shared across all of JS (a cache)
let tagCache = null;
let fetchPromise = null;

export const clearTagCache = () => {
    tagCache = null;
    fetchPromise = null;
}

const useFetchTags = (excludedTagIDs) => {
    // An inline excludedTagIDs = [], will cause infinite re-renders because on each re-render the array is initailized to a different
    // blank array, causing the useEffect, causing the re-render, etc forever
	const memoizedExcludedTagIDs = useMemo( () => excludedTagIDs || [], [excludedTagIDs]);

    // The state links up to the global cache first
    // Sure we are creating 20 different states still for each dropdown, but the fetch happens only once
	const [tags, setTags] = useState(tagCache);

	useEffect(() => {
		if( tagCache ) {
            // The cache already has the tags, use that
			return;
		}

		const getFilteredTags = (data) =>  {
			let ingredients = data.ingredientsWithPrices;

			return ingredients
				.filter( t => !memoizedExcludedTagIDs.includes(t.IngredientTagID) );
		};

		if( !fetchPromise ) {
			console.log("Fetching tags - first time")
			fetchPromise = fetch('/api/ingredientTags', {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
			})
			.then( res => res.json() )
			.then( data => { 
				const filteredData = getFilteredTags(data);
                // Cache the results
				tagCache = filteredData;
                
				setTags(filteredData);

                // Store the data inside the promise, so the catched promise below will have the data populated
                return data;
			});
		} else {
			// A promise is already cached, the promise is in progress fetching the tags
            // Just use whatever that promise returns above
			fetchPromise.then(data => {
                setTags(getFilteredTags(data))
            });
		}
	}, [memoizedExcludedTagIDs])

	return tags;
}

export default useFetchTags;