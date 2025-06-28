import express from 'express';
import multer from 'multer';
import { checkAdminMiddleware } from './auth.js';
import fs from 'fs';
import { insertReceipt, selectAllReceipts, selectReceipt, updateReceiptProcessed, updateReceiptStore } from '#root/database/receipts.js';
import Tesseract, { createWorker } from 'tesseract.js';
import sharp from 'sharp';
import path from 'path';
import { selectIngredientTagByReceiptLineMatch } from '#root/database/ingredientTags.js';
import { selectStoreByName } from '#root/database/store.js';
import { deletePricingHistory, insertPricingHistory, selectAllPricingHistory } from '#root/database/pricingHistory.js';

const receiptsStorageEngine = multer.diskStorage({
    destination: (req, file, callback) => {
        const directory = `./images/receipts`;
        if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory, { recursive: true });
        }

        callback(null, directory);
    },
    filename: async (req, file, callback) => {
        const newReceipt = await insertReceipt();
        const receiptID = newReceipt.id;
        // const originalExt = file.originalname.substring(file.originalname.lastIndexOf('.'));
        
        callback(null, `${receiptID}`);
    },
});

const uploadReceipts = multer({ storage: receiptsStorageEngine, limits: { fileSize: 25 * 1024 * 1024 } });

const getAllReceiptsHandler = (req, res) => {
    const selectPromise = selectAllReceipts();

    selectPromise.then(
        (result) => {
            res.status(200).json(result);
        },
        (error) => {
            res.status(500).json({ message: error });
        }
    );
};

const getReceiptHandler = (req, res) => {
    const receiptID = req.params.receiptID;

    const selectPromise = selectReceipt(receiptID);

    selectPromise.then(
        async (result) => {
            const storeID = result[0].StoreID;
            const pricingHistory = await selectAllPricingHistory(receiptID);
            
            res.status(200).json({
                pricingHistory,
                storeID
            });
        },
        (error) => {
            res.status(500).json({ message: error });
        }
    );
};


const extractInformationFromReceipt = async (receiptID) => {
    console.log("Extracting receipt information..." );

	const inputDirectory = `./images/receipts/`;
    const inputPath = `${inputDirectory}${receiptID}`;

    const receiptPackage = await scanAndAnalyzeReceipt(inputPath);

    const inputPathPostProcessed = await createPostProcessedImage(inputPath);
    const receiptPackagePostProcessed = await scanAndAnalyzeReceipt(inputPathPostProcessed);

    return { receiptPackage, receiptPackagePostProcessed };
};

const scanAndAnalyzeReceipt = async (inputPath) => {
    console.log(`Analyzing receipt image [${inputPath}]`);
    let receiptPackage = {
        matchesFound : 0,
        textLines: [],
        receiptLines: [],
        store: null,
        imagePath: inputPath
    };

    let progress = 0;

    const worker = await createWorker('eng', 1, {
		// logger: (m) => {
		// 	if (m.status === 'recognizing text ') {
		// 		progress = m.progress;
		// 	}
		// 	console.log("LINE: ", m);
		// },
	});
    const {
		data: { text },
	} = await worker.recognize(inputPath);

    const textLines = text.split("\n");
    receiptPackage.textLines = textLines;

    await analyzeReceiptLines(receiptPackage);
    await applyIngredientTags(receiptPackage);
    
    return receiptPackage;
}

const createPostProcessedImage = async (inputPath) => {
    console.log( "Creating a post-processed image..." );
    const processedDirectory = './images/receipts/processed';
    const filename = inputPath.substring( inputPath.lastIndexOf("/") + 1);
  	const outputPath = path.join(processedDirectory, filename);

    console.log( `Output image [${outputPath}]` );

    if (!fs.existsSync(processedDirectory)) {
        fs.mkdirSync(processedDirectory, { recursive: true });
    }

	try {
        await sharp(inputPath)
		  .grayscale()
		//   .resize({ width: 1000 }) // Smaller than the image
		  .threshold(110) // Makes it more b/w, no greys
		//   .sharpen()
		  .toFile(outputPath);
	
    } catch (err) {
		console.error('Image processing failed:', err);
		res.status(500).send('Failed to process image');
    }

    return outputPath;
}


const applyIngredientTags = async (receiptPackage) => {
    console.log( "Applying ingredient tags..." );
    for( const receiptLine of receiptPackage.receiptLines) {

        const foundTagResults = await selectIngredientTagByReceiptLineMatch(receiptLine.text);
    
        if (foundTagResults.length > 0) {
            const tagID = foundTagResults[0].IngredientTagID;
            const name = foundTagResults[0].Name;
            receiptLine.tagID = tagID,
            receiptLine.tagName = name;
            receiptPackage.matchesFound++;
        }
    }
}

const saveReceiptHandler = async (req, res) => {
    const pricingData =  req.body.pricingData;
    const receiptID =  req.body.receiptID;
    const storeID =  req.body.currentStoreID;

    if( pricingData ) {
        await deletePricingHistory( receiptID );

        for( const id in pricingData ) {
            const obj = pricingData[id];
            await insertPricingHistory(receiptID, obj.Price, obj.IngredientTagID);
        }

        await updateReceiptProcessed(receiptID);
    }

    if( storeID ) {
        await updateReceiptStore(receiptID, storeID);
    }

    res.status(200).json({success: true });
}

const scanReceiptHandler = async (req, res) => {
    const receiptID =  req.body.receiptID;
    const { receiptPackage, receiptPackagePostProcessed } = await extractInformationFromReceipt(receiptID);

    const originalIsBest = receiptPackage.matchesFound > receiptPackagePostProcessed.matchesFound;

    let receiptPackageBest = originalIsBest ? receiptPackage : receiptPackagePostProcessed;
    let receiptPackageAlternative = originalIsBest ? receiptPackagePostProcessed : receiptPackage;

    const usedTagIDs = receiptPackageBest.receiptLines
            .filter((r) => r.tagID)
            .flatMap( (r) => r.tagID);

    // Remove the duplicates from the alternatives
    for( const obj of receiptPackageAlternative.receiptLines ) {
        if( usedTagIDs.includes(obj.tagID)) {
            delete obj.tagID;
            delete obj.tagName;
        }
    }

    let id = 1;
    for( const obj of receiptPackageBest.receiptLines ) {
        obj.receiptLineID = id++;
    }

    for( const obj of receiptPackageAlternative.receiptLines ) {
        obj.receiptLineID = id++;
    }

    console.log("best", receiptPackageBest);
    console.log("alternate", receiptPackageAlternative);
    console.log("DROP", usedTagIDs);
    res.status(200).json({ receiptPackageBest, receiptPackageAlternative });
};

const analyzeReceiptLines = async (receiptPackage) => {
    console.log( "Analyzing receipt lines..." );
    for( const receiptLine of receiptPackage.textLines) {

        const priceMatch = receiptLine.match(/\$?\d+\.\d+/);
        if( (receiptLine.includes("$") || priceMatch) && !receiptLine.toLowerCase().includes("subtotal") ) {
            receiptPackage.matchesFound++;

            const extractedPrice = priceMatch?.[0];
            receiptPackage.receiptLines.push({
                text: receiptLine,
                price: extractedPrice || 0.0,
            });

            if( extractedPrice ) {
                receiptPackage.matchesFound++;
            }
        } else {
            let storeName;

            // Determine the store
            if( receiptLine.includes("Target Debit") || receiptLine.includes("2320 Marketplace Dr") || receiptLine.includes("Target Circle Card")) {
                storeName = "Target";
            } else if( receiptLine.includes("ALDI") || receiptLine.includes("175 N. Winton Road")) {
                storeName = "ALDI";
            } else if( receiptLine.includes("112026067423") ) { // My Costco member number
                storeName = "Costco";
            } else if( receiptLine.includes("(585) 586-6680") || receiptLine.includes("650 HYLAN DRIVE") || receiptLine.includes("(585) 723-8260")) {
                storeName = 'Wegmans';
            } else if( receiptLine.includes("WHOLE FOODS") || receiptLine.includes("585-895-7750") || receiptLine.includes("2740 Monroe Ave")) {
                storeName = 'Whole Foods';
            } else if( receiptLine.includes("Price Rite") || receiptLine.includes("Store # 209")) {
                storeName = 'Price Rite';
            } else if( receiptLine.includes("3349 Monroe Ave") || receiptLine.includes("585-748-5011") || receiptLine.includes("Store #0534")) {
                storeName = 'Price Rite';
            } else if( receiptLine.includes("Walmart") || receiptLine.includes("585-787-1370") || receiptLine.includes("Store #0534")) {
                storeName = 'Walmart';
            }

            if( storeName ) {
                const store = await selectStoreByName(storeName);
                console.log("STORE", store);
                receiptPackage.store = store[0];
                receiptPackage.matchesFound++;
            }
        }
    }
}

const handleUpload = async (req, res) => {
    res.status(200).json({ success: true });
};

const router = express.Router();


router.get('/api/receipts/:receiptID', getReceiptHandler);
router.get('/api/receipts', getAllReceiptsHandler);
router.post('/api/receipts/scan', scanReceiptHandler);
router.post('/api/receipts/save', saveReceiptHandler);
router.post('/api/receipts/upload', [checkAdminMiddleware, uploadReceipts.single('imageFile')], handleUpload);

export default router;
