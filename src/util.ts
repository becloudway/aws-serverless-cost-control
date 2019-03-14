import { subMinutes } from 'date-fns';
import { DateRange } from './types';

const round = (num: number, decimalPoints: number): number => Math.round(num * (10 ** decimalPoints)) / (10 ** decimalPoints);
const getTimeRange = (offsetMinutes: number, rangeMinutes: number, baseDate = Date.now()): DateRange => {
    const end = subMinutes(baseDate, offsetMinutes);
    const start = subMinutes(end, rangeMinutes);
    return { start, end };
};

export {
    round,
    getTimeRange,
};
