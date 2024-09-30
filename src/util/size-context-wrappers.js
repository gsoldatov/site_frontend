/**
 * Returns the index of the first element in `thresholds`, which is not exceeded by `value`.
 * @param {number} value
 * @param {number[]} thresholds
 * @returns {number}
 */
export const getThresholdForValue = (value, thresholds) => {
    for (let i = 0; i < thresholds.length; i++)
        if (value <= thresholds[i]) return i;

    return thresholds.length;
};
