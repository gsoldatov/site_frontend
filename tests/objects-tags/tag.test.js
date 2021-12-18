import React from "react";
import { Route } from "react-router-dom";

import { fireEvent } from "@testing-library/react";
import { getByText, waitFor } from "@testing-library/dom";

import { compareArrays } from "../_util/data-checks";
import { getSideMenuDialogControls, getSideMenuItem } from "../_util/ui-common";
import { renderWithWrappers } from "../_util/render";
import { createTestStore } from "../_util/create-test-store";

import { App } from "../../src/components/top-level/app";
import { EditTag } from "../../src/components/top-level/tag";
import Tags from "../../src/components/top-level/tags";
import { setObjectsTags } from "../../src/actions/data-tags";
import { addObjects } from "../../src/actions/data-objects";
import { generateObjectAttributes } from "../_mocks/data-objects";


/*
    Object tagging tests for /tags/:id page.
*/
beforeEach(() => {
    // isolate fetch mock to avoid tests state collision because of cached data in fetch
    jest.isolateModules(() => {
        const { mockFetch, setFetchFail } = require("../_mocks/mock-fetch");
        // reset fetch mocks
        jest.resetAllMocks();
        global.fetch = jest.fn(mockFetch);
        global.setFetchFail = jest.fn(setFetchFail);
    });
});


test("Edit tag => delete a tag and check objects' tags", async () => {
    let store = createTestStore({ enableDebugLogging: false });
    
    let objects = [
        generateObjectAttributes(1, {
            object_type: "link", object_name: "object one", object_description: "", 
            created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), current_tag_ids: [1, 2, 3] 
        }),
        generateObjectAttributes(2, {
            object_type: "link", object_name: "object two", object_description: "", 
            created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), current_tag_ids: [1] 
        }),
        generateObjectAttributes(3, {
            object_type: "link", object_name: "object three", object_description: "", 
            created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), current_tag_ids: [3, 4, 5] 
        })
    ];

    store.dispatch(addObjects(objects));
    store.dispatch(setObjectsTags(objects));
    
    let { container, history } = renderWithWrappers(<App />, {
        route: "/tags/1",
        store: store
    });

    // Wait for tag information to be displayed on the page and delete the tag
    await waitFor(() => getByText(container, "Tag Information"));
    let deleteButton = getSideMenuItem(container, "Delete");
    fireEvent.click(deleteButton);
    fireEvent.click(getSideMenuDialogControls(container).buttons["Yes"]);

    // Wait for deletion to complete => check objects' tags
    await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe("/tags"));
    expect(compareArrays(Object.keys(store.getState().objectsTags), ["1", "3"])).toBeTruthy(); // 2 is removed, since it has no tags
    expect(compareArrays(store.getState().objectsTags[1], [2, 3])).toBeTruthy();        // 1 is updated
    expect(compareArrays(store.getState().objectsTags[3], [3, 4, 5])).toBeTruthy();     // 3 has the same tags
});


test("Tags => delete tags and check objects' tags", async () => {
    let store = createTestStore({ enableDebugLogging: false });
    let objects = [
        generateObjectAttributes(1, {
            object_type: "link", object_name: "object one", object_description: "", 
            created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), current_tag_ids: [1, 2, 3, 4] 
        }),
        generateObjectAttributes(2, {
            object_type: "link", object_name: "object two", object_description: "", 
            created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), current_tag_ids: [1, 2] 
        }),
        generateObjectAttributes(3, {
            object_type: "link", object_name: "object three", object_description: "", 
            created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), current_tag_ids: [3, 4, 5] 
        })
    ];

    store.dispatch(addObjects(objects));
    store.dispatch(setObjectsTags(objects));

    // Route component is required for matching (getting :id part of the URL in the Tag component)
    let { container } = renderWithWrappers(<App />, {
        route: "/tags",
        store: store
    });

    // Wait for the tags to be loaded
    await waitFor(() => getByText(container, "tag #1"));

    // Select two tags
    let mainTagField = container.querySelector(".field-item-list");
    let tags = mainTagField.querySelectorAll(".field-item");
    let firstTagCheckbox = tags.item(0).querySelector(".field-item-checkbox");
    let secondTagCheckbox = tags.item(1).querySelector(".field-item-checkbox");
    fireEvent.click(firstTagCheckbox);
    fireEvent.click(secondTagCheckbox);

    // Delete selected tags
    let deleteButton = getSideMenuItem(container, "Delete");
    fireEvent.click(deleteButton);
    fireEvent.click(getSideMenuDialogControls(container).buttons["Yes"]);

    // Check if deleted tags were removed from the state and the page
    await waitFor(() => expect(Object.keys(store.getState().tags)).toEqual(expect.not.arrayContaining(["1", "2"])));
    expect(compareArrays(Object.keys(store.getState().objectsTags), ["1", "3"])).toBeTruthy(); // 2 is removed, since it has no tags
    expect(compareArrays(store.getState().objectsTags[1], [3, 4])).toBeTruthy();        // 1 is updated
    expect(compareArrays(store.getState().objectsTags[3], [3, 4, 5])).toBeTruthy();     // 3 has the same tags
});
