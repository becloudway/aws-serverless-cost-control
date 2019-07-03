import { subMinutes } from 'date-fns';
import { DateRange } from './types';

class DateTime {
    public static getDateRange(offsetMinutes: number, rangeMinutes: number, baseDate = Date.now()): DateRange {
        const end = subMinutes(baseDate, offsetMinutes);
        const start = subMinutes(end, rangeMinutes);
        return { start, end };
    }
}

class Numbers {
    public static round(num: number, decimalPoints: number): number {
        return Math.round(num * (10 ** decimalPoints)) / (10 ** decimalPoints);
    }
}

export {
    DateTime,
    Numbers,
};
