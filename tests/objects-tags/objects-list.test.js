import React from "react";

import { fireEvent } from "@testing-library/react";
import { getByText, getByTitle, waitFor, queryByText, queryAllByText } from "@testing-library/dom";

import { getStoreWithTwoSelectedObjects } from "../_mocks/data-objects-tags";
import { getSideMenuDialogControls, getSideMenuItem } from "../_util/ui-common";
import { getInlineInputField, getDropdownOptionsContainer } from "../_util/ui-objects-tags";
import { getInlineItem } from "../_util/ui-inline";
import { addAndRemoveTags } from "../_util/ui-objects-list";
import { compareArrays } from "../_util/data-checks";
import { renderWithWrappers } from "../_util/render";
import { getFeedElements } from "../_util/ui-index";

import { App } from "../../src/components/top-level/app";
import { getNonCachedTags } from "../../src/fetches/data-tags";


/*
    Object tagging tests for /objects/list page.
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


test("Check page without selected objects", async () => {    
    // Route component is required for matching (getting :id part of the URL in the Object component)
    let { container } = renderWithWrappers(<App />, {
        route: "/objects/list"
    });

    // Wait for the objects to be loaded
    await waitFor(() => getByText(container, "object #1"));

    // Check if common and partially applied are not rendered
    expect(container.querySelector(".inline-item-list-wrapper")).toBeNull();
    expect(queryByText(container, "Common Tags")).toBeNull();
    expect(queryByText(container, "Partially Applied Tags")).toBeNull();

    // Select & deselect all objects on the page
    let selectAllButton = getByTitle(container, "Select all objects on page");
    fireEvent.click(selectAllButton);
    let deselectAllButton = getByTitle(container, "Deselect all objects");
    fireEvent.click(deselectAllButton);

    // Check if common and partially applied are not rendered
    expect(container.querySelector(".inline-item-list-wrapper")).toBeNull();
    expect(queryByText(container, "Common Tags")).toBeNull();
    expect(queryByText(container, "Partially Applied Tags")).toBeNull();
});


test("Check tags appearance for one selected object", async () => {
    // Route component is required for matching (getting :id part of the URL in the Object component)
    let { container, store } = renderWithWrappers(<App />, {
        route: "/objects/list"
    });

    // Wait for the objects to be loaded and select an object
    await waitFor(() => getByText(container, "object #1"));

    // Select an object
    const mainObjectField = container.querySelector(".field-item-list");
    const objects = mainObjectField.querySelectorAll(".field-item");
    const firstObjectCheckbox = objects.item(0).querySelector(".field-item-checkbox");
    fireEvent.click(firstObjectCheckbox);

    // Check if common tags block is rendered
    getByText(container, "Common Tags");
    let commonTagsWrapper = container.querySelector(".inline-item-list-wrapper");
    expect(commonTagsWrapper).toBeTruthy();

    // Check if object's tags are rendered
    store.getState().objectsTags[1].forEach(tagID => getByText(commonTagsWrapper, `tag #${tagID}`));
    expect(commonTagsWrapper.querySelector(".inline-item-list-wrapper-content").childNodes.length).toEqual(store.getState().objectsTags[1].length + 1);   // tags + input toggle
});


test("Check tags appearance for two selected objects", async () => {
    let store = await getStoreWithTwoSelectedObjects();

    // Route component is required for matching (getting :id part of the URL in the Object component)
    let { container } = renderWithWrappers(<App />, {
        route: "/objects/list", store
    });

    // Wait for the objects to be loaded and select an object
    await waitFor(() => expect(queryAllByText(container, "object #1").length).toEqual(2));

    // Check if common and partially applied tag wrappers are rendered
    getByText(container, "Common Tags");
    getByText(container, "Partially Applied Tags");
    let wrappers = container.querySelectorAll(".inline-item-list-wrapper");
    expect(wrappers.length).toEqual(2);

    // Check if common and partially applied tag items are rendered
    [1, 2].forEach(tagID => getByText(wrappers[0], `tag #${tagID}`));
    [3, 4, 5, 6].forEach(tagID => getByText(wrappers[1], `tag #${tagID}`));

    expect(wrappers[0].querySelector(".inline-item-list-wrapper-content").childNodes.length).toEqual(3);   // 2 tags + input toggle
    expect(wrappers[1].querySelector(".inline-item-list-wrapper-content").childNodes.length).toEqual(4);   // 4 tags
});


test("Check common and partially applied tags on click behaviour", async () => {
    let store = await getStoreWithTwoSelectedObjects();

    // Route component is required for matching (getting :id part of the URL in the Object component)
    let { container } = renderWithWrappers(<App />, {
        route: "/objects/list", store
    });

    // Wait for the objects to be loaded and select an object
    await waitFor(() => expect(queryAllByText(container, "object #1").length).toEqual(2));
    
    // Check common tag on click events
    const tagOne = getInlineItem({ container, text: "tag #1" });
    fireEvent.click(tagOne.icons[0]);
    expect(store.getState().objectsUI.removedTagIDs.includes(1)).toBeTruthy();
    fireEvent.click(tagOne.icons[0]);
    expect(store.getState().objectsUI.removedTagIDs.includes(1)).toBeFalsy();

    // Check partially applied on click events
    const tagFive = getInlineItem({ container, text: "tag #5" });
    fireEvent.click(tagFive.icons[0]);
    expect(store.getState().objectsUI.addedTags.includes(5)).toBeTruthy();
    expect(store.getState().objectsUI.removedTagIDs.includes(5)).toBeFalsy();
    fireEvent.click(tagFive.icons[0]);
    expect(store.getState().objectsUI.addedTags.includes(5)).toBeFalsy();
    expect(store.getState().objectsUI.removedTagIDs.includes(5)).toBeTruthy();
    fireEvent.click(tagFive.icons[0]);
    expect(store.getState().objectsUI.addedTags.includes(5)).toBeFalsy();
    expect(store.getState().objectsUI.removedTagIDs.includes(5)).toBeFalsy();
});


test("Check tag links", async () => {
    let store = await getStoreWithTwoSelectedObjects();

    // Route component is required for matching (getting :id part of the URL in the Object component)
    let { container, historyManager } = renderWithWrappers(<App />, {
        route: "/objects/list", store
    });

    // Wait for the objects to be loaded and select an object
    await waitFor(() => expect(queryAllByText(container, "object #1").length).toEqual(2));

    // Add a new tag & check if it has no link
    let inputToggle = getByTitle(container, "Click to add tags");
    fireEvent.click(inputToggle);
    let input = getInlineInputField({ container });
    fireEvent.change(input, { target: { value: "new tag" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    expect(getInlineItem({ container, text: "new tag" }).link).toBeFalsy();

    // Check link of an existing common tag
    const existingCommonTag = getInlineItem({ container, text: "tag #1" });
    fireEvent.click(existingCommonTag.link);
    historyManager.ensureCurrentURL("/tags/view");
    historyManager.ensureCurrentURLParams("?tagIDs=1");
    await waitFor(() => expect(getFeedElements(container).placeholders.loading).toBeFalsy());

    // Go back to /objects/list page
    historyManager.push("/objects/list");
    await waitFor(() => expect(queryAllByText(container, "object #1").length).toEqual(2));

    // Check link of an existing partially applied tag
    const existingPartiallyAppliedTag = getInlineItem({ container, text: "tag #5" });
    fireEvent.click(existingPartiallyAppliedTag.link);
    historyManager.ensureCurrentURL("/tags/view");
    historyManager.ensureCurrentURLParams("?tagIDs=5");
    await waitFor(() => expect(getFeedElements(container).placeholders.loading).toBeFalsy());
});


test("Check tags input & added tags", async () => {
    let store = await getStoreWithTwoSelectedObjects();
    await store.dispatch(getNonCachedTags([7]));    // additional tags is required to test adding of an existing tag

    // Route component is required for matching (getting :id part of the URL in the Object component)
    let { container } = renderWithWrappers(<App />, {
        route: "/objects/list", store
    });

    // Wait for the objects to be loaded
    await waitFor(() => expect(queryAllByText(container, "object #1").length).toEqual(2));

    // Click the tag input toggle icon
    let inputToggle = getByTitle(container, "Click to add tags");
    expect(inputToggle).toBeTruthy();
    fireEvent.click(inputToggle);

    // Check if input is rendered
    let input = getInlineInputField({ container });
    expect(input).toBeTruthy();

    // Add & remove an "existing" tag
    fireEvent.change(input, { target: { value: "tag #7" } });
    expect(store.getState().objectsUI.tagsInput.inputText).toEqual("tag #7");
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });  // check enter key down handle
    let addedTag = getInlineItem({ container, text: "tag #7" });
    expect(addedTag.textSpan).toBeTruthy();
    fireEvent.click(addedTag.icons[0]);
    expect(getInlineItem({ container, text: "tag #7" }).item).toBeFalsy();

    // Add & remove a new tag
    fireEvent.change(input, { target: { value: "new tag" } });
    expect(store.getState().objectsUI.tagsInput.inputText).toEqual("new tag");
    let dropdown = getDropdownOptionsContainer({ container, currentQueryText: "new tag" });
    expect(dropdown).toBeTruthy();
    fireEvent.click(dropdown.childNodes[0]);    // click on "Add new tag" option
    addedTag = getInlineItem({ container, text: "new tag" });
    fireEvent.click(addedTag.icons[0]);
    expect(queryByText(container, "new tag")).toBeFalsy();
});


test("Check adding existing tags with tag input", async () => {
    let store = await getStoreWithTwoSelectedObjects();

    // Route component is required for matching (getting :id part of the URL in the Object component)
    let { container } = renderWithWrappers(<App />, {
        route: "/objects/list", store
    });

    // Wait for the objects to be loaded
    await waitFor(() => expect(queryAllByText(container, "object #1").length).toEqual(2));
    let inputToggle = getByTitle(container, "Click to add tags");
    fireEvent.click(inputToggle);
    let input = getInlineInputField({ container });

    // Add & remove an existing common tag & check if it was toggled for removal
    fireEvent.change(input, { target: { value: "tag #1" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    expect(store.getState().objectsUI.removedTagIDs.includes(1)).toBeTruthy();
    fireEvent.change(input, { target: { value: "tag #1" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    expect(store.getState().objectsUI.removedTagIDs.includes(1)).toBeFalsy();
    
    // Add & remove an existing partially applied tag & check if it was toggled for adding
    fireEvent.change(input, { target: { value: "tag #3" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    expect(store.getState().objectsUI.addedTags.includes(3)).toBeTruthy();
    fireEvent.change(input, { target: { value: "tag #3" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    expect(store.getState().objectsUI.addedTags.includes(3)).toBeFalsy();
});


test("Check object deletion", async () => {
    let store = await getStoreWithTwoSelectedObjects();

    // Route component is required for matching (getting :id part of the URL in the Object component)
    let { container } = renderWithWrappers(<App />, {
        route: "/objects/list", store
    });

    // Wait for the objects to be loaded
    await waitFor(() => expect(queryAllByText(container, "object #1").length).toEqual(2));
    
    // Delete selected objects
    let deleteButton = getSideMenuItem(container, "Delete");
    fireEvent.click(deleteButton);
    fireEvent.click(getSideMenuDialogControls(container).buttons["Yes"]);

    // Check if objects tags were removed
    await waitFor(() => expect(store.getState().objectsTags.hasOwnProperty("1")).toBeFalsy());
    expect(store.getState().objectsTags.hasOwnProperty("2")).toBeFalsy();
});


test("Check side menu", async () => {    
    const defaultItems = ["Add a New Object", "Edit Object", "Delete"];
    const updateItems = ["Update Tags", "Cancel Tag Update"];
    const checkIfDefaultItemsRendered = () => {
        defaultItems.forEach(item => getSideMenuItem(container, item));
        updateItems.forEach(item => expect(getSideMenuItem(container, item)).toBeFalsy());
    };
    const checkIfUpdateItemsRendered = () => {
        updateItems.forEach(item => getSideMenuItem(container, item));
        defaultItems.forEach(item => expect(getSideMenuItem(container, item)).toBeFalsy());
    };

    let store = await getStoreWithTwoSelectedObjects();

    // Route component is required for matching (getting :id part of the URL in the Object component)
    let { container } = renderWithWrappers(<App />, {
        route: "/objects/list", store
    });

    // Wait for the objects to be loaded
    await waitFor(() => expect(queryAllByText(container, "object #1").length).toEqual(2));
    checkIfDefaultItemsRendered();

    // Add a new tag
    let inputToggle = getByTitle(container, "Click to add tags");
    fireEvent.click(inputToggle);
    let input = getInlineInputField({ container });
    fireEvent.change(input, { target: { value: "tag #3" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    checkIfUpdateItemsRendered();
    
    // Cancel tag update
    let cancelTagUpdateButton = getSideMenuItem(container, "Cancel Tag Update");
    fireEvent.click(cancelTagUpdateButton);
    checkIfDefaultItemsRendered();
    expect(store.getState().objectsUI.addedTags.length).toEqual(0);

    // Remove a common tag
    let tagOne = getInlineItem({ container, text: "tag #1" });
    fireEvent.click(tagOne.icons[0]);
    checkIfUpdateItemsRendered();

    // Cancel tag update
    cancelTagUpdateButton = getSideMenuItem(container, "Cancel Tag Update");
    fireEvent.click(cancelTagUpdateButton);
    checkIfDefaultItemsRendered();
    expect(store.getState().objectsUI.removedTagIDs.length).toEqual(0);

    // Remove & stop removing a common tag
    fireEvent.click(tagOne.icons[0]);
    fireEvent.click(tagOne.icons[0]);
    checkIfDefaultItemsRendered();
    
    // Add partially applied tag for all
    let tagFive = getInlineItem({ container, text: "tag #5" });
    fireEvent.click(tagFive.icons[0]);
    checkIfUpdateItemsRendered();

    // Cancel tag update
    cancelTagUpdateButton = getSideMenuItem(container, "Cancel Tag Update");
    fireEvent.click(cancelTagUpdateButton);
    checkIfDefaultItemsRendered();
    expect(store.getState().objectsUI.addedTags.length).toEqual(0);

    // Remove partially applied tag for all
    fireEvent.click(tagFive.icons[0]);
    checkIfUpdateItemsRendered();

    // Cancel tag update
    cancelTagUpdateButton = getSideMenuItem(container, "Cancel Tag Update");
    fireEvent.click(cancelTagUpdateButton);
    checkIfDefaultItemsRendered();
    expect(store.getState().objectsUI.removedTagIDs.length).toEqual(0);

    // Add => remove => reset partially applied tag
    fireEvent.click(tagFive.icons[0]);
    fireEvent.click(tagFive.icons[0]);
    fireEvent.click(tagFive.icons[0]);
    checkIfDefaultItemsRendered();
});


test("Check tags update + editedObjects reset", async () => {
    let store = await getStoreWithTwoSelectedObjects();
    await store.dispatch(getNonCachedTags([7]));    // additional tags is required to test adding of an existing tag

    // Add & remove tags for two objects on the /objects/edit/:id page without saving the changes
    let {container, historyManager } = renderWithWrappers(<App />, {
        route: "/objects/edit/1", store
    });

    await waitFor(() => getByText(container, "Object Information"));
    await addAndRemoveTags(container, store);

    historyManager.push("/objects/edit/3");
    await waitFor(() => getByText(container, "Object Information"));
    await addAndRemoveTags(container, store);

    // Wait for the /objects page to be loaded
    historyManager.push("/objects/list");
    await waitFor(() => expect(queryAllByText(container, "object #1").length).toEqual(2));

    // Add an existing tag
    let inputToggle = getByTitle(container, "Click to add tags");
    fireEvent.click(inputToggle);
    let input = getInlineInputField({ container });
    fireEvent.change(input, { target: { value: "tag #7" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    // Add a new tag
    fireEvent.change(input, { target: { value: "new tag" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    // Remove an existing common tag
    let tagOne = getInlineItem({ container, text: "tag #1" });
    fireEvent.click(tagOne.icons[0]);

    // Add a partially applied tag
    let tagThree = getInlineItem({ container, text: "tag #3" });
    fireEvent.click(tagThree.icons[0]);

    // Remove a partially applied tag
    let tagFour = getInlineItem({ container, text: "tag #4" });
    fireEvent.click(tagFour.icons[0]);
    fireEvent.click(tagFour.icons[0]);

    // Click update tags button
    let updateTagsButton = getSideMenuItem(container, "Update Tags");
    fireEvent.click(updateTagsButton);

    // Wait for tags to update
    await waitFor(() => expect(getSideMenuItem(container, "Update Tags")).toBeFalsy());

    // Check objects tags & modified_at time
    expect(compareArrays([-1, 2, 3, 7], store.getState().objectsTags[1].sort())).toBeTruthy();
    expect(compareArrays([-1, 2, 3, 5, 6, 7], store.getState().objectsTags[2].sort())).toBeTruthy();
    const expectedModifiedAt = (new Date(2001, 0, 1, 12, 30, 0)).toISOString();
    expect(store.getState().objects[1].modified_at).toEqual(expectedModifiedAt);
    expect(store.getState().objects[2].modified_at).toEqual(expectedModifiedAt);

    // Check if correct common and partially applied tags are displayed
    let wrappers = container.querySelectorAll(".inline-item-list-wrapper");
    expect(wrappers.length).toEqual(2);

    // Check if common and partially applied tag items are rendered
    [2, 3, 7].forEach(tagID => getByText(wrappers[0], `tag #${tagID}`));
    getByText(wrappers[0], "new tag");
    [5, 6].forEach(tagID => getByText(wrappers[1], `tag #${tagID}`));

    expect(wrappers[0].querySelector(".inline-item-list-wrapper-content").childNodes.length).toEqual(5);   // 4 tags + input toggle
    expect(wrappers[1].querySelector(".inline-item-list-wrapper-content").childNodes.length).toEqual(2);   // 2 tags

    // Check if object with id = 1 was reset in state.editedObjects (tags and modified_at)
    const objectOneTags = store.getState().objectsTags[1].slice(), objectOneEditedTags = store.getState().editedObjects[1].currentTagIDs.slice();
    expect(compareArrays(objectOneTags.sort(), objectOneEditedTags.sort())).toBeTruthy();
    expect(store.getState().editedObjects[1].addedTags.length).toEqual(0);
    expect(store.getState().editedObjects[1].removedTagIDs.length).toEqual(0);
    expect(store.getState().editedObjects[1].modified_at).toEqual(expectedModifiedAt);

    // Check if object with id = 3 was not reset in state.editedObjects
    expect(store.getState().editedObjects[3].addedTags.length).toEqual(1);
    expect(store.getState().editedObjects[3].removedTagIDs.length).toEqual(1);
});
