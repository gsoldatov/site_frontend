import React from "react";
import { waitFor, fireEvent } from "@testing-library/react";

import { resetTestConfig } from "../../../_mocks/config";
import { renderWithWrappers } from "../../../_util/render";
import { getTagsViewElements, checkDisplayedTagsViewFeedCardIDs } from "../../../_util/ui-tags-view";
import { getInlineItem } from "../../../_util/ui-inline";

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

test("Invalid tags are not displayed", async () => {
        let { container } = renderWithWrappers(<App />, {
            route: "/tags/view?tagIDs=0,-1,asd"
        });

        // Check if no selected tags are rendered
        expect(getTagsViewElements(container).selectedTags.tags).toBeNull();
});


test("Valid tags are displayed", async () => {
    const validTags = [5, 10, 15];
    let { container, store } = renderWithWrappers(<App />, {
        route: `/tags/view?tagIDs=0,-1,${validTags}`
    });

    // Wait for valid selected tags to be rendered in correct order
    await waitFor(() => {
        const { tags } = getTagsViewElements(container).selectedTags;
        expect(tags.length).toEqual(validTags.length);
        
        for (let i = 0; i < validTags.length; i++) {
            const tagID = validTags[i];
            const item = getInlineItem({ item: tags[i] });
            expect(item.linkTagID).toEqual(tagID);
            expect(item.textSpan.textContent).toEqual(store.getState().tags[tagID].tag_name);
        }
    });
});


test("Tag item on click redirect", async () => {
    // Return different object IDs for different selected tags
    const firstObjectIDs = [5, 25, 45], secondObjectIDs = [100, 200, 300];
    addCustomRouteResponse("/objects/get_page_object_ids", "POST", { generator: (body, handler) => {
        const tagIDs = JSON.parse(body).pagination_info.tags_filter;
        const response = handler(body);
        if (tagIDs[0] === 5) response.body.pagination_info.object_ids = firstObjectIDs;
        if (tagIDs[0] === 10) response.body.pagination_info.object_ids = secondObjectIDs;
        return response;
    }});

    let { container, historyManager } = renderWithWrappers(<App />, {
        route: `/tags/view?tagIDs=5,10&p=2`
    });

    // Wait for valid selected tags to be rendered
    await waitFor(() => expect(getTagsViewElements(container).selectedTags.tags.length).toEqual(2));

    // Click on tag item and check if redirect occured
    const item = getTagsViewElements(container).selectedTags.tags[1];
    fireEvent.click(getInlineItem({ item }).link);
    historyManager.ensureCurrentURL("/tags/view");
    historyManager.ensureCurrentURLParams("?tagIDs=10");
    await waitFor(() => expect(getTagsViewElements(container).feed.placeholders.loading).toBeFalsy());

    // Check if correct objects are rendered
    checkDisplayedTagsViewFeedCardIDs(container, secondObjectIDs);
});


test("Select a tag with dropdown", async () => {
    // Return different object IDs for different selected tags
    const firstObjectIDs = [5, 25, 45], secondObjectIDs = [100, 200, 300];
    addCustomRouteResponse("/objects/get_page_object_ids", "POST", { generator: (body, handler) => {
        const tagIDs = JSON.parse(body).pagination_info.tags_filter;
        const response = handler(body);
        if (tagIDs.length === 2) response.body.pagination_info.object_ids = firstObjectIDs;
        if (tagIDs.length === 3) response.body.pagination_info.object_ids = secondObjectIDs;
        return response;
    }});

    const newSelectedTagName = "new selected tag", newSelectedTagID = 50;
    // Return a fixed id for new selected tag
    addCustomRouteResponse("/tags/search", "POST", { status: 200, body: { tag_ids: [newSelectedTagID, 100, 200] }});

    // Return a fixed name for new selected tag
    addCustomRouteResponse("/tags/view", "POST", { generator: (body, handler) => {
        const response = handler(body);
        response.body.tags.forEach(tag => { if (tag.tag_id === newSelectedTagID) tag.tag_name = newSelectedTagName; });
        return response;
    }});

    let { container, historyManager } = renderWithWrappers(<App />, {
        route: `/tags/view?tagIDs=5,10&p=2`
    });

    // Wait for valid selected tags to be rendered
    await waitFor(() => expect(getTagsViewElements(container).selectedTags.tags.length).toEqual(2));

    // Add a new tag with dropdown
    fireEvent.change(getTagsViewElements(container).dropdown.input, { target: { value: newSelectedTagName } });
    await waitFor(() => expect(getTagsViewElements(container).dropdown.optionsByText[newSelectedTagName]).toBeTruthy());
    fireEvent.click(getTagsViewElements(container).dropdown.optionsByText[newSelectedTagName]);

    // Check if redirect occured
    historyManager.ensureCurrentURL("/tags/view");
    historyManager.ensureCurrentURLParams(`?tagIDs=5,10,${newSelectedTagID}`, true);
    await waitFor(() => expect(getTagsViewElements(container).selectedTags.tags.length).toEqual(3));

    // Check if correct objects are rendered
    await waitFor(() => checkDisplayedTagsViewFeedCardIDs(container, secondObjectIDs));
});


test("Remove tag selection", async () => {
    // Return different object IDs for different selected tags
    const firstObjectIDs = [5, 25, 45], secondObjectIDs = [100, 200, 300];
    addCustomRouteResponse("/objects/get_page_object_ids", "POST", { generator: (body, handler) => {
        const tagIDs = JSON.parse(body).pagination_info.tags_filter;
        const response = handler(body);
        if (tagIDs.length === 2) response.body.pagination_info.object_ids = firstObjectIDs;
        if (tagIDs.length === 1) response.body.pagination_info.object_ids = secondObjectIDs;
        return response;
    }});

    let { container, historyManager } = renderWithWrappers(<App />, {
        route: `/tags/view?tagIDs=5,10&p=2`
    });

    // Wait for valid selected tags to be rendered
    await waitFor(() => expect(getTagsViewElements(container).selectedTags.tags.length).toEqual(2));

    // Deselect a tag
    const item = getTagsViewElements(container).selectedTags.tags[1];
    fireEvent.click(getInlineItem({ item }).icons[0]);

    // Check if redirect occured
    historyManager.ensureCurrentURL("/tags/view");
    historyManager.ensureCurrentURLParams("?tagIDs=5");
    
    await waitFor(() => expect(getTagsViewElements(container).selectedTags.tags.length).toEqual(1));
    expect(getInlineItem({ item: getTagsViewElements(container).selectedTags.tags[0] }).linkTagID).toEqual(5);

    // Check if correct objects are rendered
    await waitFor(() => checkDisplayedTagsViewFeedCardIDs(container, secondObjectIDs));
});
