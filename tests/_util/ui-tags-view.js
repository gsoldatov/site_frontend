import { queryByText, screen } from "@testing-library/dom";
import { getFeedCardElements, getFeedElements } from "./ui-index";


/**
 * Returns elements of the /tags/view page inside the `container`.
 */
export const getTagsViewElements = container => {
    const result = {
        dropdown: {
            input: null,
            options: [],
            optionsByText: {}
        },

        selectPrompt: null,

        selectedTags: {
            tags: null,
            tagsByName: {}
        },

        tagInformation: {
            container: null,
            prevButton: null,
            nextButton: null,
            tagCard: {
                card: null,
                header: null,
                editButton: null,
                description: null,
                descriptionText: null
            }
        },
        
        feed: {
            container: null,

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
        }
    };

    // Input
    const dropdownContainer = container.querySelector(".tags-view-tag-dropdown");
    if (dropdownContainer) {
        result.dropdown.input = dropdownContainer.querySelector("input");
        const options = dropdownContainer.querySelector(".visible.menu.transition");
        if (options) {
            result.dropdown.options = [...options.querySelectorAll("div.item")];
            result.dropdown.options.forEach(o => {
                result.dropdown.optionsByText[o.querySelector("span.text").textContent] = o;
            });
        }
    }

    // Select prompt
    result.selectPrompt = queryByText(container, "Select a tag");

    // Selected tags
    const inlineItemListContainer = container.querySelector(".tags-view-container > .inline-item-list-container");
    if (inlineItemListContainer) {
        result.selectedTags.tags = [...inlineItemListContainer.querySelectorAll(".tags-view-selected-tag")];
        result.selectedTags.tags.forEach(t => {
            result.selectedTags.tagsByName[t.querySelector(".inline-text").textContent] = t;
        });
    }

    // Tag information
    result.tagInformation.container = container.querySelector(".tags-view-tag-information-container");
    if (result.tagInformation.container) {
        result.tagInformation.prevButton = result.tagInformation.container.querySelector(".tags-view-tag-information-select-button:first-child");
        result.tagInformation.nextButton = result.tagInformation.container.querySelector(".tags-view-tag-information-select-button:last-child");
        result.tagInformation.tagCard.card = result.tagInformation.container.querySelector(".tags-view-tag-card");
        result.tagInformation.tagCard.header = result.tagInformation.tagCard.card.querySelector(".tags-view-information-header");
        result.tagInformation.tagCard.editButton = result.tagInformation.tagCard.card.querySelector(".tags-view-tag-information-edit-button-container");
        result.tagInformation.tagCard.description = result.tagInformation.tagCard.card.querySelector(".tags-view-tag-information-description-container");
        if (result.tagInformation.tagCard.description)
            result.tagInformation.tagCard.descriptionText = result.tagInformation.tagCard.description.querySelector(".rendered-markdown").textContent;
    }

    // Objects feed
    result.feed = getFeedElements(container);

    return result;
};


/**
 * Compares IDs of displayed in search page `container` feed cards with `expectedItems`.
 * 
 * `expectedItems` is a list of objects with `item_id` and `item_type` props.
 */
 export const checkDisplayedTagsViewFeedCardIDs = (container, expectedItems) => {
    const objectsFeedElements = getFeedElements(getTagsViewElements(container).feed.container.parentNode);
    
    const displayedItems = objectsFeedElements.feedCards.feedCards.map(p => getFeedCardElements(p).objectID);

    if (displayedItems.length !== expectedItems.length) throw Error(`Expected and displayed object feed card count do not match: ${expectedIDs.length} != ${displayedIDs.length}`);
    
    for (let i = 0; i < displayedItems.length; i++)
        if (displayedItems[i] !== expectedItems[i])
           throw Error(`Expected and displayed object feed card ID number ${i} do not match:\n${JSON.stringify(expectedItems[i])} != ${JSON.stringify(displayedItems[i])}`);
};
