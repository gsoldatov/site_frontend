import { useLocation } from "react-router-dom";


/**
 * Hook for retrieving an array from current URL search params with the specified `param` name.
 *
 * Returns an empty array if URL param is not found.
 */
export const useURLParamArray = (param) => {
    const location = useLocation();
    const URLParams = new URLSearchParams(location.search);
    let array = URLParams.get(param);
    
    try {
        if (!array) throw(`${param} URL search param is missing`);
        array = decodeURIComponent(array).split(",");
    } catch {
        array = [];
    }

    return array;
};


/**
 * Returns an array from current URL search params with the specified `param` name.
 * Resulting items are converted to integers and filtered from NaNs & non-positive values and deduplicated.
 */
export const useURLParamIDs = (param) => {
    let array = useURLParamArray(param);
    array = array.map(i => parseInt(i)).filter(i => i > 0);
    array = [...(new Set(array))];
    return array;
};
