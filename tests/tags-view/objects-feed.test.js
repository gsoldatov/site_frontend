import React from "react";
import { waitFor, fireEvent, screen } from "@testing-library/react";

import { renderWithWrappers } from "../_util/render";
import { updateStoredObjectAttributes } from "../_util/store-updates-objects";
import { getTagsViewElements, checkDisplayedTagsViewFeedCardIDs } from "../_util/ui-tags-view";
import { getFeedCardElements } from "../_util/ui-index";
import { compareArrays, compareDates } from "../_util/data-checks";
import { getInlineItem } from "../_util/ui-inline";
import { addCustomResponsesForSinglePageTagsView } from "../_mocks/data-objects";

import { App } from "../../src/components/top-level/app";


/*
    /tags/view objects feed tests
*/
beforeEach(() => {
    // isolate fetch mock to avoid tests state collision because of cached data in fetch
    jest.isolateModules(() => {
        const { mockFetch, setFetchFail, addCustomRouteResponse } = require("../_mocks/mock-fetch");
        // reset fetch mocks
        jest.resetAllMocks();
        global.fetch = jest.fn(mockFetch);
        global.setFetchFail = jest.fn(setFetchFail);
        global.addCustomRouteResponse = jest.fn(addCustomRouteResponse);
    });
});


describe("General", () => {
    test("No valid tags are selected", async () => {
        let { container } = renderWithWrappers(<App />, {
            route: "/tags/view?tagIDs=0,-1,asd"
        });

        await waitFor(() => expect(getTagsViewElements(container).feed.placeholders.loading).toBeFalsy());

        const elements = getTagsViewElements(container);
        expect(elements.feed.container).toBeFalsy();
    });


    test("Loading placeholder & error", async () => {
        addCustomRouteResponse("/objects/view", "POST", { generator: body => {
            // Throw network error object data
            throw TypeError("NetworkError");
        }});
        
        let { container } = renderWithWrappers(<App />, {
            route: "/tags/view?tagIDs=1"
        });

        // Check loading placeholder
        expect(getTagsViewElements(container).feed.placeholders.loading).toBeTruthy();
        await waitFor(() => expect(getTagsViewElements(container).feed.placeholders.loading).toBeFalsy());

        // Check error placeholder
        expect(getTagsViewElements(container).feed.placeholders.fetchError).toBeTruthy();
    });
});


describe("Single page", () => {
    test("Displayed object IDs", async () => {
        // Set custom object ids for the page
        const { expectedObjectIDs } = addCustomResponsesForSinglePageTagsView();
        
        // Render page & wait for load end
        let { container } = renderWithWrappers(<App />, {
            route: "/tags/view?tagIDs=1"
        });

        await waitFor(() => expect(getTagsViewElements(container).feed.placeholders.loading).toBeFalsy());
        expect(getTagsViewElements(container).feed.placeholders.fetchError).toBeFalsy();

        // Check if correct objects are displayed
        const displayedObjectIDs = getTagsViewElements(container).feed.feedCards.feedCards.map(card => getFeedCardElements(card).objectID);
        expect(compareArrays(expectedObjectIDs, displayedObjectIDs)).toBeTruthy();
    });


    test("Object card timestamp", async () => {
        // Set custom object ids for the page
        const { expectedObjectIDs } = addCustomResponsesForSinglePageTagsView();
        
        // Render page & wait for load end
        let { container, store } = renderWithWrappers(<App />, {
            route: "/tags/view?tagIDs=1"
        });

        await waitFor(() => expect(getTagsViewElements(container).feed.placeholders.loading).toBeFalsy());

        // Check if displayed timestamp equals to feed timestamp
        const feedCard = getTagsViewElements(container).feed.feedCards.feedCards[0];
        let feedCardElements = getFeedCardElements(feedCard);
        const objectID = expectedObjectIDs[0];

        let ed = new Date(store.getState().objects[objectID].feed_timestamp), dd = new Date(feedCardElements.timestamp.textContent);
        compareDates(ed, dd);

        // Check if modified at is used as a fallback for missing feed timestamp
        updateStoredObjectAttributes(store, objectID, { feed_timestamp: "" });
        feedCardElements = getFeedCardElements(feedCard);
        ed = new Date(store.getState().objects[objectID].modified_at), dd = new Date(feedCardElements.timestamp.textContent);
        compareDates(ed, dd);
    });


    test("Object card header", async () => {
        // Set custom object ids for the page
        const { expectedObjectIDs } = addCustomResponsesForSinglePageTagsView();
        
        // Render page & wait for load end
        let { container, store } = renderWithWrappers(<App />, {
            route: "/tags/view?tagIDs=1"
        });

        await waitFor(() => expect(getTagsViewElements(container).feed.placeholders.loading).toBeFalsy());

        // Check if correct header text is displayed
        for (let i = 0; i < expectedObjectIDs.length; i++) {
            const feedCard = getTagsViewElements(container).feed.feedCards.feedCards[i];
            const objectID = expectedObjectIDs[i];
            expect(getFeedCardElements(feedCard).header.text).toEqual(store.getState().objects[objectID].object_name);
        }
    });


    test("Object card description", async () => {
        // Set custom object ids for the page
        const { expectedObjectIDs } = addCustomResponsesForSinglePageTagsView();
        
        // Render page & wait for load end
        let { container, store } = renderWithWrappers(<App />, {
            route: "/tags/view?tagIDs=1"
        });

        await waitFor(() => expect(getTagsViewElements(container).feed.placeholders.loading).toBeFalsy());

        // Wait for description of the first object to render and check it
        await waitFor(() => {
            const feedCard = getTagsViewElements(container).feed.feedCards.feedCards[0];
            let feedCardElements = getFeedCardElements(feedCard);
            const objectID = expectedObjectIDs[0];
            const paragraph = feedCardElements.description.querySelector("p");
            expect(paragraph).toBeTruthy();
            expect(paragraph.textContent).toEqual(store.getState().objects[objectID].object_description);
        });

        // Check if description is not displayed if not set to
        for (let i = 1; i < expectedObjectIDs.length; i++) {
            const feedCard = getTagsViewElements(container).feed.feedCards.feedCards[i];
            expect(getFeedCardElements(feedCard).description).toBeFalsy();
        }
    });


    test("Tags", async () => {
        // Set custom object ids for the page
        const { firstObjectTagIDs } = addCustomResponsesForSinglePageTagsView();
        
        // Render page & wait for load end
        let { container, store, history } = renderWithWrappers(<App />, {
            route: "/tags/view?tagIDs=1"
        });

        await waitFor(() => expect(getTagsViewElements(container).feed.placeholders.loading).toBeFalsy());

        // Check if expected tag names are displayed
        const feedCard = getTagsViewElements(container).feed.feedCards.feedCards[0];
        let feedCardElements = getFeedCardElements(feedCard);
        const { objectID } = feedCardElements;

        const state = store.getState();
        expect(state.objectsTags[objectID].length).toEqual(firstObjectTagIDs.length);

        const renderedTagNames = [...feedCardElements.tags.tags].map(item => getInlineItem({ item }).textSpan.textContent);
        expect(renderedTagNames.length).toEqual(firstObjectTagIDs.length);
        firstObjectTagIDs.forEach(tagID => expect(renderedTagNames.indexOf(state.tags[tagID].tag_name)).toBeGreaterThan(-1));

        // Check redireact to /tags/view page
        fireEvent.click(getInlineItem({ item: feedCardElements.tags.tags[1] }).link);
        expect(history.entries[history.entries.length - 1].pathname).toEqual("/tags/view");
        expect(history.entries[history.entries.length - 1].search).toEqual(`?tagIDs=${firstObjectTagIDs[1]}`);
        await waitFor(() => expect(getTagsViewElements(container).feed.placeholders.loading).toBeFalsy());
    });
});


describe("Pagination", () => {
    test("Single page", async () => {
        // Set custom object ids for the page
        const { expectedObjectIDs } = addCustomResponsesForSinglePageTagsView();
        
        // Render page & wait for load end
        let { container } = renderWithWrappers(<App />, {
            route: "/tags/view?tagIDs=1"
        });

        await waitFor(() => expect(getTagsViewElements(container).feed.placeholders.loading).toBeFalsy());
        expect(getTagsViewElements(container).feed.placeholders.fetchError).toBeFalsy();

        // Check if pagination is not rendered
        expect(getTagsViewElements(container).feed.pagination.container).toBeFalsy();
    });


    test("Multiple pages", async () => {
        // Set custom response for search (10 pages with 10 items on each)
        const getQueryItems = page =>  {
            const result = [];
            for (let i = 1; i <= 10; i++) result.push(10 * (page - 1) + i);
            return result;
        };

        addCustomRouteResponse("/objects/get_page_object_ids", "POST", { generator: (body, handler) => {
            const pagination_info = JSON.parse(body).pagination_info;
            
            if (pagination_info.page > 10) return { status: 404, body: { _error: "No objects found." }};

            return { status: 200, body: {
                pagination_info: {
                    ...pagination_info,
                    object_ids: getQueryItems(pagination_info.page),
                    total_items: 100
                }
            }};
        }});

        // Render first page
        let { container, history } = renderWithWrappers(<App />, {
            route: "/tags/view?tagIDs=1"
        });

        // Wait for the page to load
        await waitFor(() => expect(getTagsViewElements(container).feed.placeholders.loading).toBeFalsy());

        // First page: check feed cards
        checkDisplayedTagsViewFeedCardIDs(container, getQueryItems(1));

        // Get pagination and open next page
        let pagination = getTagsViewElements(container).feed.pagination;
        fireEvent.click(pagination.buttons["next"]);

        // Second page: wait for load to end and check URL & displayed feed cards
        expect(getTagsViewElements(container).feed.placeholders.loading).toBeTruthy();
        await waitFor(() => expect(getTagsViewElements(container).feed.placeholders.loading).toBeFalsy());
        let currentPage = (new URLSearchParams(history.location.search)).get("p");
        expect(currentPage).toEqual("2");
        checkDisplayedTagsViewFeedCardIDs(container, getQueryItems(2));

        // Get last page button and open the page
        pagination = getTagsViewElements(container).feed.pagination;
        expect(pagination.buttons[11]).toBeUndefined;
        fireEvent.click(pagination.buttons[10]);

        // Last page: wait for load to end and check URL & displayed feed cards
        expect(getTagsViewElements(container).feed.placeholders.loading).toBeTruthy();
        await waitFor(() => expect(getTagsViewElements(container).feed.placeholders.loading).toBeFalsy());
        currentPage = (new URLSearchParams(history.location.search)).get("p");
        expect(currentPage).toEqual("10");
        checkDisplayedTagsViewFeedCardIDs(container, getQueryItems(10));

        // Get previous page button and open the page
        pagination = getTagsViewElements(container).feed.pagination;
        fireEvent.click(pagination.buttons["previous"]);

        // Previous to last page: wait for load to end and check URL & displayed feed cards
        expect(getTagsViewElements(container).feed.placeholders.loading).toBeTruthy();
        await waitFor(() => expect(getTagsViewElements(container).feed.placeholders.loading).toBeFalsy());
        currentPage = (new URLSearchParams(history.location.search)).get("p");
        expect(currentPage).toEqual("9");
        checkDisplayedTagsViewFeedCardIDs(container, getQueryItems(9));

        // Get first page button and open the page
        pagination = getTagsViewElements(container).feed.pagination;
        fireEvent.click(pagination.buttons[1]);

        // First page: wait for load to end and check URL & displayed feed cards
        expect(getTagsViewElements(container).feed.placeholders.loading).toBeTruthy();
        await waitFor(() => expect(getTagsViewElements(container).feed.placeholders.loading).toBeFalsy());
        currentPage = (new URLSearchParams(history.location.search)).get("p");
        expect(currentPage).toBeFalsy();
        checkDisplayedTagsViewFeedCardIDs(container, getQueryItems(1));
    });
});
