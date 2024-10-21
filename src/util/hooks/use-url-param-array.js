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
