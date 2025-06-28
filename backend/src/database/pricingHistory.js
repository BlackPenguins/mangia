import { getPool } from './utils.js';

const pool = getPool();

export const selectAllPricingHistory = (receiptID) => {
    return new Promise((resolve, reject) => {
        pool.query('SELECT p.*, t.Name FROM PRICING_HISTORY p JOIN INGREDIENT_TAG t ON p.IngredientTagID = t.IngredientTagID WHERE ReceiptID  = ?', [receiptID], (error, result) => {
            if (error) {
                return reject(error.sqlMessage);
            } else {
                return resolve(result);
            }
        });
    });
};

export const insertPricingHistory = (receiptID, price, tagID) => {
    const newPricing = {
		UpdateStamp: new Date(),
        Price: price,
        ReceiptID: receiptID,
        IngredientTagID: tagID
    };

    return new Promise((resolve, reject) => {
        pool.query('INSERT INTO PRICING_HISTORY SET ?', newPricing, (error, result) => {
            if (error) {
                return reject(error.sqlMessage);
            } else {
                const responseObject = {
                    id: result.insertId,
                };
                return resolve(responseObject);
            }
        });
    });
};

export const deletePricingHistory = (receiptID) => {
    return new Promise((resolve, reject) => {
        pool.query('DELETE FROM PRICING_HISTORY WHERE ReceiptID = ?', receiptID, (error, result) => {
            if (error) {
                return reject(error.sqlMessage);
            } else {
                const responseObject = {
                    id: result.insertId,
                };
                return resolve(responseObject);
            }
        });
    });
};