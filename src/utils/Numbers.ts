export class Numbers {
    public static round(num: number, decimalPoints: number): number {
        return Math.round(num * (10 ** decimalPoints)) / (10 ** decimalPoints);
    }
}

