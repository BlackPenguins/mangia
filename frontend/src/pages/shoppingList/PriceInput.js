import { useToast } from 'context/toast-context';
import { useEffect, useState } from 'react';
import { Col, Input } from 'reactstrap';
import { useAuth } from '@blackpenguins/penguinore-common-ext';

const STORE_PRICES_WIDTH = 4;

const MOBILE_STORE_PRICES_WIDTH = 4;

export const PriceInput = ({ ingredientTagID, prices, store, tokenFromStorage }) => {
	const authContext = useAuth();
	const [price, setPrice] = useState(null);
	const [isLowest, setIsLowest] = useState(false);
	const [ingredientTagPriceID, setIngredientTagPriceID] = useState(null);

	useEffect(() => {
		const priceForStore = prices.find((p) => p.storeID === store.storeID);

		if (priceForStore) {
			setPrice(priceForStore.price.toFixed(2));
			setIngredientTagPriceID(priceForStore.ingredientTagPriceID);
			setIsLowest(priceForStore?.isLowest);
		}
	}, [prices, store]);

	const updatePrice = async (price) => {
		const body = {
			Price: price,
			IngredientTagPriceID: ingredientTagPriceID,
		};

		console.log('PR', body);
		await fetch(`/api/stores/prices`, {
			method: 'PATCH',
			body: JSON.stringify(body),
			headers: {
				// This is required. NodeJS server won't know how to read it without it.
				'Content-Type': 'application/json',
				Authorization: `Bearer ${tokenFromStorage}`,
			},
		});
	};

	const insertPrice = async (price) => {
		const body = {
			Price: price,
			StoreID: store.storeID,
			IngredientTagID: ingredientTagID,
		};

		console.log('Inserting price', body);
		const response = await fetch(`/api/stores/prices`, {
			method: 'PUT',
			body: JSON.stringify(body),
			headers: {
				// This is required. NodeJS server won't know how to read it without it.
				'Content-Type': 'application/json',
				Authorization: `Bearer ${tokenFromStorage}`,
			},
		});

		const data = await response.json();
		setIngredientTagPriceID(data.ingredientTagPriceID);
	};

	const showToast = useToast();

	const priceHandler = () => {
		if( !authContext.isAdmin ) {
			return;
		}

		if (ingredientTagPriceID === null) {
			insertPrice(price);
		} else {
			updatePrice(price);
		}
		showToast('Shopping List', `Price updated for ${store.storeName}`);
	};

	const classes = [];

	if (isLowest) {
		classes.push('lowest-price');
	}

	return (
		<Col className={classes.join(' ')} lg={STORE_PRICES_WIDTH} sm={MOBILE_STORE_PRICES_WIDTH} xs={MOBILE_STORE_PRICES_WIDTH}>
			<div className="form-floating store-price">
				<Input
					type="text"
					id="store-name"
					value={price}
					disabled={!authContext.isAdmin}
					onChange={(e) => {
						setPrice(e.target.value);
					}}
					onBlur={(e) => {
						priceHandler(e.target.value);
					}}
				/>
				<label htmlFor="store-name">{store.storeName}</label>
			</div>
		</Col>
	);
};

export default PriceInput;
