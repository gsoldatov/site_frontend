import React from "react";
import { Route } from "react-router-dom";

import { getByTitle, queryByTitle } from "@testing-library/dom";

import { getStoreWithEditedObjects } from "./_mocks/data-edited-objects";
import { renderWithWrappers } from "./_util/render";
import { getEditedObjectsHeaderCells, getEditedObjectItemRow, clickDeleteControl, 
    clickConfirmButton, clickCheckbox } from "./_util/ui-edited-objects";

import { EditedObjects } from "../src/components/top-level/edited-objects";



/*
    /objects/edited page tests.
*/
beforeEach(() => {
    // isolate fetch mock to avoid tests state collision because of cached data in fetch
    jest.isolateModules(() => {
        const { mockFetch, setFetchFail } = require("./_mocks/mock-fetch");
        // reset fetch mocks
        jest.resetAllMocks();
        global.fetch = jest.fn(mockFetch);
        global.setFetchFail = jest.fn(setFetchFail);
    });
});


test("Check row number", () => {
    // Add mock state
    const store = getStoreWithEditedObjects();

    // Load edited objects page
    let { container } = renderWithWrappers(<Route exact path="/objects/edited"><EditedObjects /></Route>, {
        route: "/objects/edited", store
    });

    // Check if correct number of rows is displayed
    const table = container.querySelector(".edited-objects-table");
    expect(table).toBeTruthy();

    const rows = table.querySelectorAll("tbody tr");
    expect(rows.length).toEqual(8); // [0, 1, -1, 10, 11, 21, 22, 23]
});


test("New object indicators", () => {
    // Add mock state
    const store = getStoreWithEditedObjects();

    // Load edited objects page
    let { container } = renderWithWrappers(<Route exact path="/objects/edited"><EditedObjects /></Route>, {
        route: "/objects/edited", store
    });

    // Check if new object & new subobject indicators are displayed
    const newObjectRow = getEditedObjectItemRow(container, "new composite");
    getByTitle(newObjectRow.newIndicatorCell, "Object is new");

    const newSubobjectRow = getEditedObjectItemRow(container, "new subobject");
    getByTitle(newSubobjectRow.newIndicatorCell, "New subobject of another object");

    // Check if nothing is displayed for existing objects
    const existingObjectRow = getEditedObjectItemRow(container, "existing link");
    expect(existingObjectRow.newIndicatorCell.childNodes.length).toEqual(0);
});


test("Objet type icons", () => {
    // Add mock state
    const store = getStoreWithEditedObjects();

    // Load edited objects page
    let { container } = renderWithWrappers(<Route exact path="/objects/edited"><EditedObjects /></Route>, {
        route: "/objects/edited", store
    });

    // Check if correct icons are dispalyed for each object type
    const linkRow = getEditedObjectItemRow(container, "existing link");
    getByTitle(linkRow.objectTypeCell, "Link");

    const markdownRow = getEditedObjectItemRow(container, "existing markdown");
    getByTitle(markdownRow.objectTypeCell, "Markdown");

    const toDoListRow = getEditedObjectItemRow(container, "existing to-do list");
    getByTitle(toDoListRow.objectTypeCell, "To-do list");

    const compositeRow = getEditedObjectItemRow(container, "existing composite");
    getByTitle(compositeRow.objectTypeCell, "Composite object");
});


test("Object names and object page links", () => {
    // Add mock state
    const store = getStoreWithEditedObjects();

    // Load edited objects page
    let { container } = renderWithWrappers(<Route exact path="/objects/edited"><EditedObjects /></Route>, {
        route: "/objects/edited", store
    });

    // Check if empty-named subobject is named as <unnamed>
    const unnamedObjectRow = getEditedObjectItemRow(container, "<unnamed>");
    expect(unnamedObjectRow.objectNameCell.childNodes[0].href.indexOf("/objects/edit/11")).toBeGreaterThan(-1);

    // Check if named objects are displayed correctly
    for (let objectName of ["new composite", "existing composite", "new subobject", "existing subobject link",
        "existing link", "existing markdown", "existing to-do list"]) {
        const rowObjectName = getEditedObjectItemRow(container, objectName);
        expect(rowObjectName.objectNameCell).toBeTruthy();
    }

    // Check if new object link is correct
    const newObjectRow = getEditedObjectItemRow(container, "new composite");
    expect(newObjectRow.objectNameCell.childNodes[0].href.indexOf("/objects/edit/new")).toBeGreaterThan(-1);

    // Check if existing object link is correct
    const existingLinkRow = getEditedObjectItemRow(container, "existing link");
    expect(existingLinkRow.objectNameCell.childNodes[0].href.indexOf("/objects/edit/21")).toBeGreaterThan(-1);

    // Check if new subobject links to its parent's object page
    const newSubobjectRow = getEditedObjectItemRow(container, "new subobject");
    expect(newSubobjectRow.objectNameCell.childNodes[0].href.indexOf("/objects/edit/new")).toBeGreaterThan(-1);
});


test("Parent links", () => {
    // Add mock state
    const store = getStoreWithEditedObjects();

    // Load edited objects page
    let { container } = renderWithWrappers(<Route exact path="/objects/edited"><EditedObjects /></Route>, {
        route: "/objects/edited", store
    });

    // Check if object with no parents does not have parent links
    const existingLinkRow = getEditedObjectItemRow(container, "existing link");
    expect(existingLinkRow.parentLinksCell.childNodes.length).toEqual(0);

    // Check if object with a single parent has a correct link
    const newSubobjectLinkRow = getEditedObjectItemRow(container, "new subobject");
    expect(newSubobjectLinkRow.parentLinksCell.childNodes.length).toEqual(1);
    expect(newSubobjectLinkRow.parentLinksCell.childNodes[0].href.indexOf("/objects/edit/new")).toBeGreaterThan(-1);
    
    // Check if object with two parents has correct links
    const existingSubobjectLinkRow = getEditedObjectItemRow(container, "existing subobject link");
    expect(existingSubobjectLinkRow.parentLinksCell.childNodes.length).toEqual(2);
    expect(existingSubobjectLinkRow.parentLinksCell.childNodes[0].href.indexOf("/objects/edit/new")).toBeGreaterThan(-1);
    expect(existingSubobjectLinkRow.parentLinksCell.childNodes[1].href.indexOf("/objects/edit/1")).toBeGreaterThan(-1);
});


test("Subobject indicators", () => {
    // Add mock state
    const store = getStoreWithEditedObjects();

    // Load edited objects page
    let { container } = renderWithWrappers(<Route exact path="/objects/edited"><EditedObjects /></Route>, {
        route: "/objects/edited", store
    });

    // Check if non-composite object has no indicator
    const existingLinkRow = getEditedObjectItemRow(container, "existing link");
    expect(existingLinkRow.subobjectsIndicatorCell.childNodes.length).toEqual(0);

    // Check if composite object with partially loaded subobjects has a correct indicator
    const existingCompositeRow = getEditedObjectItemRow(container, "existing composite");
    expect(existingCompositeRow.subobjectsIndicatorCell.childNodes[0].textContent).toEqual("1 / 2");

    // Check if composite object with fully loaded subobjects has a correct indicator
    const newCompositeRow = getEditedObjectItemRow(container, "new composite");
    expect(newCompositeRow.subobjectsIndicatorCell.childNodes[0].textContent).toEqual("3 / 3");
});


test("Delete control", () => {
    // Add mock state
    const store = getStoreWithEditedObjects();

    // Load edited objects page
    let { container } = renderWithWrappers(<Route exact path="/objects/edited"><EditedObjects /></Route>, {
        route: "/objects/edited", store
    });
    expect(Object.keys(store.getState().editedObjects).length).toEqual(8);

    // Delete non-composite non-subobject and click cancel
    const existingLinkRow = getEditedObjectItemRow(container, "existing link");
    clickDeleteControl({ cell: existingLinkRow.controlsCell, withSubobjects: false, selected: false });
    clickConfirmButton({ body: container.parentNode, confirm: false });
    expect(getEditedObjectItemRow(container, "existing link").objectNameCell).toBeTruthy();
    expect(store.getState().editedObjects).toHaveProperty("21");

    // Delete non-composite non-subobject
    clickDeleteControl({ cell: existingLinkRow.controlsCell, withSubobjects: false, selected: false });
    clickConfirmButton({ body: container.parentNode, confirm: true });

    // Check if correct number of objects is displayed and present in state
    expect(getEditedObjectItemRow(container, "existing link").objectNameCell).toBeFalsy();
    expect(Object.keys(store.getState().editedObjects).length).toEqual(7);
    expect(store.getState().editedObjects).not.toHaveProperty("21");

    // Delete composite object
    const newCompositeRow = getEditedObjectItemRow(container, "new composite");
    clickDeleteControl({ cell: newCompositeRow.controlsCell, withSubobjects: false, selected: false });
    clickConfirmButton({ body: container.parentNode, confirm: true });
    
    // Check if correct number of objects is displayed and present in state
    expect(getEditedObjectItemRow(container, "new composite").objectNameCell).toBeFalsy();
    expect(getEditedObjectItemRow(container, "new subobject").objectNameCell).toBeFalsy();
    expect(Object.keys(store.getState().editedObjects).length).toEqual(4);  // 0 was the deleted parent object, -1 was a new subobject and 10 was an unchanged existing subobject
    expect(store.getState().editedObjects).not.toHaveProperty("0");         // 11 was the subobject as well, but it was modified and therefore, not deleted
    expect(store.getState().editedObjects).not.toHaveProperty("-1");
    expect(store.getState().editedObjects).not.toHaveProperty("10");

    // Check if correct number of rows is displayed
    const table = container.querySelector(".edited-objects-table");
    expect(table).toBeTruthy();

    const rows = table.querySelectorAll("tbody tr");
    expect(rows.length).toEqual(4); // [1, 11, 22, 23]
});


test("Delete with subobjects controls", () => {
    // Add mock state
    const store = getStoreWithEditedObjects();

    // Load edited objects page
    let { container } = renderWithWrappers(<Route exact path="/objects/edited"><EditedObjects /></Route>, {
        route: "/objects/edited", store
    });
    expect(Object.keys(store.getState().editedObjects).length).toEqual(8);

    // Control is not displayed for non-composite objects
    const existingLinkRow = getEditedObjectItemRow(container, "existing link");
    expect(queryByTitle(existingLinkRow.controlsCell, "Remove edited object with subobjects")).toBeFalsy();

    // Delete composite object and click cancel
    const newCompositeRow = getEditedObjectItemRow(container, "new composite");
    clickDeleteControl({ cell: newCompositeRow.controlsCell, withSubobjects: true, selected: false });
    clickConfirmButton({ body: container.parentNode, confirm: false });
    expect(getEditedObjectItemRow(container, "new composite").objectNameCell).toBeTruthy();
    expect(store.getState().editedObjects).toHaveProperty("0");

    // Delete composite object
    clickDeleteControl({ cell: newCompositeRow.controlsCell, withSubobjects: true, selected: false });
    clickConfirmButton({ body: container.parentNode, confirm: true });

    // Check if correct number of objects is displayed and present in state
    expect(getEditedObjectItemRow(container, "new composite").objectNameCell).toBeFalsy();
    expect(Object.keys(store.getState().editedObjects).length).toEqual(4);
    expect(store.getState().editedObjects).not.toHaveProperty("0");
    expect(store.getState().editedObjects).not.toHaveProperty("-1");
    expect(store.getState().editedObjects).not.toHaveProperty("10");
    expect(store.getState().editedObjects).not.toHaveProperty("11");

    // Check if correct number of rows is displayed
    const table = container.querySelector(".edited-objects-table");
    expect(table).toBeTruthy();

    const rows = table.querySelectorAll("tbody tr");
    expect(rows.length).toEqual(4); // [1, 21, 22, 23]
});


test("Checkbox selection/deselection", () => {
    // Add mock state
    const store = getStoreWithEditedObjects();

    // Load edited objects page
    let { container } = renderWithWrappers(<Route exact path="/objects/edited"><EditedObjects /></Route>, {
        route: "/objects/edited", store
    });

    // Select object
    const existingLinkRow = getEditedObjectItemRow(container, "existing link");
    clickCheckbox(existingLinkRow.checkboxCell);
    expect(store.getState().editedObjectsUI.selectedObjectIDs.has("21")).toBeTruthy();    

    // Deselect object
    clickCheckbox(existingLinkRow.checkboxCell);
    expect(store.getState().editedObjectsUI.selectedObjectIDs.size).toEqual(0);
});


test("Select/deselect all objects", () => {
    const checkIfAllAreSelected = () => {
        for (let objectID of ["0", "1", "-1", "10", "11", "21", "22", "23"])
            expect(store.getState().editedObjectsUI.selectedObjectIDs.has(objectID)).toBeTruthy(); 
    };

    // Add mock state
    const store = getStoreWithEditedObjects();

    // Load edited objects page
    let { container } = renderWithWrappers(<Route exact path="/objects/edited"><EditedObjects /></Route>, {
        route: "/objects/edited", store
    });
    expect(Object.keys(store.getState().editedObjects).length).toEqual(8);

    // Select and deselect all objects
    const headerCells = getEditedObjectsHeaderCells(container);
    clickCheckbox(headerCells.checkboxCell);
    checkIfAllAreSelected();

    clickCheckbox(headerCells.checkboxCell);
    expect(store.getState().editedObjectsUI.selectedObjectIDs.size).toEqual(0);

    // Select object
    const existingLinkRow = getEditedObjectItemRow(container, "existing link");
    clickCheckbox(existingLinkRow.checkboxCell);
    expect(store.getState().editedObjectsUI.selectedObjectIDs.has("21")).toBeTruthy();    

    // Select all then deselect all
    clickCheckbox(headerCells.checkboxCell);
    checkIfAllAreSelected();

    clickCheckbox(headerCells.checkboxCell);
    expect(store.getState().editedObjectsUI.selectedObjectIDs.size).toEqual(0);
});


test("Delete selected objects", () => {
    // Add mock state
    const store = getStoreWithEditedObjects();

    // Load edited objects page
    let { container } = renderWithWrappers(<Route exact path="/objects/edited"><EditedObjects /></Route>, {
        route: "/objects/edited", store
    });
    expect(Object.keys(store.getState().editedObjects).length).toEqual(8);

    // Select and delete 2 non-composite objects
    const existingLinkRow = getEditedObjectItemRow(container, "existing link");
    clickCheckbox(existingLinkRow.checkboxCell);
    const existingMarkdownRow = getEditedObjectItemRow(container, "existing markdown");
    clickCheckbox(existingMarkdownRow.checkboxCell);

    const headerCells = getEditedObjectsHeaderCells(container);
    clickDeleteControl({ cell: headerCells.controlsCell, withSubobjects: false, selected: true });
    clickConfirmButton({ body: container.parentNode, confirm: true });

    // Check if objects were correctly deleted
    expect(Object.keys(store.getState().editedObjects).length).toEqual(6);
    expect(store.getState().editedObjects).not.toHaveProperty("21");
    expect(store.getState().editedObjects).not.toHaveProperty("22");

    // Selecte and delete a composite object
    const newCompositeRow = getEditedObjectItemRow(container, "new composite");
    clickCheckbox(newCompositeRow.checkboxCell);

    clickDeleteControl({ cell: headerCells.controlsCell, withSubobjects: false, selected: true });
    clickConfirmButton({ body: container.parentNode, confirm: true });

    expect(Object.keys(store.getState().editedObjects).length).toEqual(3);
    expect(store.getState().editedObjects).not.toHaveProperty("0");
    expect(store.getState().editedObjects).not.toHaveProperty("-1");
    expect(store.getState().editedObjects).not.toHaveProperty("10");

    // Check if correct number of rows is displayed
    const table = container.querySelector(".edited-objects-table");
    expect(table).toBeTruthy();

    const rows = table.querySelectorAll("tbody tr");
    expect(rows.length).toEqual(3); // [1, 11, 23]
});


test("Delete selected objects with subobjects", () => {
    // Add mock state
    const store = getStoreWithEditedObjects();

    // Load edited objects page
    let { container } = renderWithWrappers(<Route exact path="/objects/edited"><EditedObjects /></Route>, {
        route: "/objects/edited", store
    });
    expect(Object.keys(store.getState().editedObjects).length).toEqual(8);
    
    // Selecte and delete a composite object
    const newCompositeRow = getEditedObjectItemRow(container, "new composite");
    clickCheckbox(newCompositeRow.checkboxCell);

    const headerCells = getEditedObjectsHeaderCells(container);
    clickDeleteControl({ cell: headerCells.controlsCell, withSubobjects: true, selected: true });
    clickConfirmButton({ body: container.parentNode, confirm: true });

    expect(Object.keys(store.getState().editedObjects).length).toEqual(4);
    expect(store.getState().editedObjects).not.toHaveProperty("0");
    expect(store.getState().editedObjects).not.toHaveProperty("-1");
    expect(store.getState().editedObjects).not.toHaveProperty("10");
    expect(store.getState().editedObjects).not.toHaveProperty("11");

    // Check if correct number of rows is displayed
    const table = container.querySelector(".edited-objects-table");
    expect(table).toBeTruthy();

    const rows = table.querySelectorAll("tbody tr");
    expect(rows.length).toEqual(4); // [1, 21, 22, 23]
});
