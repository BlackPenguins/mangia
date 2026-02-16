
import { Button, Col, Input, Row } from 'reactstrap';

import './Receipts.scss';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import IngredientTagDropdown from 'pages/edit/IngredientTagDropdown';
import { Save } from 'react-feather';
import { Rotate90DegreesCwRounded } from '@mui/icons-material';
import { useToast } from 'context/toast-context';

const ReceiptDetails = () => {
	const params = useParams();
	const receiptID = params.receiptID;
	const showToast = useToast();

	const [stagedPricingData, setStagedPricingData] = useState(null);
	const [currentStoreID, setCurrentStoreID] = useState(0);
	const [stores, setStores] = useState([]);
	const [currentPricingData, setCurrentPricingData] = useState({});
	const [isScannedMode, setIsScannedMode] = useState(false);

	const stagePrice = useCallback( (receiptLineID, tagName, tagID, price, doShowToast = true) => {
		if(doShowToast){
			showToast('Pricing', `Staging price of ${tagName}`);
		}
		setStagedPricingData( (prevState) => ({
			...prevState,
			[receiptLineID]: {
				IngredientTagID: tagID,
				Price: price
			}
		}));
	}, [showToast]);

	const unStagePrice = (receiptLineID, tagName) => {
		showToast('Pricing', `Removing price of ${tagName}`);
		setStagedPricingData( (prevState) => {
			const newState = { ...prevState };
			delete newState[receiptLineID];

			return newState;
		})
	}

	const [receiptPackageBest, setReceiptPackageBest] = useState({
		processingType: "Original",
		imagePath: `${receiptID}`
	});

	const [receiptPackageAlternative, setReceiptPackageAlternative] = useState({
		processingType: "Post-Processed",
		imagePath: `processed/${receiptID}`
	});

	const saveHandler = useCallback(async () => {
		await fetch('/api/receipts/save', {
			body: JSON.stringify({ receiptID, pricingData: stagedPricingData, currentStoreID }),
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
		});
	}, [currentStoreID, stagedPricingData, receiptID]);

	const scanReceipts = useCallback(async () => {
		const response = await fetch('/api/receipts/scan', {
			body: JSON.stringify({receiptID }),
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
		});
		const data = await response.json();

		setReceiptPackageBest({...data.receiptPackageBest, processingType: "Best"});
		setReceiptPackageAlternative({...data.receiptPackageAlternative, processingType: "Alternative"});

		for( const obj of data.receiptPackageBest.receiptLines ) {
			if( obj.tagID ) {
				stagePrice(obj.receiptLineID, obj.tagName, obj.tagID, obj.price, false);
			}
		}
		for( const obj of data.receiptPackageAlternative.receiptLines ) {
			if( obj.tagID ) {
				stagePrice(obj.receiptLineID, obj.tagName, obj.tagID, obj.price, false);
			}
		}

		if( data.receiptPackageBest.store) {
			setCurrentStoreID(data.receiptPackageBest.store.StoreID);
		}

		if( data.receiptPackageAlternative.store) {
			setCurrentStoreID(data.receiptPackageBest.store.StoreID);
		}

		setIsScannedMode(true);

	}, [receiptID, stagePrice]);
	
	const scanHandler = () => {
		scanReceipts();
	};

	console.log("PRICER", stagedPricingData);
	
	const fetchStores = useCallback(async () => {
		const response = await fetch('/api/stores', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		});
		const data = await response.json();
		setStores(data);
	}, []);

	const fetchPricingData = useCallback(async () => {
		const response = await fetch(`/api/receipts/${receiptID}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		});
		const data = await response.json();
		const storeID = data.storeID;
		setCurrentPricingData(data);

		if( storeID ) {
			setCurrentStoreID(storeID);
		}
		console.log("DATA", data);
	}, [receiptID]);

	useEffect( () => {
		fetchStores()
		fetchPricingData();
	}, [fetchPricingData, fetchStores]);

	return (
		<section className="hero receipts">
			<div className="container">
				<div className="section-title">
					<h2>Pricing</h2>
				</div>
				Receipt #{receiptID}

				<div className={`form-floating`}>
					<Input
						id='store'
						type='select'
						onChange={(e) => {
							const val = e.target.value;  
							console.log("V", val);
							setCurrentStoreID(val);
						}}
						value={currentStoreID}
					>
						<option value={0}>Select</option>
						{stores && stores.map((s) => {
							return <option value={s.StoreID}>{s.Name}</option>;
						})}
					</Input>
					<label htmlFor='store'>Store</label>
				</div>
				{isScannedMode && (
					<>
						<ReceiptSection receiptPackage={receiptPackageBest} stagePrice={stagePrice} unStagePrice={unStagePrice} />
						<ReceiptSection receiptPackage={receiptPackageAlternative} stagePrice={stagePrice} unStagePrice={unStagePrice} />
					</>
				)}

				{!isScannedMode && (
					<ReceiptPreview receiptID={receiptID} currentPricingData={currentPricingData} />
				)}

				<div className="bottom-buttons">
					<Button className="mangia-btn muted" onClick={() => scanHandler()}>
						<Rotate90DegreesCwRounded /> Scan
					</Button>
					<Button id='saveButton' className="mangia-btn success" onClick={() => saveHandler()}>
						<Save /> Save
					</Button>
				</div>
			</div>
		</section>
	);
};

const ReceiptSection = ({receiptPackage, stagePrice, unStagePrice}) => {
	if( !receiptPackage ) {
		return <div>Loading {receiptPackage.processingType}...</div>;
	}

	console.log("AB", receiptPackage);
	const imagePath = receiptPackage.imagePath.replace("images/receipts/", "");
	const image = `http://${process.env.REACT_APP_HOST_NAME}:6200/receipts/${imagePath}`

	return (
		<>
			<h3>{receiptPackage.processingType}</h3>
		
			<Row className='receipt-section'>
				<Col lg={4}>
					{image && <img alt='receipt' src={image}/>}
					<div className='parsed-receipt'>
						<div className='title'>Parsed Text</div>
						{receiptPackage.textLines && receiptPackage.textLines.map((t) => {
							return <div>{t}</div>
						})}
					</div>
				</Col>
				<Col lg={8}>
					<div className='store-line'>
						{receiptPackage.store?.Name || "Unknown Store"}
					</div>
					{receiptPackage.receiptLines && receiptPackage.receiptLines.map((t) => (
						<ReceiptLine t={t} stagePrice={stagePrice} unStagePrice={unStagePrice} />
					))}
				</Col>
			</Row>
		</>
	)
}

//NEXT: create an edit and preview of the page
// clean up the default view of the ing tags



const ReceiptPreview = ({receiptID, currentPricingData}) => {
	if( !currentPricingData ) {
		return <div>Loading...</div>;
	}
	const image = `http://${process.env.REACT_APP_HOST_NAME}:6200/receipts/${receiptID}`
	const imageProcessed = `http://${process.env.REACT_APP_HOST_NAME}:6200/receipts/processed/${receiptID}`

	return (
		<Row className='receipt-section'>
			<Col lg={4}>
				{image && <img alt='receipt' src={image}/>}
			</Col>

			<Col lg={4}>
				{image && <img alt='receipt' src={imageProcessed}/>}
			</Col>

			<Col lg={4}>
				{currentPricingData?.pricingHistory?.map((t) => (
					<div>{t.Name} {t.Price}</div>
				))}
			</Col>
		</Row>
	)
}

const ReceiptLine = ( { t, stagePrice, unStagePrice }) => {
	const [tagName, setTagName] = useState(t.tagName);
	const [tagID, setTagID] = useState(t.tagID);
	const [price, setPrice] = useState(t.price);

	const updateHandler = (value) => {
		stagePrice(t.receiptLineID, value.name, value.id, t.price)
		console.log("VALUE", value);
		setTagName(value.name);
		setTagID(value.id);
	}

	const removeHandler = (value) => {
		unStagePrice(t.receiptLineID, tagName);
		console.log("VALUE", value);
		setTagName(null);
		setTagID(null);
	}

	return (
		<Row>
			<Col lg={7}>
				<div className='ingredient-line receipt-cell'>
					<span>{t.text}</span>
				</div>
			</Col>
			<Col lg={3}>
				<div className='receipt-cell'>
					<IngredientTagDropdown 
						currentTagID={tagID}
						tagName={tagName}
						removeTagHandler={removeHandler}
						ingredientTagUpdateHandler={updateHandler}
						showLabel={false}
					/>
				</div>
			</Col>
			<Col lg={2}>
				<div className='receipt-cell'>
					<Input
						type='text'
						onChange={setPrice}
						value={price}
					/>
				</div>
			</Col>
		</Row>
	);
}

export default ReceiptDetails;
