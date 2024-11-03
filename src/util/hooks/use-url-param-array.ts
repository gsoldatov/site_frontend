import { useMemo } from "react";
import { useLocation } from "react-router-dom";


/**
 * Hook for retrieving an array from current URL search params with the specified `param` name.
 *
 * Returns an empty array if URL param is not found.
 * 
 * Returned array is memoized.
 */
export const useURLParamArray = (param: string) => {
    const location = useLocation();
    const URLParams = new URLSearchParams(location.search);

    return useMemo(() => {  // Memoize returned array
        let result: string[];
    
        try {
            let array = URLParams.get(param);
            if (!array) throw(`${param} URL search param is missing`);
            result = decodeURIComponent(array).split(",");
        } catch {
            result = [];
        }

        return result;
    }, [param, location.search]);
};
