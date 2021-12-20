import { screen } from "@testing-library/dom";

/**
 * Returns elements of an object feed inside `container`.
 */
export const getObjectsFeedElements = container => {
    let result = {
        placeholders: {
            loading: null,
            fetchError: null
        },

        // TODO object preview container, pagination controls
    };

    const feedContainer = container.querySelector(".objects-feed-container");

    if (feedContainer) {
        /* Placeholders */
        result.placeholders.loading = [...feedContainer.childNodes].filter(n => n.classList.contains("ui") && n.classList.contains("loader"))[0];
        result.placeholders.fetchError =  [...feedContainer.childNodes].filter(n => n.classList.contains("ui") && n.classList.contains("message") && n.classList.contains("error"))[0];
    }

    return result;
};
