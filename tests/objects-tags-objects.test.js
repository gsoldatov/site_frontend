import React from "react";
import { Route } from "react-router-dom";

import { fireEvent } from "@testing-library/react";
import { getByText, getByTitle, waitFor, queryByText, queryAllByText, getByPlaceholderText, queryByTitle } from '@testing-library/dom'

import { mockFetch, resetMocks } from "./mocks/mock-fetch";
import { renderWithWrappers, getStoreWithTwoSelectedObjects, compareArrays } from "./test-utils";

import Objects from "../src/components/objects";
import { getNonCachedTags } from "../src/actions/tags";


beforeAll(() => { global.fetch = jest.fn(mockFetch); });
afterAll(() => { jest.resetAllMocks(); });
afterEach(() => { resetMocks(); });


test("Check page without selected objects", async () => {    
    // Route component is required for matching (getting :id part of the URL in the Object component)
    let { container } = renderWithWrappers(<Route exact path="/objects"><Objects /></Route>, {
        route: "/objects"
    });

    // Wait for the objects to be loaded
    await waitFor(() => getByText(container, "object #1"));

    // Check if common and partially applied are not rendered
    expect(container.querySelector(".inline-item-list-wrapper")).toBeNull();
    expect(queryByText(container, "Common tags")).toBeNull();
    expect(queryByText(container, "Partially applied tags")).toBeNull();

    // Select & deselect all objects on the page
    let selectAllButton = getByTitle(container, "Select all objects on page");
    fireEvent.click(selectAllButton);
    let deselectAllButton = getByTitle(container, "Deselect all objects");
    fireEvent.click(deselectAllButton);

    // Check if common and partially applied are not rendered
    expect(container.querySelector(".inline-item-list-wrapper")).toBeNull();
    expect(queryByText(container, "Common tags")).toBeNull();
    expect(queryByText(container, "Partially applied tags")).toBeNull();
});


test("Check tags appearance for one selected object", async () => {
    // Route component is required for matching (getting :id part of the URL in the Object component)
    let { container, store } = renderWithWrappers(<Route exact path="/objects"><Objects /></Route>, {
        route: "/objects"
    });

    // Wait for the objects to be loaded and select an object
    await waitFor(() => getByText(container, "object #1"));

    // Select an object
    const mainObjectField = container.querySelector(".field-item-list");
    const objects = mainObjectField.querySelectorAll(".field-item");
    const firstObjectCheckbox = objects.item(0).querySelector(".field-item-checkbox");
    fireEvent.click(firstObjectCheckbox);

    // Check if common tags block is rendered
    getByText(container, "Common tags");
    let commonTagsWrapper = container.querySelector(".inline-item-list-wrapper");
    expect(commonTagsWrapper).toBeTruthy();

    // Check if object's tags are rendered
    store.getState().objectsTags[1].forEach(tagID => getByText(commonTagsWrapper, `tag #${tagID}`));
    expect(commonTagsWrapper.childNodes.length).toEqual(store.getState().objectsTags[1].length + 1);   // tags + input toggle
});


test("Check tags appearance for two selected objects", async () => {
    let store = await getStoreWithTwoSelectedObjects();

    // Route component is required for matching (getting :id part of the URL in the Object component)
    let { container } = renderWithWrappers(<Route exact path="/objects"><Objects /></Route>, {
        route: "/objects",
        store: store
    });

    // Wait for the objects to be loaded and select an object
    await waitFor(() => expect(queryAllByText(container, "object #1").length).toEqual(2));

    // Check if common and partially applied tag wrappers are rendered
    getByText(container, "Common tags");
    getByText(container, "Partially applied tags");
    let wrappers = container.querySelectorAll(".inline-item-list-wrapper");
    expect(wrappers.length).toEqual(2);

    // Check if common and partially applied tag items are rendered
    [1, 2].forEach(tagID => getByText(wrappers[0], `tag #${tagID}`));
    [3, 4, 5, 6].forEach(tagID => getByText(wrappers[1], `tag #${tagID}`));

    expect(wrappers[0].childNodes.length).toEqual(3);   // 2 tags + input toggle
    expect(wrappers[1].childNodes.length).toEqual(4);   // 4 tags
});


test("Check common and partially applied tags on click behaviour", async () => {
    let store = await getStoreWithTwoSelectedObjects();

    // Route component is required for matching (getting :id part of the URL in the Object component)
    let { container } = renderWithWrappers(<Route exact path="/objects"><Objects /></Route>, {
        route: "/objects",
        store: store
    });

    // Wait for the objects to be loaded and select an object
    await waitFor(() => expect(queryAllByText(container, "object #1").length).toEqual(2));
    
    // Check common tag on click events
    const tagOne = getByText(container, "tag #1");
    fireEvent.click(tagOne);
    expect(store.getState().objectsUI.removedTagIDs.includes(1)).toBeTruthy();
    fireEvent.click(tagOne);
    expect(store.getState().objectsUI.removedTagIDs.includes(1)).toBeFalsy();

    // Check partially applied on click events
    const tagFive = getByText(container, "tag #5");
    fireEvent.click(tagFive);
    expect(store.getState().objectsUI.addedTags.includes(5)).toBeTruthy();
    expect(store.getState().objectsUI.removedTagIDs.includes(5)).toBeFalsy();
    fireEvent.click(tagFive);
    expect(store.getState().objectsUI.addedTags.includes(5)).toBeFalsy();
    expect(store.getState().objectsUI.removedTagIDs.includes(5)).toBeTruthy();
    fireEvent.click(tagFive);
    expect(store.getState().objectsUI.addedTags.includes(5)).toBeFalsy();
    expect(store.getState().objectsUI.removedTagIDs.includes(5)).toBeFalsy();
});


test("Check tags input & added tags", async () => {
    let store = await getStoreWithTwoSelectedObjects();
    await store.dispatch(getNonCachedTags([7]));    // additional tags is required to test adding of an existing tag

    // Route component is required for matching (getting :id part of the URL in the Object component)
    let { container } = renderWithWrappers(<Route exact path="/objects"><Objects /></Route>, {
        route: "/objects",
        store: store
    });

    // Wait for the objects to be loaded
    await waitFor(() => expect(queryAllByText(container, "object #1").length).toEqual(2));

    // Click the tag input toggle icon
    let inputToggle = getByTitle(container, "Click to add tags");
    expect(inputToggle).toBeTruthy();
    fireEvent.click(inputToggle);

    // Check if input is rendered (without add tag button)
    let input = getByPlaceholderText(container, "Enter tag name...");
    expect(queryByTitle(container, "Add a new tag")).toBeFalsy();

    // Add & remove an existing tag
    fireEvent.change(input, { target: { value: "tag #7" } });
    expect(store.getState().objectsUI.tagsInput.inputText).toEqual("tag #7");
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });  // check enter key down handle
    let addedTag = getByText(container, "tag #7");
    fireEvent.click(addedTag);
    expect(queryByText(container, "tag #7")).toBeFalsy();

    // Add & remove a new tag
    fireEvent.change(input, { target: { value: "new tag" } });
    expect(store.getState().objectsUI.tagsInput.inputText).toEqual("new tag");
    let addTagButton = getByTitle(container, "Add a new tag");  // check add tag button
    fireEvent.click(addTagButton);
    addedTag = getByText(container, "new tag");
    fireEvent.click(addedTag);
    expect(queryByText(container, "new tag")).toBeFalsy();
});


test("Check adding existing tags with tag input", async () => {
    let store = await getStoreWithTwoSelectedObjects();

    // Route component is required for matching (getting :id part of the URL in the Object component)
    let { container } = renderWithWrappers(<Route exact path="/objects"><Objects /></Route>, {
        route: "/objects",
        store: store
    });

    // Wait for the objects to be loaded
    await waitFor(() => expect(queryAllByText(container, "object #1").length).toEqual(2));
    let inputToggle = getByTitle(container, "Click to add tags");
    fireEvent.click(inputToggle);
    let input = getByPlaceholderText(container, "Enter tag name...");

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


test("Check adding existing tags with tag input", async () => {
    let store = await getStoreWithTwoSelectedObjects();

    // Route component is required for matching (getting :id part of the URL in the Object component)
    let { container } = renderWithWrappers(<Route exact path="/objects"><Objects /></Route>, {
        route: "/objects",
        store: store
    });

    // Wait for the objects to be loaded
    await waitFor(() => expect(queryAllByText(container, "object #1").length).toEqual(2));
    
    // Delete selected objects
    let deleteButton = getByText(container, "Delete");
    fireEvent.click(deleteButton);
    let sideMenu = container.querySelector(".vertical.menu");
    let dialog = sideMenu.querySelector(".side-menu-dialog");
    let dialogYesButton = getByText(dialog, "Yes");
    fireEvent.click(dialogYesButton);

    // Check if objects tags were removed
    await waitFor(() => expect(store.getState().objectsTags.hasOwnProperty("1")).toBeFalsy());
    expect(store.getState().objectsTags.hasOwnProperty("2")).toBeFalsy();
});


test("Check side menu", async () => {    
    const defaultItems = ["Add Object", "Edit Object", "Delete"];
    const updateItems = ["Update Tags", "Cancel Tag Update"];
    const checkIfDefaultItemsRendered = () => {
        defaultItems.forEach(item => getByText(sideMenu, item));
        updateItems.forEach(item => expect(queryByText(sideMenu, item)).toBeFalsy());
    };
    const checkIfUpdateItemsRendered = () => {
        updateItems.forEach(item => getByText(sideMenu, item));
        defaultItems.forEach(item => expect(queryByText(sideMenu, item)).toBeFalsy());
    };

    let store = await getStoreWithTwoSelectedObjects();

    // Route component is required for matching (getting :id part of the URL in the Object component)
    let { container } = renderWithWrappers(<Route exact path="/objects"><Objects /></Route>, {
        route: "/objects",
        store: store
    });

    // Wait for the objects to be loaded
    await waitFor(() => expect(queryAllByText(container, "object #1").length).toEqual(2));
    let sideMenu = container.querySelector(".vertical.menu");
    checkIfDefaultItemsRendered();

    // Add a new tag
    let inputToggle = getByTitle(container, "Click to add tags");
    fireEvent.click(inputToggle);
    let input = getByPlaceholderText(container, "Enter tag name...");
    fireEvent.change(input, { target: { value: "tag #3" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    checkIfUpdateItemsRendered();
    
    // Cancel tag update
    let cancelTagUpdateButton = getByText(sideMenu, "Cancel Tag Update");
    fireEvent.click(cancelTagUpdateButton);
    checkIfDefaultItemsRendered();
    expect(store.getState().objectsUI.addedTags.length).toEqual(0);

    // Remove a common tag
    let tagOne = getByText(container, "tag #1");
    fireEvent.click(tagOne);
    checkIfUpdateItemsRendered();

    // Cancel tag update
    cancelTagUpdateButton = getByText(sideMenu, "Cancel Tag Update");
    fireEvent.click(cancelTagUpdateButton);
    checkIfDefaultItemsRendered();
    expect(store.getState().objectsUI.removedTagIDs.length).toEqual(0);

    // Remove & stop removing a common tag
    fireEvent.click(tagOne);
    fireEvent.click(tagOne);
    checkIfDefaultItemsRendered();
    
    // Add partially applied tag for all
    let tagFive = getByText(container, "tag #5");
    fireEvent.click(tagFive);
    checkIfUpdateItemsRendered();

    // Cancel tag update
    cancelTagUpdateButton = getByText(sideMenu, "Cancel Tag Update");
    fireEvent.click(cancelTagUpdateButton);
    checkIfDefaultItemsRendered();
    expect(store.getState().objectsUI.addedTags.length).toEqual(0);

    // Remove partially applied tag for all
    fireEvent.click(tagFive);
    checkIfUpdateItemsRendered();

    // Cancel tag update
    cancelTagUpdateButton = getByText(sideMenu, "Cancel Tag Update");
    fireEvent.click(cancelTagUpdateButton);
    checkIfDefaultItemsRendered();
    expect(store.getState().objectsUI.removedTagIDs.length).toEqual(0);

    // Add => remove => reset partially applied tag
    fireEvent.click(tagFive);
    fireEvent.click(tagFive);
    fireEvent.click(tagFive);
    checkIfDefaultItemsRendered();
});


test("Check update tags", async () => {
    let store = await getStoreWithTwoSelectedObjects();
    await store.dispatch(getNonCachedTags([7]));    // additional tags is required to test adding of an existing tag

    // Route component is required for matching (getting :id part of the URL in the Object component)
    let { container } = renderWithWrappers(<Route exact path="/objects"><Objects /></Route>, {
        route: "/objects",
        store: store
    });

    // Wait for the objects to be loaded
    await waitFor(() => expect(queryAllByText(container, "object #1").length).toEqual(2));

    // Add an existing tag
    let inputToggle = getByTitle(container, "Click to add tags");
    fireEvent.click(inputToggle);
    let input = getByPlaceholderText(container, "Enter tag name...");
    fireEvent.change(input, { target: { value: "tag #7" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    // Add a new tag
    fireEvent.change(input, { target: { value: "new tag" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    // Remove an existing common tag
    let tagOne = getByText(container, "tag #1");
    fireEvent.click(tagOne);

    // Add a partially applied tag
    let tagThree = getByText(container, "tag #3");
    fireEvent.click(tagThree);

    // Remove a partially applied tag
    let tagFour = getByText(container, "tag #4");
    fireEvent.click(tagFour);
    fireEvent.click(tagFour);

    // Click update tags button
    let sideMenu = container.querySelector(".vertical.menu");
    let updateTagsButton = getByText(sideMenu, "Update Tags");
    fireEvent.click(updateTagsButton);

    // Wait for tags to update
    await waitFor(() => expect(queryByText(sideMenu, "Update Tags")).toBeFalsy());

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

    expect(wrappers[0].childNodes.length).toEqual(5);   // 4 tags + input toggle
    expect(wrappers[1].childNodes.length).toEqual(2);   // 2 tags
});
