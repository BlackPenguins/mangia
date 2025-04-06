import { format, addHours } from 'date-fns';
import { TZDate } from "@date-fns/tz";

console.log(format(new Date(), 'yyyy-MM-dd'));
console.log(process.cwd());

const tzDate = new TZDate(2022, 2, 13, "Asia/Singapore");
addHours(tzDate, 2).toString();
console.log(tzDate);