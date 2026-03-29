import { useCallback, useEffect, useState } from "react";
import ShoppingListExtraTable from "./ShoppingListExtraTable";
import { useAuth } from '@blackpenguins/penguinore-common-ext';

const ShoppingListExtra = ( {showCheckedItems} ) => {
    const authContext = useAuth();
    const tokenFromStorage = authContext.tokenFromStorage;

    const [shoppingListExtrasNonMenu, setShoppingListExtrasNonMenu] = useState(null);
    const [shoppingListExtrasWishlist, setShoppingListExtrasWishlist] = useState(null);

    const fetchShoppingListExtras = useCallback(async (isWishlist, updateState) => {
        const response = await fetch(`/api/shoppingListExtra?isWishlist=${isWishlist}`, {
            method: 'GET',
            headers: {
                // This is required. NodeJS server won't know how to read it without it.
                'Content-Type': 'application/json',
                Authorization: `Bearer ${tokenFromStorage}`,
            },
        });
        const data = await response.json();
        const arr = data.result;
        updateState(arr);
    }, [tokenFromStorage]);
    
    const fetchShoppingListExtrasNonMenu = useCallback(async () => {
        await fetchShoppingListExtras(false, setShoppingListExtrasNonMenu )
    }, [fetchShoppingListExtras])

    const fetchShoppingListExtrasWishlist = useCallback(async () => {
        await fetchShoppingListExtras(true,  setShoppingListExtrasWishlist)
    }, [fetchShoppingListExtras])

    useEffect( () => {
        fetchShoppingListExtrasNonMenu();
        fetchShoppingListExtrasWishlist();
    }, [fetchShoppingListExtras, fetchShoppingListExtrasNonMenu, fetchShoppingListExtrasWishlist]);

    const handleSwapButton = async (id) => {
		await fetch(`/api/shoppingListExtra/swap`, {
			method: 'POST',
			body: JSON.stringify({ shoppingListExtraID: id }),
			headers: {
				// This is required. NodeJS server won't know how to read it without it.
				'Content-Type': 'application/json',
				Authorization: `Bearer ${tokenFromStorage}`,
			},
		});
		fetchShoppingListExtrasNonMenu();
		fetchShoppingListExtrasWishlist();
	}

    return (
        <>
            <ShoppingListExtraTable rows={shoppingListExtrasNonMenu} showCheckedItems={showCheckedItems} isWishlist={false} fetch={fetchShoppingListExtrasNonMenu} handleSwapButton={handleSwapButton}/>
            <ShoppingListExtraTable rows={shoppingListExtrasWishlist} showCheckedItems={showCheckedItems} isWishlist={true} fetch={fetchShoppingListExtrasWishlist} handleSwapButton={handleSwapButton}/>
        </>
    )
};

export default ShoppingListExtra;