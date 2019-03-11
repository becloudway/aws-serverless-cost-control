const round = (num: number, decimalPoints: number): number => Math.round(num * (10 ** decimalPoints)) / (10 ** decimalPoints);

export {
    round,
};
