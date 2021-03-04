import React from "react";
import { Route } from "react-router-dom";

import { fireEvent } from "@testing-library/react";
import { getByText, waitFor } from "@testing-library/dom";

import { compareArrays } from "./test-utils/data-checks";
import { renderWithWrappers} from "./test-utils/render";
import createStore from "../src/store/create-store";

import { EditTag } from "../src/components/tag";
import Tags from "../src/components/tags";
import { setObjectsTags } from "../src/actions/data-tags";
import { addObjects } from "../src/actions/data-objects";


/*
    Object tagging tests for /tags/:id page.
*/
beforeEach(() => {
    // isolate fetch mock to avoid tests state collision because of cached data in fetch
    jest.isolateModules(() => {
        const { mockFetch, setFetchFail } = require("./mocks/mock-fetch");
        // reset fetch mocks
        jest.resetAllMocks();
        global.fetch = jest.fn(mockFetch);
        global.setFetchFail = jest.fn(setFetchFail);
    });
});


test("Edit tag => delete a tag and check objects' tags", async () => {
    let store = createStore({ enableDebugLogging: false });
    let objects = [
        { object_id: 1, object_type: "link", object_name: "object one", object_description: "", 
            created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), current_tag_ids: [1, 2, 3] },
        { object_id: 2, object_type: "link", object_name: "object two", object_description: "", 
            created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), current_tag_ids: [1] },
        { object_id: 3, object_type: "link", object_name: "object three", object_description: "", 
            created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), current_tag_ids: [3, 4, 5] }
    ];

    store.dispatch(addObjects(objects));
    store.dispatch(setObjectsTags(objects));
    
    // Route component is required for matching (getting :id part of the URL in the EditObject component)
    let { container, history, debug } = renderWithWrappers(<Route exact path="/tags/:id"><EditTag /></Route>, {
        route: "/tags/1",
        store: store
    });

    // Wait for tag information to be displayed on the page and delete the tag
    await waitFor(() => getByText(container, "Tag Information"));
    let deleteButton = getByText(container, "Delete");
    fireEvent.click(deleteButton);
    let confimationDialogButtonYes = getByText(container, "Yes");
    fireEvent.click(confimationDialogButtonYes);

    // Wait for deletion to complete => check objects' tags
    await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe("/tags"));
    expect(compareArrays(Object.keys(store.getState().objectsTags), ["1", "3"])).toBeTruthy(); // 2 is removed, since it has no tags
    expect(compareArrays(store.getState().objectsTags[1], [2, 3])).toBeTruthy();        // 1 is updated
    expect(compareArrays(store.getState().objectsTags[3], [3, 4, 5])).toBeTruthy();     // 3 has the same tags
});


test("Tags => delete tags and check objects' tags", async () => {
    let store = createStore({ enableDebugLogging: false });
    let objects = [
        { object_id: 1, object_type: "link", object_name: "object one", object_description: "", 
            created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), current_tag_ids: [1, 2, 3, 4] },
        { object_id: 2, object_type: "link", object_name: "object two", object_description: "", 
            created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), current_tag_ids: [1, 2] },
        { object_id: 3, object_type: "link", object_name: "object three", object_description: "", 
            created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), current_tag_ids: [3, 4, 5] }
    ];

    store.dispatch(addObjects(objects));
    store.dispatch(setObjectsTags(objects));

    // Route component is required for matching (getting :id part of the URL in the Tag component)
    let { container } = renderWithWrappers(<Route exact path="/tags"><Tags /></Route>, {
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
    let deleteButton = getByText(container, "Delete");
    fireEvent.click(deleteButton);
    let sideMenu = container.querySelector(".vertical.menu");
    let dialog = sideMenu.querySelector(".side-menu-dialog");
    let dialogYesButton = getByText(dialog, "Yes");
    fireEvent.click(dialogYesButton);

    // Check if deleted tags were removed from the state and the page
    await waitFor(() => expect(Object.keys(store.getState().tags)).toEqual(expect.not.arrayContaining(["1", "2"])));
    expect(compareArrays(Object.keys(store.getState().objectsTags), ["1", "3"])).toBeTruthy(); // 2 is removed, since it has no tags
    expect(compareArrays(store.getState().objectsTags[1], [3, 4])).toBeTruthy();        // 1 is updated
    expect(compareArrays(store.getState().objectsTags[3], [3, 4, 5])).toBeTruthy();     // 3 has the same tags
});
