import React from "react";
import { waitFor, fireEvent } from "@testing-library/react";

import { resetTestConfig } from "../../../_mocks/config";
import { createTestStore } from "../../../_util/create-test-store";
import { renderWithWrappers } from "../../../_util/render";
import { getTagsViewElements } from "../../../_util/ui-tags-view";

import { App } from "../../../../src/components/top-level/app";


/*
    /tags/view tag selection & selected tags display
*/
beforeEach(() => {
    // isolate fetch mock to avoid tests state collision because of cached data in fetch
    jest.isolateModules(() => {
        const { mockFetch, setFetchFail, addCustomRouteResponse } = require("../../../_mocks/mock-fetch");
        
        // Set test app configuration
        resetTestConfig();
        
        // reset fetch mocks
        jest.resetAllMocks();
        global.fetch = jest.fn(mockFetch);
        global.setFetchFail = jest.fn(setFetchFail);
        global.addCustomRouteResponse = jest.fn(addCustomRouteResponse);
    });
});

describe("Tag information", () => {
    test("Information block not displayed if no valid tags are selected", async () => {
            let { container } = renderWithWrappers(<App />, {
                route: "/tags/view?tagIDs=0,-1,asd"
            });

            // Check if no selected tags are rendered
            expect(getTagsViewElements(container).tagInformation.container).toBeNull();
    });


    test("Header text", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/tags/view?tagIDs=5"
        });

        // Wait for header text to be correctly displayed
        await waitFor(() => expect(getTagsViewElements(container).tagInformation.tagCard.header.textContent).toEqual(store.getState().tags[5].tag_name));
    });


    test("Header edit button for admin", async () => {
        let { container, historyManager } = renderWithWrappers(<App />, {
            route: "/tags/view?tagIDs=5"
        });

        // Wait for header text to be correctly displayed
        await waitFor(() => expect(getTagsViewElements(container).tagInformation.tagCard.editButton).toBeTruthy());
        fireEvent.click(getTagsViewElements(container).tagInformation.tagCard.editButton);
        historyManager.ensureCurrentURL("/tags/edit/5");
    });


    test("Header edit butoon for anonymous user", async () => {
        const { store } = createTestStore({ addAdminToken: false });
        let { container } = renderWithWrappers(<App />, {
            route: "/tags/view?tagIDs=5", store
        });

        // Wait for header text to be correctly displayed
        await waitFor(() => expect(getTagsViewElements(container).tagInformation.tagCard.header.textContent).toEqual(store.getState().tags[5].tag_name));

        // Check if edit button is displayed
        expect(getTagsViewElements(container).tagInformation.tagCard.editButton).toBeFalsy();
    });


    test("Header description", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/tags/view?tagIDs=5"
        });

        // Wait for header description to be rendered
        await waitFor(() => {
            const { description } = getTagsViewElements(container).tagInformation.tagCard;
            expect(description).toBeTruthy();
            expect(description.querySelector("p").textContent).toEqual(store.getState().tags[5].tag_description);
        });
    });


    test("Header description template", async () => {
        // Return tags without description
        addCustomRouteResponse("/tags/view", "POST", { generator: (body, handler) => {
            const response = handler(body);
            response.body.tags.forEach(tag => { tag.tag_description = "" });
            return response;
        }});

        let { container } = renderWithWrappers(<App />, {
            route: "/tags/view?tagIDs=5"
        });

        // Wait for header description to be rendered
        await waitFor(() => {
            const { description } = getTagsViewElements(container).tagInformation.tagCard;
            expect(description).toBeTruthy();
            expect(description.textContent).toEqual("<No description>");
        });
    });
});


describe("Previous & next buttons", () => {
    test("Single selected tag", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/tags/view?tagIDs=5"
        });

        // Wait for header text to be correctly displayed
        await waitFor(() => expect(getTagsViewElements(container).tagInformation.tagCard.header.textContent).toEqual(store.getState().tags[5].tag_name));

        // Check if previous & next buttons are not displayed
        expect(getTagsViewElements(container).tagInformation.prevButton).toBeFalsy();
        expect(getTagsViewElements(container).tagInformation.nextButton).toBeFalsy();
    });


    test("Multiple selected tags", async () => {
        const tagIDs = [5, 9, 13];
        let { container, store } = renderWithWrappers(<App />, {
            route: `/tags/view?tagIDs=${tagIDs}`
        });

        // Wait for header text of the first selected tag to be correctly displayed
        await waitFor(() => expect(getTagsViewElements(container).tagInformation.tagCard.header.textContent).toEqual(store.getState().tags[tagIDs[0]].tag_name));

        // Check if previous & next buttons are displayed
        const { prevButton, nextButton } = getTagsViewElements(container).tagInformation;
        expect(prevButton).toBeTruthy();
        expect(nextButton).toBeTruthy();

        // Click next button & check tag information display
        for (let i = 0; i < tagIDs.length; i++) {
            fireEvent.click(nextButton);
            await waitFor(() => {
                const tagID = tagIDs[(i + 1) % tagIDs.length];
                const { header, description } = getTagsViewElements(container).tagInformation.tagCard;
                expect(header.textContent).toEqual(store.getState().tags[tagID].tag_name);
                expect(description.querySelector("p").textContent).toEqual(store.getState().tags[tagID].tag_description);
            });
        }

        // Click prev button & check tag information display
        for (let i = tagIDs.length; i > 0; i--) {
            fireEvent.click(prevButton);
            await waitFor(() => {
                const tagID = tagIDs[i - 1];
                const { header, description } = getTagsViewElements(container).tagInformation.tagCard;
                expect(header.textContent).toEqual(store.getState().tags[tagID].tag_name);
                expect(description.querySelector("p").textContent).toEqual(store.getState().tags[tagID].tag_description);
            });
        }
    });
});
