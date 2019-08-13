import { subMinutes } from 'date-fns';
import { DateRange } from '../types';

export class DateTime {
    public static getDateRange(offsetMinutes: number, rangeMinutes: number, baseDate?: Date): DateRange {
        const end = subMinutes(baseDate || Date.now(), offsetMinutes);
        const start = subMinutes(end, rangeMinutes);
        return { start, end };
    }
}
