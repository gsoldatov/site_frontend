/**
 * Returns elements of a feed inside `container`.
 */
 export const getFeedElements = container => {
    let result = {
        placeholders: {
            loading: null,
            fetchError: null
        },

        feedCards: {
            container: null,
            feedCards: []
        },

        pagination: {
            container: null,
            buttons: {}
        }
    };

    const feedContainer = container.querySelector(".feed-container");

    if (feedContainer) {
        /* Placeholders */
        result.placeholders.loading = [...feedContainer.childNodes].filter(n => n.classList.contains("ui") && n.classList.contains("loader"))[0];
        result.placeholders.fetchError =  [...feedContainer.childNodes].filter(n => n.classList.contains("ui") && n.classList.contains("message") && n.classList.contains("error"))[0];

        /* Feed cards */
        result.feedCards.container = feedContainer.querySelector(".feed-cards-container");

        if (result.feedCards.container) {
            result.feedCards.feedCards = [...result.feedCards.container.querySelectorAll(".feed-card")];
        }

        /* Pagination */
        result.pagination.container = feedContainer.querySelector(".feed-pagination-container");
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
 * Returns elements of feed card inside `cardContainer`.
 */
 export const getFeedCardElements = cardContainer => {
    const result = {
        objectID: null,
        timestamp: null,
        header: {
            text: null,
            link: null
        },
        description: null,
        tags: {
            container: null,
            tags: []
        }
    };

    result.timestamp = cardContainer.querySelector(".feed-card-timestamp");

    const headerContainer = cardContainer.querySelector(".feed-card-header-container");
    if (headerContainer)
        result.header.link = headerContainer.querySelector("a");
        result.header.text = result.header.link.querySelector("h2").textContent;
        result.objectID = parseInt(result.header.link.href.match(/\/objects\/view\/(?<id>\d+)$/).groups["id"]);

    const descriptionContainer = cardContainer.querySelector(".feed-card-description");
    if (descriptionContainer) result.description = descriptionContainer.querySelector(".rendered-markdown");
    result.tags.container = cardContainer.querySelector(".object-feed-card-tag-list-container");
    if (result.tags.container) result.tags.tags = [...result.tags.container.querySelectorAll(".inline-item")];

    return result;
};


/**
 * Compares IDs of displayed in `container` object feed cards with expected object IDs.
 */
export const checkDisplayedObjectFeedCardIDs = (container, expectedIDs) => {
    const objectsFeedElements = getFeedElements(container);
    const displayedIDs = objectsFeedElements.feedCards.feedCards.map(p => getFeedCardElements(p).objectID);
    
    if (displayedIDs.length !== expectedIDs.length) throw Error(`Expected and displayed object feed card IDs do not match:\n${expectedIDs}\n${displayedIDs}`);
};
