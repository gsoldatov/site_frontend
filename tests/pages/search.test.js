import React from "react";
import { fireEvent, waitFor } from "@testing-library/dom";

import { getSearchPageElements, checkDisplayedSearchFeedCardIDs, submitSearchQueryWithNavbar } from "../_util/ui-search";
import { getObjectsViewCardElements } from "../_util/ui-objects-view";
import { resetTestConfig } from "../_mocks/config";
import { renderWithWrappers } from "../_util/render";
import { getFeedCardElements, getFeedElements } from "../_util/ui-index";
import { getInlineItem } from "../_util/ui-inline";
import { compareDates } from "../_util/data-checks";

import { App } from "../../src/components/app";


/*
    /search page tests.
*/
beforeEach(() => {
    // isolate fetch mock to avoid tests state collision because of cached data in fetch
    jest.isolateModules(() => {
        const { mockFetch, setFetchFail, addCustomRouteResponse } = require("../_mocks/mock-fetch");
        
        // Set test app configuration
        resetTestConfig();
        
        // reset fetch mocks
        jest.resetAllMocks();
        global.fetch = jest.fn(mockFetch);
        global.setFetchFail = jest.fn(setFetchFail);
        global.addCustomRouteResponse = jest.fn(addCustomRouteResponse);
    });
});


describe("Search page input", () => {
    test("Default input value", async () => {
        const query = "some text";
        const URLParams = new URLSearchParams();
        URLParams.set("q", query);

        let { container } = renderWithWrappers(<App />, {
            route: `/search?${URLParams.toString()}`
        });

        // Wait for the page to load
        await waitFor(() => expect(getSearchPageElements(container).feed.placeholders.loading).toBeFalsy());

        const searchElements = getSearchPageElements(container);
        expect(searchElements.search.input.value).toEqual(query);
    });


    test("Submit correct query with Enter keypress", async () => {
        const query = "some text";
        const URLParams = new URLSearchParams();
        URLParams.set("q", query);

        let { container, historyManager } = renderWithWrappers(<App />, {
            route: `/search?${URLParams.toString()}`
        });

        // Wait for the page to load
        await waitFor(() => expect(getSearchPageElements(container).feed.placeholders.loading).toBeFalsy());

        const searchElements = getSearchPageElements(container);
        const newQuery = "new text";
        fireEvent.change(searchElements.search.input, { target: { value: newQuery } });
        fireEvent.keyDown(searchElements.search.input, { key: "Enter", code: "Enter" });

        // Check if redirect occured
        historyManager.ensureCurrentURL("/search");
        expect(historyManager.getCurrentURLSeachParam("q")).toEqual(newQuery);

        // Wait for search fetch to end
        await waitFor(() => expect(getSearchPageElements(container).feed.placeholders.loading).toBeFalsy());
    });


    test("Submit correct query with button click", async () => {
        const query = "some text";
        const URLParams = new URLSearchParams();
        URLParams.set("q", query);

        let { container, historyManager } = renderWithWrappers(<App />, {
            route: `/search?${URLParams.toString()}`
        });

        // Wait for the page to load
        await waitFor(() => expect(getSearchPageElements(container).feed.placeholders.loading).toBeFalsy());

        const searchElements = getSearchPageElements(container);
        const newQuery = "new text";
        fireEvent.change(searchElements.search.input, { target: { value: newQuery } });
        fireEvent.click(searchElements.search.button);

        // Check if redirect occured
        historyManager.ensureCurrentURL("/search");
        expect(historyManager.getCurrentURLSeachParam("q")).toEqual(newQuery);

        // Wait for search fetch to end
        await waitFor(() => expect(getSearchPageElements(container).feed.placeholders.loading).toBeFalsy());
    });


    test("Submit an empty query", async () => {
        const query = "some text";
        const URLParams = new URLSearchParams();
        URLParams.set("q", query);

        let { container, historyManager } = renderWithWrappers(<App />, {
            route: `/search?${URLParams.toString()}`
        });

        // Wait for the page to load
        await waitFor(() => expect(getSearchPageElements(container).feed.placeholders.loading).toBeFalsy());

        const searchElements = getSearchPageElements(container);
        fireEvent.change(searchElements.search.input, { target: { value: "" } });
        fireEvent.click(searchElements.search.button);

        // Check if redirect did not occur
        historyManager.ensureCurrentURL("/search");
        expect(historyManager.getCurrentURLSeachParam("q")).toEqual(query);
    });


    test("Submit correct query with button click", async () => {
        // Queries and custom responses
        const query = "some text";
        const URLParams = new URLSearchParams();
        URLParams.set("q", query);
        const queryItems =  [
            { item_id: 1, item_type: "tag" },
            { item_id: 2, item_type: "object" }
        ];

        const newQuery = "new text";
        const newQueryItems =  [
            { item_id: 3, item_type: "tag" }, 
            { item_id: 4, item_type: "tag" }
        ];

        addCustomRouteResponse("/search", "POST", { generator: (body, handler) => {
            const bodyJSON = JSON.parse(body);
            
            const qI = bodyJSON.query.query_text === query ? queryItems : newQueryItems;

            return { status: 200, body: {
                ...query,
                items: qI,
                total_items: qI.length
            }};
        }});
        
        // Render page
        let { container, historyManager } = renderWithWrappers(<App />, {
            route: `/search?${URLParams.toString()}`
        });

        // Wait for the page to load
        await waitFor(() => expect(getSearchPageElements(container).feed.placeholders.loading).toBeFalsy());

        // Check if expected feed cards are displayed
        checkDisplayedSearchFeedCardIDs(container, queryItems);

        const searchElements = getSearchPageElements(container);
        fireEvent.change(searchElements.search.input, { target: { value: newQuery } });
        fireEvent.click(searchElements.search.button);

        // Check if redirect occured
        historyManager.ensureCurrentURL("/search");
        expect(historyManager.getCurrentURLSeachParam("q")).toEqual(newQuery);

        // Wait for search fetch to end
        await waitFor(() => expect(getSearchPageElements(container).feed.placeholders.loading).toBeFalsy());

        // Check if expected feed cards are displayed
        checkDisplayedSearchFeedCardIDs(container, newQueryItems);
    });
});


describe("Search page placeholder & fetch errors", () => {
    test("Placeholder & fetch error display", async () => {
        addCustomRouteResponse("/objects/view", "POST", { generator: body => {
            // Throw network error when fetching object information
            throw TypeError("NetworkError");
        }});

        // Render index page
        let { container, historyManager } = renderWithWrappers(<App />, {
            route: "/"
        });

        // Wait for the page to load
        await waitFor(() => expect(getFeedElements(container).placeholders.loading).toBeFalsy());

        // Enter and submit query
        await submitSearchQueryWithNavbar(container, historyManager, "some text");

        // Check if error message is displayed
        expect(getSearchPageElements(container).feed.placeholders.fetchError).toBeTruthy();
    });
});

describe("Search feed card display", () => {
    test("Expected feed card display", async () => {
        // Set custom response for search
        const queryItems =  [
            { item_id: 1, item_type: "tag" },
            { item_id: 2, item_type: "tag" },
            { item_id: 3, item_type: "object" },
            { item_id: 4, item_type: "object" }
        ];

        addCustomRouteResponse("/search", "POST", { generator: body => {
            return { status: 200, body: {
                ...JSON.parse(body).query,
                items: queryItems,
                total_items: queryItems.length
            }};
        }});

        // Render index page
        let { container, historyManager } = renderWithWrappers(<App />, {
            route: "/"
        });

        // Wait for the page to load
        await waitFor(() => expect(getFeedElements(container).placeholders.loading).toBeFalsy());

        // Enter and submit query
        await submitSearchQueryWithNavbar(container, historyManager, "some text");

        // Check if expected feed cards are displayed
        checkDisplayedSearchFeedCardIDs(container, queryItems);
    });
});
    

describe("Search feed > object card", () => {
    test("Timestamp", async () => {
        // Render index page
        let { container, storeManager, historyManager } = renderWithWrappers(<App />, {
            route: "/"
        });

        // Wait for the page to load
        await waitFor(() => expect(getFeedElements(container).placeholders.loading).toBeFalsy());

        // Enter and submit query
        await submitSearchQueryWithNavbar(container, historyManager, "some text");

        // Check if displayed timestamp equals to feed timestamp
        const feedCard = getSearchPageElements(container).feed.feedCards.feedCards[2];
        let feedCardElements = getFeedCardElements(feedCard);
        const { objectID } = feedCardElements;

        let ed = new Date(storeManager.store.getState().objects[objectID].feed_timestamp), dd = new Date(feedCardElements.timestamp.textContent);
        compareDates(ed, dd);

        // Check if modified at is used as a fallback for missing feed timestamp
        storeManager.objects.updateAttributes({ object_id: objectID, feed_timestamp: "" });
        feedCardElements = getFeedCardElements(feedCard);
        ed = new Date(storeManager.store.getState().objects[objectID].modified_at), dd = new Date(feedCardElements.timestamp.textContent);
        compareDates(ed, dd);
    });


    test("Header", async () => {
        // Render index page
        let { container, store, historyManager } = renderWithWrappers(<App />, {
            route: "/"
        });

        // Wait for the page to load
        await waitFor(() => expect(getFeedElements(container).placeholders.loading).toBeFalsy());

        // Enter and submit query
        await submitSearchQueryWithNavbar(container, historyManager, "some text");

        // Check if correct header is displayed
        const feedCard = getSearchPageElements(container).feed.feedCards.feedCards[2];
        let feedCardElements = getFeedCardElements(feedCard);
        const { objectID } = feedCardElements;
        expect(feedCardElements.header.text).toEqual(store.getState().objects[objectID].object_name);

        // Check if header links to object view page
        fireEvent.click(feedCardElements.header.link);
        historyManager.ensureCurrentURL(`/objects/view/${objectID}`);
        await waitFor(() => expect(getObjectsViewCardElements({ container }).placeholders.loading).toBeFalsy());
    });


    test("Description", async () => {
        // Show description for a particular object & hide for other
        addCustomRouteResponse("/objects/view", "POST", { generator: (body, handler) => {
            const response = handler(body);
            response.body.objects_attributes_and_tags.forEach(o => {
                if (o.object_id === 10) o.show_description = true;
                else o.show_description = false;
            });
    
            return response;
        }});

        // Render index page
        let { container, store, historyManager } = renderWithWrappers(<App />, {
            route: "/"
        });

        // Wait for the page to load
        await waitFor(() => expect(getFeedElements(container).placeholders.loading).toBeFalsy());

        // Enter and submit query
        await submitSearchQueryWithNavbar(container, historyManager, "some text");

        // Check if correct object description is displayed, if show_description = true
        let feedCard = getSearchPageElements(container).feed.feedCards.feedCards[2];      // objectID = 10

        await waitFor(() => {
            let feedCardElements = getFeedCardElements(feedCard);
            const { objectID } = feedCardElements;
            const paragraph = feedCardElements.description.querySelector("p");
            expect(paragraph).toBeTruthy();
            expect(paragraph.textContent).toEqual(store.getState().objects[objectID].object_description);
        });

        // Check if object description is not displayed, if show_description = false
        feedCard = getSearchPageElements(container).feed.feedCards.feedCards[3];      // objectID = 20
        expect(getFeedCardElements(feedCard).description).toBeFalsy();
    });


    test("Tags", async () => {
        // Render index page
        let { container, store, historyManager } = renderWithWrappers(<App />, {
            route: "/"
        });

        // Wait for the page to load
        await waitFor(() => expect(getFeedElements(container).placeholders.loading).toBeFalsy());

        // Enter and submit query
        await submitSearchQueryWithNavbar(container, historyManager, "some text");

        // Check if expected tag names are displayed
        const feedCard = getSearchPageElements(container).feed.feedCards.feedCards[2];
        let feedCardElements = getFeedCardElements(feedCard);
        const { objectID } = feedCardElements;

        const state = store.getState();
        expect(state.objectsTags[objectID].length).toEqual(5);

        const renderedTagNames = [...feedCardElements.tags.tags].map(e => e.querySelector("span").textContent);
        expect(renderedTagNames.length).toEqual(5);
        
        state.objectsTags[objectID].forEach(tagID => expect(renderedTagNames.indexOf(state.tags[tagID].tag_name)).toBeGreaterThan(-1));

        // Check redireact to /tags/view page
        fireEvent.click(getInlineItem({ item: feedCardElements.tags.tags[0] }).link);
        historyManager.ensureCurrentURL("/tags/view");
        historyManager.ensureCurrentURLParams("?tagIDs=1");
        await waitFor(() => expect(getFeedElements(container).placeholders.loading).toBeFalsy());
    });
});


describe("Search feed > tag card", () => {
    test("Timestamp", async () => {
        // Render index page
        let { container, store, historyManager } = renderWithWrappers(<App />, {
            route: "/"
        });

        // Wait for the page to load
        await waitFor(() => expect(getFeedElements(container).placeholders.loading).toBeFalsy());

        // Enter and submit query
        await submitSearchQueryWithNavbar(container, historyManager, "some text");

        // Check if displayed timestamp equals to modified_at
        const feedCard = getSearchPageElements(container).feed.feedCards.feedCards[0];
        let feedCardElements = getFeedCardElements(feedCard);
        const { tagID } = feedCardElements;

        let ed = new Date(store.getState().tags[tagID].modified_at), dd = new Date(feedCardElements.timestamp.textContent);
        compareDates(ed, dd);
    });


    test("Header", async () => {
        // Render index page
        let { container, historyManager } = renderWithWrappers(<App />, {
            route: "/"
        });

        // Wait for the page to load
        await waitFor(() => expect(getFeedElements(container).placeholders.loading).toBeFalsy());

        // Enter and submit query
        await submitSearchQueryWithNavbar(container, historyManager, "some text");

        // Check if correct header is displayed
        const feedCard = getSearchPageElements(container).feed.feedCards.feedCards[0];
        let feedCardElements = getFeedCardElements(feedCard);
        const { tagID } = feedCardElements;
        // expect(feedCardElements.header.text).toEqual(store.getState().tags[tagID].tag_name);

        // Check if header links to tag page
        fireEvent.click(feedCardElements.header.link);
        historyManager.ensureCurrentURL("/tags/view");
        historyManager.ensureCurrentURLParams("?tagIDs=1");
        await waitFor(() => expect(getFeedElements(container).placeholders.loading).toBeFalsy());
    });


    test("Description", async () => {
        // Render index page
        let { container, store, historyManager } = renderWithWrappers(<App />, {
            route: "/"
        });

        // Wait for the page to load
        await waitFor(() => expect(getFeedElements(container).placeholders.loading).toBeFalsy());

        // Enter and submit query
        await submitSearchQueryWithNavbar(container, historyManager, "some text");

        // Check if correct object description is displayed
        const feedCard = getSearchPageElements(container).feed.feedCards.feedCards[0];

        await waitFor(() => {
            let feedCardElements = getFeedCardElements(feedCard);
            const { tagID } = feedCardElements;
            const paragraph = feedCardElements.description.querySelector("p");
            expect(paragraph).toBeTruthy();
            expect(paragraph.textContent).toEqual(store.getState().tags[tagID].tag_description);
        });
    });
});


describe("Search feed pagination", () => {
    test("Single page", async () => {
        // Set custom response for search
        const queryItems =  [
            { item_id: 1, item_type: "tag" },
            { item_id: 2, item_type: "object" }
        ];

        addCustomRouteResponse("/search", "POST", { generator: body => {
            return { status: 200, body: {
                ...JSON.parse(body).query,
                items: queryItems,
                total_items: queryItems.length
            }};
        }});

        // Render index page
        let { container, historyManager } = renderWithWrappers(<App />, {
            route: "/"
        });

        // Wait for the page to load
        await waitFor(() => expect(getFeedElements(container).placeholders.loading).toBeFalsy());

        // Enter and submit query
        await submitSearchQueryWithNavbar(container, historyManager, "some text");

        // Check if correct feed cards are rendered and no pagination is displayed
        checkDisplayedSearchFeedCardIDs(container, queryItems);
        expect(getSearchPageElements(container).feed.pagination.container).toBeFalsy();
    });


    test("Multiple pages", async () => {
        // Set custom response for search (10 pages with 10 items on each)
        const getQueryItems = page =>  {
            const result = [];
            for (let i = 1; i <= 10; i++)
                result.push({
                    item_id: 10 * (page - 1) + i,
                    item_type: i % 2 === 0 ? "tag" : "object"
                });
            return result;
        };

        addCustomRouteResponse("/search", "POST", { generator: body => {
            const query = JSON.parse(body).query;
            
            if (query.page > 10) return { status: 404, body: { _error: "Nothing was found." }};

            return { status: 200, body: {
                ...query,
                items: getQueryItems(query.page),
                total_items: 100
            }};
        }});

        // Render first page
        let { container, historyManager } = renderWithWrappers(<App />, {
            route: "/"
        });

        // Wait for the page to load
        await waitFor(() => expect(getFeedElements(container).placeholders.loading).toBeFalsy());

        // Enter and submit query
        await submitSearchQueryWithNavbar(container, historyManager, "some text");

        // First page: check feed cards
        checkDisplayedSearchFeedCardIDs(container, getQueryItems(1));

        // Get pagination and open next page
        let pagination = getSearchPageElements(container).feed.pagination;
        fireEvent.click(pagination.buttons["next"]);

        // Second page: wait for load to end and check URL & displayed feed cards
        expect(getSearchPageElements(container).feed.placeholders.loading).toBeTruthy();
        await waitFor(() => expect(getSearchPageElements(container).feed.placeholders.loading).toBeFalsy());
        expect(historyManager.getCurrentURLSeachParam("p")).toEqual("2");
        checkDisplayedSearchFeedCardIDs(container, getQueryItems(2));

        // Get last page button and open the page
        pagination = getSearchPageElements(container).feed.pagination;
        expect(pagination.buttons[11]).toBeUndefined;
        fireEvent.click(pagination.buttons[10]);

        // Last page: wait for load to end and check URL & displayed feed cards
        expect(getSearchPageElements(container).feed.placeholders.loading).toBeTruthy();
        await waitFor(() => expect(getSearchPageElements(container).feed.placeholders.loading).toBeFalsy());
        expect(historyManager.getCurrentURLSeachParam("p")).toEqual("10");
        checkDisplayedSearchFeedCardIDs(container, getQueryItems(10));

        // Get previous page button and open the page
        pagination = getSearchPageElements(container).feed.pagination;
        fireEvent.click(pagination.buttons["previous"]);

        // Previous to last page: wait for load to end and check URL & displayed feed cards
        expect(getSearchPageElements(container).feed.placeholders.loading).toBeTruthy();
        await waitFor(() => expect(getSearchPageElements(container).feed.placeholders.loading).toBeFalsy());
        expect(historyManager.getCurrentURLSeachParam("p")).toEqual("9");
        checkDisplayedSearchFeedCardIDs(container, getQueryItems(9));

        // Get first page button and open the page
        pagination = getSearchPageElements(container).feed.pagination;
        fireEvent.click(pagination.buttons[1]);

        // First page: wait for load to end and check URL & displayed feed cards
        expect(getSearchPageElements(container).feed.placeholders.loading).toBeTruthy();
        await waitFor(() => expect(getSearchPageElements(container).feed.placeholders.loading).toBeFalsy());
        expect(historyManager.getCurrentURLSeachParam("p")).toBeFalsy();
        checkDisplayedSearchFeedCardIDs(container, getQueryItems(1));
    });
});
