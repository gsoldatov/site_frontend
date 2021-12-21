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

        previews: {
            container: null,
            previews: []
        },

        pagination: {
            container: null,
            buttons: {}
        }
    };

    const feedContainer = container.querySelector(".objects-feed-container");

    if (feedContainer) {
        /* Placeholders */
        result.placeholders.loading = [...feedContainer.childNodes].filter(n => n.classList.contains("ui") && n.classList.contains("loader"))[0];
        result.placeholders.fetchError =  [...feedContainer.childNodes].filter(n => n.classList.contains("ui") && n.classList.contains("message") && n.classList.contains("error"))[0];

        /* Previews */
        result.previews.container = feedContainer.querySelector(".objects-feed-previews-container");

        if (result.previews.container) {
            result.previews.previews = [...result.previews.container.querySelectorAll(".object-preview-container")];
        }

        /* Pagination */
        result.pagination.container = feedContainer.querySelector(".objects-feed-pagination-container");
        if (result.pagination.container) {
            const buttons = result.pagination.container.querySelectorAll("a.item");
            for (let b of buttons) {
                if (b.textContent === "⟨") result.pagination.buttons["previous"] = b;
                else if (b.textContent === "⟩") result.pagination.buttons["next"] = b;
                else result.pagination.buttons[b.textContent] = b;
            }
        }
    }

    return result;
};


/**
 * Returns elements of an object preview inside `previewContainer`.
 */
export const getObjectPreviewElements = previewContainer => {
    const result = {
        objectID: null,
        timestamp: null,
        headerLink: null,
        description: null,
        tags: {
            container: null,
            tags: []
        }
    };

    result.timestamp = previewContainer.querySelector(".object-preview-timestamp");

    result.headerLink = previewContainer.querySelector(".object-preview-header a");
    if (result.headerLink)
        result.objectID = parseInt(result.headerLink.href.match(/\/objects\/view\/(?<id>\d+)$/).groups["id"]);

    result.description = previewContainer.querySelector(".object-preview-description");
    result.tags.container = previewContainer.querySelector(".object-preview-tag-list-container");
    if (result.tags.container) result.tags.tags = [...result.tags.container.querySelectorAll(".inline-item")];

    return result;
};


/**
 * Compares IDs of displayed in `container` object previews with expected object IDs.
 */
export const checkDisplayedObjectPreviewIDs = (container, expectedIDs) => {
    const objectsFeedElements = getObjectsFeedElements(container);
    const displayedIDs = objectsFeedElements.previews.previews.map(p => getObjectPreviewElements(p).objectID);
    
    if (displayedIDs.length !== expectedIDs.length) throw Error(`Expected and displayed object preview IDs do not match:\n${expectedIDs}\n${displayedIDs}`);
};
