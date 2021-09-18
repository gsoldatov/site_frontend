// /**  // TODO replace old runFetch
//  * Thunk, which runs a fetch to `url` with `fetchParams`. Returns response object.
//  *  
//  * Catches network (and CORS) errors and returns an object with `error` property in this case.
//  * 
//  * Additional parameters can be passed via `thunkParams` argument:
//  * - `useAccessToken`: can be set to false to avoid checking current access token for expiration and adding it in 'Authorization' header.
//  */
//  export const runFetch = async (url, fetchParams, thunkParams = {}) => {
//     return async (dispatch, getState) => {
//     };
//  };

// Old version  // TODO delete
// export const runFetch = async (url, params) => {
//     try {
//         return await fetch(url, params);
//     } catch (e) {
//         if (e instanceof TypeError && e.message.indexOf("NetworkError") > -1) return { error: "Failed to fetch data." };
//         // throw e;
//     }
// };

// TODO replace with thunk
export const runFetch = async (url, params) => {
    try {
        return await fetch(url, params);
    } catch (e) {
        if (e instanceof TypeError && e.message.indexOf("NetworkError") > -1) return { status: "network", error: "Failed to fetch data." };
        // throw e;
    }
};


/**
 * Returns an error message from `response` or undefined if there is none.
 */
export const getErrorFromResponse = async response => {
    switch (response.status) {
        case "network":
            return { error: response.error };
        case 500:
            return { error: await response.text() };
        default:
            return { error: (await response.json())._error };
    }
};


/**
 * Returns true if provided `response` contains an error.
 */
export const responseHasError = response => (response || {}).error !== undefined ? true : false;
