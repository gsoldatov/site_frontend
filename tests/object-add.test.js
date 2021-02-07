/* 
// Old imports and setup/teardown functions.
// Tests sometimes fail because of using the shared state of mock fetch when they're run concurrently.

// import React from "react";
// import { Route } from "react-router-dom";

// import { fireEvent } from "@testing-library/react";
// import { getByText, getByPlaceholderText, waitFor, getByTitle } from '@testing-library/dom'

// import { mockFetch, setFetchFailParams, resetMocks } from "./mocks/mock-fetch";
// import { renderWithWrappers } from "./test-utils";

// import { AddObject, EditObject } from "../src/components/object";
// import { addObjects } from "../src/actions/objects";


// beforeAll(() => { global.fetch = jest.fn(mockFetch); });
// afterAll(() => { jest.resetAllMocks(); });
// afterEach(() => { resetMocks(); });
*/
import React from "react";
import { Route } from "react-router-dom";

import { fireEvent } from "@testing-library/react";
import { getByText, getByPlaceholderText, waitFor, getByTitle } from '@testing-library/dom'

import { renderWithWrappers, renderWithWrappersAndDnDProvider } from "./test-utils";

import createStore from "../src/store/create-store";
import { AddObject, EditObject } from "../src/components/object";
import { addObjects } from "../src/actions/objects";


beforeEach(() => {
    // isolate fetch mock to avoid tests state collision because of cached data in fetch
    jest.isolateModules(() => {
        const { mockFetch, setFetchFailParams } = require("./mocks/mock-fetch");
        // reset fetch mocks
        jest.resetAllMocks();
        global.fetch = jest.fn(mockFetch);
        global.setFetchFailParams = jest.fn(setFetchFailParams);
    });
});


test("Render and click cancel button", async () => {
    let { container, history } = renderWithWrappers(<Route exact path="/objects/:id"><AddObject /></Route>, {
        route: "/objects/add"
    });
    
    // Check if add object page was loaded with empty input fields
    let addObjectHeader = getByText(container, "Add a New Object");
    let objectNameInput = getByPlaceholderText(container, "Object name");
    let objectDescriptionInput = getByPlaceholderText(container, "Object description");
    expect(objectNameInput.value).toBe("");
    expect(objectDescriptionInput.value).toBe("");

    // Check if an empty name can't be submitted
    let saveButton = getByText(container, "Save");
    let cancelButton = getByText(container, "Cancel");
    expect(saveButton.className.startsWith("disabled")).toBeTruthy(); // Semantic UI always adds onClick event to div elements, even if they are disabled (which does nothing in this case)
    // expect(saveButton.onclick).toBeNull(); 

    // Check if cancel button redirects to /objects page
    fireEvent.click(cancelButton);
    expect(history.entries[history.length - 1].pathname).toBe("/objects");
});


test("Select different object types", async () => {
    let { container } = renderWithWrappersAndDnDProvider(<Route exact path="/objects/:id"><AddObject /></Route>, {
        route: "/objects/add"
    });

    // Check if object types selector is rendered and enabled
    const objectTypeSelector = container.querySelector(".object-type-menu");
    const mainContentContainer = container.querySelector("div.twelve.wide.column");
    const objectNameDescriptionInput = container.querySelector(".edit-page-textarea").parentNode.parentNode;  // name + descr form
    expect(objectTypeSelector).toBeTruthy();
    expect(mainContentContainer).toBeTruthy();
    expect(objectNameDescriptionInput).toBeTruthy();
    
    // Get link, markdown and to-do selecting elements
    let linkButton, markdownButton, TDLButton;
    objectTypeSelector.querySelectorAll(".object-type").forEach(node => {
        const innerHTML = node.innerHTML;
        if (innerHTML.includes("Link")) linkButton = node;
        else if (innerHTML.includes("Markdown")) markdownButton = node;
        else if (innerHTML.includes("To-Do List")) TDLButton = node;
    });
    expect(linkButton).toBeTruthy();
    expect(markdownButton).toBeTruthy();
    expect(TDLButton).toBeTruthy();

    // Select markdown object type and check if only markdown inputs are rendered
    fireEvent.click(markdownButton);
    const markdownContainer = document.querySelector(".markdown-container");
    expect(markdownContainer).toBeTruthy();
    expect(mainContentContainer.childNodes[mainContentContainer.childNodes.length - 4]).toEqual(objectNameDescriptionInput);    // fourth to last node is NameDescr input (before object data div, tag block, tag block header)
    expect(mainContentContainer.lastChild).toEqual(markdownContainer);  // last node is Markdown input mock

    // Select to-do object type and check if only to-do inputs are rendered
    fireEvent.click(TDLButton);
    const TDLContainer = container.querySelector(".to-do-list-container");
    expect(TDLContainer).toBeTruthy();
    expect(mainContentContainer.childNodes[mainContentContainer.childNodes.length - 4]).toEqual(objectNameDescriptionInput);    // fourth to last node is NameDescr input
    expect(mainContentContainer.lastChild).toEqual(TDLContainer);  // last node is To-Do list input mock


    // // Select to-do object type and check if only to-do inputs are rendered
    // fireEvent.click(TDLButton);
    // const tdInput = getByText(container, "Not implemented");
    // expect(mainContentContainer.childNodes[mainContentContainer.childNodes.length - 4]).toEqual(objectNameDescriptionInput);    // fourth to last node is NameDescr input
    // expect(mainContentContainer.lastChild).toEqual(tdInput);  // last node is To-Do list input mock
    
    // Select link object type and check if only link inputs are rendered
    fireEvent.click(linkButton);
    expect(mainContentContainer.childNodes[mainContentContainer.childNodes.length - 4]).toEqual(objectNameDescriptionInput);    // fourth to last node is NameDescr input
    const linkInput = getByPlaceholderText(mainContentContainer, "Link");
    expect(mainContentContainer.lastChild).toEqual(linkInput.parentNode.parentNode.parentNode);   // last node is link input form
});


test("Modify object name and try saving an existing (in local state) object name", async () => {
    let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><AddObject /></Route>, {
        route: "/objects/add"
    });

    // Check if input is updating the state
    let objectNameInput = getByPlaceholderText(container, "Object name");
    let objectDescriptionInput = getByPlaceholderText(container, "Object description");
    let saveButton = getByText(container, "Save");
    fireEvent.change(objectNameInput, { target: { value: "existing object_name" } });
    await waitFor(() => expect(store.getState().objectUI.currentObject.object_name).toBe("existing object_name"));
    fireEvent.change(objectDescriptionInput, { target: { value: "object description" } });
    await waitFor(() => expect(store.getState().objectUI.currentObject.object_description).toBe("object description"));
    
    // Check if existing object_name (in store) is not added
    store.dispatch(addObjects([{ object_id: 1, object_type: "link", object_name: "existing object_name", object_description: "", created_at: new Date(), modified_at: new Date() }]));
    saveButton = getByText(container, "Save");
    fireEvent.click(saveButton);
    let errorMessage = getByText(container, "already exists", { exact: false });
});


test("Try saving an existing (on backend) object name", async () => {
    let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><AddObject /></Route>, {
        route: "/objects/add"
    });

    // Check if existing object_name (on backend) is not added
    let objectNameInput = getByPlaceholderText(container, "Object name");
    let linkInput = getByPlaceholderText(container, "Link");
    let saveButton = getByText(container, "Save");
    fireEvent.change(objectNameInput, { target: { value: "existing object_name" } });
    await waitFor(() => expect(store.getState().objectUI.currentObject.object_name).toBe("existing object_name"));  // wait for object_name to be updated in state
    const linkValue = "https://google.com"
    fireEvent.change(linkInput, { target: { value: linkValue } });
    await waitFor(() => expect(store.getState().objectUI.currentObject.link).toBe(linkValue));
    fireEvent.click(saveButton);
    await waitFor(() => getByText(container, "already exists", { exact: false }));
});


test("Try saving objects with incorrect data", async () => {
    let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><AddObject /></Route>, {
        route: "/objects/add"
    });

    // Get object name input & save button
    let objectNameInput = getByPlaceholderText(container, "Object name");
    let saveButton = getByText(container, "Save");

    // Get link, markdown and to-do selecting elements
    const objectTypeSelector = container.querySelector(".object-type-menu");
    let linkButton, markdownButton, TDLButton;
    objectTypeSelector.querySelectorAll(".object-type").forEach(node => {
        const innerHTML = node.innerHTML;
        if (innerHTML.includes("Link")) linkButton = node;
        else if (innerHTML.includes("Markdown")) markdownButton = node;
        else if (innerHTML.includes("To-Do List")) TDLButton = node;
    });

    // Set a valid object name
    fireEvent.change(objectNameInput, { target: { value: "New object" } });

    // Save an empty link
    fireEvent.click(linkButton);
    fireEvent.click(saveButton);
    await waitFor(() => getByText(container, "Link value is required.", { exact: false }));
    expect(store.getState().objects[1]).toBeUndefined();
    expect(store.getState().links[1]).toBeUndefined();

    // Save an empty markdown object
    fireEvent.click(markdownButton);
    fireEvent.click(saveButton);
    await waitFor(() => getByText(container, "Markdown text is required.", { exact: false }));
    expect(store.getState().objects[1]).toBeUndefined();
    expect(store.getState().markdown[1]).toBeUndefined();
});


test("Handle fetch error", async () => {
    let { container, history, store } = renderWithWrappers(<Route exact path="/objects/:id"><AddObject /></Route>, {
        route: "/objects/add"
    });

    // Check if an error message is displayed and object is not added to the state
    let objectNameInput = getByPlaceholderText(container, "Object name");
    let linkInput = getByPlaceholderText(container, "Link");
    let saveButton = getByText(container, "Save");
    fireEvent.change(objectNameInput, { target: { value: "error" } });
    await waitFor(() => expect(store.getState().objectUI.currentObject.object_name).toBe("error"));  // wait for object_name to be updated in state
    const linkValue = "https://google.com"
    fireEvent.change(linkInput, { target: { value: linkValue } });
    await waitFor(() => expect(store.getState().objectUI.currentObject.link).toBe(linkValue));
    setFetchFailParams(true, "Test add fetch error");
    fireEvent.click(saveButton);
    await waitFor(() => getByText(container, "Test add fetch error"));
    expect(history.entries[history.length - 1].pathname).toBe("/objects/add");
    expect(store.getState().objects[1000]).toBeUndefined(); // mock object returned has this id
    setFetchFailParams();   // reset fetch params
});


test("Save a new link", async () => {
    let { container, history, store } = renderWithWrappers(
        <Route exact path="/objects/:id" render={ props => props.match.params.id === "add" ? <AddObject /> : <EditObject /> } />, 
        { route: "/objects/add" }
    );

    let objectNameInput = getByPlaceholderText(container, "Object name");
    let objectDescriptionInput = getByPlaceholderText(container, "Object description");
    let linkInput = getByPlaceholderText(container, "Link");
    let saveButton = getByText(container, "Save");

    // Check if object is redirected after adding a correct object
    fireEvent.change(objectNameInput, { target: { value: "new object" } });
    await waitFor(() => expect(store.getState().objectUI.currentObject.object_name).toBe("new object"));
    fireEvent.change(objectDescriptionInput, { target: { value: "new object description" } });
    await waitFor(() => expect(store.getState().objectUI.currentObject.object_description).toBe("new object description"));
    const linkValue = "https://google.com"
    fireEvent.change(linkInput, { target: { value: linkValue } });
    await waitFor(() => expect(store.getState().objectUI.currentObject.link).toBe(linkValue));
    fireEvent.click(saveButton);
    const object_id = 1000; // mock object returned has this id
    await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe(`/objects/${object_id}`));
    expect(getByPlaceholderText(container, "Object name").value).toEqual("new object");
    expect(getByPlaceholderText(container, "Object description").value).toEqual("new object description");
    expect(getByPlaceholderText(container, "Link").value).toEqual(linkValue);
    // let object = store.getState().objects[object_id];
    // getByText(container, object["created_at"]);
    // getByText(container, object["modified_at"]);
    getByText(container, "Created at:");
    getByText(container, "Modified at:");

    expect(store.getState().links[object_id].link).toEqual(linkValue);
    
    // Check if saveAddObjectState property was set to false, which will cause current object reset on next /objects/add page render
    expect(store.getState().objectUI.saveAddObjectState).toBeFalsy();
});


test("Change markdown display modes & render markdown", async () => {
    let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><AddObject /></Route>, {
        route: "/objects/add"
    });

    // Change object type
    let markdownButton;
    container.querySelector(".object-type-menu").querySelectorAll(".object-type").forEach(node => {
        if (node.innerHTML.includes("Markdown")) markdownButton = node;
    });
    fireEvent.click(markdownButton);
    const markdownContainer = document.querySelector(".markdown-container");
    expect(markdownContainer).toBeTruthy();

    // Click on edit mode
    let editModeButton = getByTitle(markdownContainer, "Display edit window")
    fireEvent.click(editModeButton);
    let inputForm = getByPlaceholderText(markdownContainer, "Enter text here...");
    expect(inputForm.textLength).toEqual(0);

    // Insert text
    fireEvent.change(inputForm, { target: { value: "**Test text**" } });
    expect(store.getState().objectUI.currentObject.markdown.raw_text).toEqual("**Test text**");

    // Click on view mode & wait for rendered markdown to appear
    let viewModeButton = getByTitle(markdownContainer, "Display parsed markdown");
    fireEvent.click(viewModeButton);
    await waitFor(() => expect(store.getState().objectUI.currentObject.markdown.parsed.indexOf("Test text")).toBeGreaterThan(-1));  // wait until there is rendered text to display
    let viewContainer = markdownContainer.querySelector(".markdown-parsed-container");
    getByText(viewContainer, "Test text");

    // Click on both mode
    let bothModeButton = getByTitle(markdownContainer, "Display edit window and parsed markdown");
    fireEvent.click(bothModeButton);
    inputForm = getByPlaceholderText(markdownContainer, "Enter text here...");
    viewContainer = markdownContainer.querySelector(".markdown-parsed-container");
    
    // Update markdown & wait for it to appear
    fireEvent.change(inputForm, { target: { value: "**Test text 2**" } });
    await waitFor(() => getByText(viewContainer, "Test text 2"));
});


test("Save a new markdown object", async () => {
    let { container, history, store } = renderWithWrappers(
        <Route exact path="/objects/:id" render={ props => props.match.params.id === "add" ? <AddObject /> : <EditObject /> } />, 
        { route: "/objects/add" }
    );

    // Change object type & display mode
    let markdownButton;
    container.querySelector(".object-type-menu").querySelectorAll(".object-type").forEach(node => {
        if (node.innerHTML.includes("Markdown")) markdownButton = node;
    });
    fireEvent.click(markdownButton);
    let editModeButton = getByTitle(container, "Display edit window")
    fireEvent.click(editModeButton);

    let objectNameInput = getByPlaceholderText(container, "Object name");
    let objectDescriptionInput = getByPlaceholderText(container, "Object description");
    let inputForm = getByPlaceholderText(container, "Enter text here...");
    let saveButton = getByText(container, "Save");

    // Check if object is redirected after adding a correct object
    fireEvent.change(objectNameInput, { target: { value: "new object" } });
    await waitFor(() => expect(store.getState().objectUI.currentObject.object_name).toBe("new object"));
    fireEvent.change(objectDescriptionInput, { target: { value: "new object description" } });
    await waitFor(() => expect(store.getState().objectUI.currentObject.object_description).toBe("new object description"));
    const rawText = "**Test text**";
    fireEvent.change(inputForm, { target: { value: rawText } });
    await waitFor(() => expect(store.getState().objectUI.currentObject.markdown.raw_text).toEqual(rawText));
    fireEvent.click(saveButton);
    const object_id = 1000; // mock object returned has this id
    await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe(`/objects/${object_id}`));
    expect(getByPlaceholderText(container, "Object name").value).toEqual("new object");
    expect(getByPlaceholderText(container, "Object description").value).toEqual("new object description");
    expect(getByPlaceholderText(container, "Enter text here...").value).toEqual(rawText);
    // let object = store.getState().objects[object_id];
    // getByText(container, object["created_at"]);
    // getByText(container, object["modified_at"]);
    getByText(container, "Created at:");
    getByText(container, "Modified at:");

    expect(store.getState().markdown[object_id].raw_text).toEqual(rawText);
});


test("Add object state saving & reload", async () => {
    let store = createStore({ enableDebugLogging: false });

    const render = () => renderWithWrappers(<Route exact path="/objects/:id"><AddObject /></Route>, {
        route: "/objects/add",
        store
    });

    // Render /objects/add and update object name + object type
    var { container } = render();
    let objectNameInput = getByPlaceholderText(container, "Object name");
    fireEvent.change(objectNameInput, { target: { value: "new object" } });
    await waitFor(() => expect(store.getState().objectUI.currentObject.object_name).toBe("new object"));
    let markdownObjectTypeButton = getByText(container.querySelector(".object-type-menu"), "Markdown");
    fireEvent.click(markdownObjectTypeButton);

    // Re-render the page with the same store and check if object name and type were not reset
    var { container } = render();
    objectNameInput = getByPlaceholderText(container, "Object name");
    expect(objectNameInput.value).toEqual("new object");
    expect(store.getState().objectUI.currentObject.object_type).toEqual("markdown");

    // Click reset button and check if object name was reset
    const resetButton = getByText(container, "Reset");
    fireEvent.click(resetButton);
    expect(objectNameInput.value).toEqual("");
    expect(store.getState().objectUI.currentObject.object_type).toEqual("markdown");    // object type is not reset
});


test("Add object state reset when opening edit page", async () => {
    let store = createStore({ enableDebugLogging: false });

    const render = route => renderWithWrappers(<Route exact path="/objects/:id" render={ props => props.match.params.id === "add" ? <AddObject /> : <EditObject /> } />, {
        route,
        store
    });

    // Render /objects/add and update object name + object type
    var { container } = render("/objects/add");
    let objectNameInput = getByPlaceholderText(container, "Object name");
    fireEvent.change(objectNameInput, { target: { value: "new object" } });
    await waitFor(() => expect(store.getState().objectUI.currentObject.object_name).toBe("new object"));

    // Render /objects/1, then render /objects/add and check if the state was reset
    var { container } = render("/objects/1");
    await waitFor(() => getByText(container, "Object Information"));
    var { container } = render("/objects/add");
    objectNameInput = getByPlaceholderText(container, "Object name");
    expect(objectNameInput.value).toEqual("");
});

