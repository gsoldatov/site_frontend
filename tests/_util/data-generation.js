/**
 * Returns a list of integers from `f` to `t` with a step `s`.
 * If `f` > `t`, step becomes negative.
 */
export const getIntegerList = (f, t, s = 1) => {
    if (s <= 0 || isNaN(s)) throw Error(`Incorrect value of increment value s: ${s}`);

    let a = [];

    if (f <= t) for (let i = f; i <= t; i += s) a.push(i);
    else for (let i = f; i >= t; i -= s) a.push(i);
    
    return a;
};
