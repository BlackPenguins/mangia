import { getPool } from './utils.js';

const pool = getPool();

export const selectAllReceipts = (newBook) => {
    return new Promise((resolve, reject) => {
        pool.query('SELECT * FROM RECEIPTS ORDER BY ReceiptID DESC', (error, result) => {
            if (error) {
                return reject(error.sqlMessage);
            } else {
                return resolve(result);
            }
        });
    });
};

export const selectReceipt = (receiptID) => {
    return new Promise((resolve, reject) => {
        pool.query('SELECT * FROM RECEIPTS WHERE ReceiptID = ?', [receiptID], (error, result) => {
            if (error) {
                return reject(error.sqlMessage);
            } else {
                return resolve(result);
            }
        });
    });
};

export const insertReceipt = (newBook) => {
    const newReceipt = {
		Date: new Date(),
    }
    return new Promise((resolve, reject) => {
        pool.query('INSERT INTO RECEIPTS SET ?', newReceipt, (error, result) => {
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

export const updateReceiptStore = (receiptID, storeID) => {
    return new Promise((resolve, reject) => {
        pool.query("UPDATE RECEIPTS SET StoreID = ? WHERE ReceiptID = ?", [storeID, receiptID], (error, result) => {
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

export const updateReceiptProcessed = (receiptID) => {
    return new Promise((resolve, reject) => {
        pool.query("UPDATE RECEIPTS SET IsProcessed = 1 WHERE ReceiptID = ?", [receiptID], (error, result) => {
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