import { fireEvent } from "@testing-library/react";
import { getByText, getByTitle, waitFor, queryAllByText } from "@testing-library/dom";

import { getMockedPageObjectIDs } from "../_mocks/mock-fetch-handlers-objects";
import { getInlineInputField, getDropdownOptionsContainer } from "../_util/ui-objects-tags";
import { getInlineItem } from "./ui-inline";


/**
 * Waits for objectsListUI fetch to start and end in the provided `store`.
 */
export const waitForFetch = async store => {
    await waitFor(() => expect(store.getState().objectsListUI.fetch.isFetching).toBeTruthy());
    await waitFor(() => expect(store.getState().objectsListUI.fetch.isFetching).toBeFalsy());
};


/**
 * Checks if objects are correctly displayed on the page (proper object IDs and object order).
 */
export const checkObjectsDisplay = (store, container) => {
    let objectIDs = getPageObjectIDsFromMock(store);
    let displayedObjects = queryAllByText(container, "object #", { exact: false });
    expect(objectIDs.length).toEqual(displayedObjects.length);
    for (let i = 0; i < objectIDs.length; i++) {
        expect(displayedObjects[i].textContent.replace(/\D/g, "")).toEqual(objectIDs[i].toString());
    }
};


/**
 * Returns object IDs which are returned by mock fetch handler.
 */
const getPageObjectIDsFromMock = store => {
    const pI = store.getState().objectsListUI.paginationInfo;
    return getMockedPageObjectIDs({
        page: pI.currentPage,
        items_per_page: pI.itemsPerPage,
        order_by: pI.sortField,
        sort_order: pI.sortOrder,
        filter_text: pI.filterText,
        object_types: pI.objectTypes,
        tags_filter: pI.tagsFilter
    });
};


/**
 * Selects provided object `type` in the object type filter on the /objects/list page.
 */
export const selectObjectTypeInFilter = async (type, dropdown, store) => {
    // Open dropdown menu
    const dropdownIcon = dropdown.querySelector("i.dropdown");
    expect(dropdownIcon).toBeTruthy();
    fireEvent.click(dropdownIcon);
    
    // Click on the corresponding menu item to select object type
    const menuItems = dropdown.querySelector(".visible.menu.transition");
    expect(menuItems).toBeTruthy();
    const typeItem = getByText(menuItems, type).parentNode;
    fireEvent.click(typeItem);

    // Close dropdown menu
    await waitForFetch(store);
    fireEvent.click(dropdownIcon);
};


/**
 * Deselects provided object `type` in the object type filter on the /objects/list page.
 */
export const deselectObjectTypeInFilter = async (type, dropdown, store) => {
    // Deselect object type
    const deselectIcon = getByText(dropdown, type).querySelector("i.delete.icon");
    expect(deselectIcon).toBeTruthy();
    fireEvent.click(deselectIcon);
    await waitForFetch(store);
};


/**
 * Searches for the provided `tag` via the /objects page `tagsFilterInput`.
 */
export const searchTagInFilter = async (tag, tagsFilterInput, store) => {    
    let oldMatchingIDs = store.getState().objectsListUI.tagsFilterInput.matchingIDs;
    fireEvent.change(tagsFilterInput, { target: { value: tag } });
    await waitFor(() => expect(oldMatchingIDs).not.toBe(store.getState().objectsListUI.tagsFilterInput.matchingIDs));
};


/**
 * Checks if a tag with the provided `tagID` was added to /objects/list `tagsFilterInput`
 */
export const checkIfTagIsAddedToFilter = async (tagID, container, store) => {
    const tagsFilterContainer = getByText(container, "Filter objects by tags").parentNode;
    const tagsFilterInput = tagsFilterContainer.querySelector("input.search");

    await waitFor(() => expect(store.getState().objectsListUI.paginationInfo.tagsFilter.includes(tagID)).toBeTruthy());     // tag is added to tagsFilter
    expect(tagsFilterContainer.querySelector(".visible.menu.transition")).toBeFalsy();      // dropdown list is not displayed
    expect(tagsFilterInput.value).toEqual("");                                              // search text is reset
    getByText(getByText(container, "Tags Filter").parentNode, `tag #${tagID}`);                // tags filter block is displayed and contains the added tag
    // if (store.getState().objectsListUI.paginationInfo.tagsFilter.length < 3)
    //     checkObjectsDisplay(store, container);                                                  // correct objects are displayed
    // else
    //     getByText(container, "No objects found.");      // no objects are found if 3 or more tags are in the filter
    checkObjectsDisplay(store, container);                                                  // correct objects are displayed
    if (store.getState().objectsListUI.paginationInfo.tagsFilter.length > 2) getByText(container, "No objects found.");      // no objects are found if 3 or more tags are in the filter
};


/**
 * For the /objects/list page tag update (expects container to be an /objects/list page)
 */
export const addAndRemoveTags = async (container, store) => {
    // Remove an "existing" tag
    const tagOne = getInlineItem({ container, text: "tag #1" });
    fireEvent.click(tagOne.icons[0]);

    // Add a new tag
    let inputToggle = getByTitle(container, "Click to add tags");
    fireEvent.click(inputToggle);
    let input = getInlineInputField({ container });


    fireEvent.change(input, { target: { value: "new tag" } });
    await waitFor(() => expect(store.getState().objectsEditUI.tagsInput.matchingIDs.length).toEqual(10));
    let dropdown = getDropdownOptionsContainer({ container, currentQueryText: "new tag" });
    expect(dropdown).toBeTruthy();
    fireEvent.click(dropdown.childNodes[0]);    // click on "Add new tag" option
};
