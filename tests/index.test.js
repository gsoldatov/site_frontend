import React from "react";
import ReactDOM from "react-dom";
import { fireEvent, waitFor, getByText } from "@testing-library/dom";

import { getMockedPageObjectIDs } from "./_mocks/mock-fetch-handlers-objects";
import { getObjectsViewCardElements } from "./_util/ui-objects-view";
import { renderWithWrappers } from "./_util/render";
import { checkDisplayedObjectFeedCardIDs, getFeedCardElements, getFeedElements } from "./_util/ui-index";
import { getInlineItem } from "./_util/ui-inline";

import { addObjects } from "../src/actions/data-objects";

import { App } from "../src/components/top-level/app";


/*
    Index and /feed/:page page tests.
*/
beforeEach(() => {
    // isolate fetch mock to avoid tests state collision because of cached data in fetch
    jest.isolateModules(() => {
        const { mockFetch, setFetchFail, addCustomRouteResponse } = require("./_mocks/mock-fetch");
        // reset fetch mocks
        jest.resetAllMocks();
        global.fetch = jest.fn(mockFetch);
        global.setFetchFail = jest.fn(setFetchFail);
        global.addCustomRouteResponse = jest.fn(addCustomRouteResponse);
    });
});


/**
 * Template pagination info object for getting expected object IDs from the route response generating function
 */
const _mockPaginationInfo = { 
    page: 1,
    items_per_page: 10,
    order_by: "feed_timestamp",
    sort_order: "desc",
    show_only_displayed_in_feed: true                
};


describe("Page load & placeholders", () => {
    test("Load with a fetch error", async () => {
        setFetchFail(true);

        for (let route of ["/", "/feed/2"]) {

            let { container } = renderWithWrappers(<App />, {
                route
            });

            // Check if an error message is displayed once loading fetch has ended
            expect(getFeedElements(container).placeholders.loading).toBeTruthy();
            await waitFor(() => expect(getFeedElements(container).placeholders.loading).toBeFalsy());
            expect(getFeedElements(container).placeholders.fetchError).toBeTruthy();

            ReactDOM.unmountComponentAtNode(container);
        }
    });


    test("Incorrect page number", async () => {
        for (let route of ["/feed/asd", "/feed/-1"]) {
            let { container, history } = renderWithWrappers(<App />, {
                route
            });

            // Check if index page is rendered instead
            await waitFor(() => expect(getFeedElements(container).placeholders.loading).toBeFalsy());
            expect(history.entries[history.entries.length - 1].pathname).toEqual("/");
            checkDisplayedObjectFeedCardIDs(container, getMockedPageObjectIDs(_mockPaginationInfo));

            ReactDOM.unmountComponentAtNode(container);
        }
    });


    test("Page without objects", async () => {
        let { container, history } = renderWithWrappers(<App />, {
            route: "/feed/999"
        });

        // Check if "No objects found" error is displayed
        await waitFor(() => expect(getFeedElements(container).placeholders.loading).toBeFalsy());
        const fetchError = getFeedElements(container).placeholders.fetchError;
        expect(fetchError).toBeTruthy();
        getByText(fetchError, "No objects found", { exact: false });
    });


    test("Correct load", async () => {
        for (let [route, page] of [["/", 1], ["/feed/2", 2]]) {
            let { container } = renderWithWrappers(<App />, {
                route
            });

            // Wait for the page to load
            expect(getFeedElements(container).placeholders.loading).toBeTruthy();
            await waitFor(() => expect(getFeedElements(container).placeholders.loading).toBeFalsy());
            expect(getFeedElements(container).feedCards.container).toBeTruthy();

            // Check if expected object feed cards are rendered
            const expectedIDs = getMockedPageObjectIDs({ ..._mockPaginationInfo, page });
            checkDisplayedObjectFeedCardIDs(container, expectedIDs);

            ReactDOM.unmountComponentAtNode(container);
        }
    });
});


describe("Feed pagination", () => {
    test("Single page", async () => {
        // Add a mock response
        const pageObjectIDs = [25, 100, 225, 300, 500];
        addCustomRouteResponse("/objects/get_page_object_ids", "POST", { status: 200, body: { pagination_info: { object_ids: pageObjectIDs, total_items: pageObjectIDs.length }}});

        let { container } = renderWithWrappers(<App />, {
            route: "/"
        });

        // Wait for the page to load
        expect(getFeedElements(container).placeholders.loading).toBeTruthy();
        await waitFor(() => expect(getFeedElements(container).placeholders.loading).toBeFalsy());
        expect(getFeedElements(container).feedCards.container).toBeTruthy();

        // Check if correct objects are rendered and pagination is not displayed
        checkDisplayedObjectFeedCardIDs(container, pageObjectIDs);
        expect(getFeedElements(container).pagination.container).toBeFalsy();
    });


    test("Multiple pages", async () => {
        // Render first page
        let { container, history } = renderWithWrappers(<App />, {
            route: "/"
        });

        // First page: wait for the page to load and check IDs of displayed objects
        expect(getFeedElements(container).placeholders.loading).toBeTruthy();
        await waitFor(() => expect(getFeedElements(container).placeholders.loading).toBeFalsy());
        expect(getFeedElements(container).feedCards.container).toBeTruthy();
        checkDisplayedObjectFeedCardIDs(container, getMockedPageObjectIDs(_mockPaginationInfo));

        // Get pagination and open next page
        let pagination = getFeedElements(container).pagination;
        fireEvent.click(pagination.buttons["next"]);
        
        // Second page: wait for load to end and check URL & displayed objects
        expect(getFeedElements(container).placeholders.loading).toBeTruthy();
        await waitFor(() => expect(getFeedElements(container).placeholders.loading).toBeFalsy());
        expect(history.entries[history.entries.length - 1].pathname).toEqual("/feed/2");
        checkDisplayedObjectFeedCardIDs(container, getMockedPageObjectIDs({ ..._mockPaginationInfo, page: 2 }));

        // Get last page button and open the page
        pagination = getFeedElements(container).pagination;
        expect(pagination.buttons[11]).toBeUndefined;   // test mock route handler returns a fixed total_items number of 100
        fireEvent.click(pagination.buttons[10]);

        // Last page: wait for load to end and check URL & displayed objects
        expect(getFeedElements(container).placeholders.loading).toBeTruthy();
        await waitFor(() => expect(getFeedElements(container).placeholders.loading).toBeFalsy());
        expect(history.entries[history.entries.length - 1].pathname).toEqual("/feed/10");
        checkDisplayedObjectFeedCardIDs(container, getMockedPageObjectIDs({ ..._mockPaginationInfo, page: 10 }));

        // Get previous page button and open the page
        pagination = getFeedElements(container).pagination;
        fireEvent.click(pagination.buttons["previous"]);

        // Previous to last page: wait for load to end and check URL & displayed objects
        expect(getFeedElements(container).placeholders.loading).toBeTruthy();
        await waitFor(() => expect(getFeedElements(container).placeholders.loading).toBeFalsy());
        expect(history.entries[history.entries.length - 1].pathname).toEqual("/feed/9");
        checkDisplayedObjectFeedCardIDs(container, getMockedPageObjectIDs({ ..._mockPaginationInfo, page: 9 }));

        // Get first page button and open the page
        pagination = getFeedElements(container).pagination;
        fireEvent.click(pagination.buttons[1]);

        // First page: wait for load to end and check URL & displayed objects
        expect(getFeedElements(container).placeholders.loading).toBeTruthy();
        await waitFor(() => expect(getFeedElements(container).placeholders.loading).toBeFalsy());
        expect(history.entries[history.entries.length - 1].pathname).toEqual("/");
        checkDisplayedObjectFeedCardIDs(container, getMockedPageObjectIDs(_mockPaginationInfo));
    });
});


describe("Object feed card", () => {
    test("Timestamp", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/"
        });

        // Wait for the page to load
        await waitFor(() => expect(getFeedElements(container).placeholders.loading).toBeFalsy());

        // Check if displayed timestamp equals to feed timestamp
        const feedCard = getFeedElements(container).feedCards.feedCards[0];
        let feedCardElements = getFeedCardElements(feedCard);
        const { objectID } = feedCardElements;

        let ed = new Date(store.getState().objects[objectID].feed_timestamp), dd = new Date(feedCardElements.timestamp.textContent);
        expect(ed.getFullYear() === dd.getFullYear() && ed.getMonth() === dd.getMonth() && ed.getDate() === dd.getDate()).toBeTruthy();

        // Check if modified at is used as a fallback for missing feed timestamp
        store.dispatch(addObjects([{ ...store.getState().objects[objectID], feed_timestamp: "" }]));
        feedCardElements = getFeedCardElements(feedCard);
        ed = new Date(store.getState().objects[objectID].modified_at), dd = new Date(feedCardElements.timestamp.textContent);
        expect(ed.getFullYear() === dd.getFullYear() && ed.getMonth() === dd.getMonth() && ed.getDate() === dd.getDate()).toBeTruthy();
    });


    test("Header", async () => {
        let { container, store, history } = renderWithWrappers(<App />, {
            route: "/"
        });

        // Wait for the page to load
        await waitFor(() => expect(getFeedElements(container).placeholders.loading).toBeFalsy());

        // Check if correct header is displayed
        const feedCard = getFeedElements(container).feedCards.feedCards[0];
        let feedCardElements = getFeedCardElements(feedCard);
        const { objectID } = feedCardElements;
        expect(feedCardElements.header.text).toEqual(store.getState().objects[objectID].object_name);

        // Check if header links to object view page
        fireEvent.click(feedCardElements.header.link);
        expect(history.entries[history.entries.length - 1].pathname).toEqual(`/objects/view/${objectID}`);
        await waitFor(() => expect(getObjectsViewCardElements({ container }).placeholders.loading).toBeFalsy());
    });


    test("Description", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/"
        });

        // Wait for the page to load
        await waitFor(() => expect(getFeedElements(container).placeholders.loading).toBeFalsy());

        // Check if correct object description is displayed
        const feedCard = getFeedElements(container).feedCards.feedCards[0];

        await waitFor(() => {
            let feedCardElements = getFeedCardElements(feedCard);
            const { objectID } = feedCardElements;
            const paragraph = feedCardElements.description.querySelector("p");
            expect(paragraph).toBeTruthy();
            expect(paragraph.textContent).toEqual(store.getState().objects[objectID].object_description);
        });
    });


    test("Tags", async () => {
        let { history, container, store } = renderWithWrappers(<App />, {
            route: "/"
        });

        // Wait for the page to load
        await waitFor(() => expect(getFeedElements(container).placeholders.loading).toBeFalsy());

        // Check if expected tag names are displayed
        const feedCard = getFeedElements(container).feedCards.feedCards[0];
        let feedCardElements = getFeedCardElements(feedCard);
        const { objectID } = feedCardElements;

        const state = store.getState();
        expect(state.objectsTags[objectID].length).toEqual(5);

        const renderedTagNames = [...feedCardElements.tags.tags].map(e => e.querySelector("span").textContent);
        expect(renderedTagNames.length).toEqual(5);
        
        state.objectsTags[objectID].forEach(tagID => expect(renderedTagNames.indexOf(state.tags[tagID].tag_name)).toBeGreaterThan(-1));

        // Check redireact to /tags/view page
        fireEvent.click(getInlineItem({ item: feedCardElements.tags.tags[0] }).link);
        expect(history.entries[history.entries.length - 1].pathname).toEqual("/tags/view");
        expect(history.entries[history.entries.length - 1].search).toEqual(`?tagIDs=1`);
        await waitFor(() => expect(getFeedElements(container).placeholders.loading).toBeFalsy());
    });
});
