import { useMemo } from "react";
import { useLocation } from "react-router-dom";


/**
 * Hook for retrieving an array from current URL search params with the specified `param` name.
 *
 * Returns an empty array if URL param is not found.
 * 
 * Returned array is memoized.
 */
export const useURLParamArray = (param) => {
    const location = useLocation();
    const URLParams = new URLSearchParams(location.search);

    return useMemo(() => {  // Memoize returned array
        let array = URLParams.get(param);
    
        try {
            if (!array) throw(`${param} URL search param is missing`);
            array = decodeURIComponent(array).split(",");
        } catch {
            array = [];
        }

        return array;
    }, [param, location.search]);
};


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
