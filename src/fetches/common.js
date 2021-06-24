/**
 * Runs a fetch to `url` with `params`. Returns response object.
 * 
 * Catches network (and CORS) errors and returns an object with `error` property in this case.
 */
export const runFetch = async (url, params) => {
    try {
        return await fetch(url, params);
    } catch (e) {
        if (e instanceof TypeError && e.message.indexOf("NetworkError") > -1) return { error: "Failed to fetch data." };
        // throw e;
    }
};


/**
 * Returns an error message from `response` or undefined if there is none.
 */
export const getErrorFromResponse = async response => {
    switch (response.status) {
        case 400:
        case 404:
            return { error: (await response.json())._error };
        case 500:
            return { error: await response.text() };
    }
};


/**
 * Returns true if provided `response` contains an error.
 */
export const responseHasError = response => (response || {}).error !== undefined ? true : false;
