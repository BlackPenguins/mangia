import { getWeekRange } from  '#root/routes/menu.js';
import { getPool } from './utils.js';

const pool = getPool();

export const getOrInsertWeek = async (weekOffset) => {
	let todaysDate = new Date();
	todaysDate.setHours(24 * 7 * weekOffset);
	const { startDate, endDate } = getWeekRange(todaysDate);

	const weekFound = await selectWeek(startDate, endDate);

	if (!weekFound) {
		const newWeekRange = {
			StartDate: startDate,
			EndDate: endDate,
		};

		return new Promise((resolve, reject) => {
			pool.query('INSERT INTO WEEK SET ?', newWeekRange, (error, result) => {
				if (error) {
					return reject(error.sqlMessage);
				} else {
					return resolve({
						weekID: result.insertId,
						startDate: startDate,
						endDate: endDate,
					});
				}
			});
		});
	} else {
		return {
			weekID: weekFound.WeekID,
			startDate: new Date(weekFound.StartDate),
			endDate: new Date(weekFound.EndDate),
		};
	}
};

const selectWeek = (startDate, endDate) => {
	const startDateFormattedForDB = startDate.toISOString().slice(0, 10);
	const endDateFormattedForDB = endDate.toISOString().slice(0, 10);

	return new Promise((resolve, reject) => {
		pool.query('SELECT * FROM WEEK WHERE StartDate = ? && EndDate = ?', [startDateFormattedForDB, endDateFormattedForDB], (error, result) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve((result.length > 0 && result[0]) || null);
			}
		});
	});
};

export const getWeekByID = (weekID) => {
	return new Promise((resolve, reject) => {
		pool.query('SELECT * FROM WEEK WHERE WeekID = ?', [weekID], (error, result) => {
			if (error) {
				return reject(error.sqlMessage);
			} else {
				return resolve((result.length > 0 && result[0]) || null);
			}
		});
	});
};
