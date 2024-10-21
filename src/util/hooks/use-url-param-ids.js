import { useMemo } from "react";

import { useURLParamArray } from "./use-url-param-array";


/**
 * Returns an array from current URL search params with the specified `param` name.
 * Resulting items are converted to integers and filtered from NaNs & non-positive values and deduplicated.
 * 
 * Returned array is memoized.
 */
export const useURLParamIDs = (param) => {
    let array = useURLParamArray(param);

    return useMemo(() => {  // Memoize returned array
        let result = array.map(i => parseInt(i)).filter(i => i > 0);
        return [...(new Set(result))];
    }, [array]);
};
