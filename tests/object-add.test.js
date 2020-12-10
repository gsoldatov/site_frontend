import React from "react";
import { Route } from "react-router-dom";

import { fireEvent } from "@testing-library/react";
import { getByText, getByPlaceholderText, waitFor } from '@testing-library/dom'

import { mockFetch, setFetchFailParams, resetMocks } from "./mocks/mock-fetch";
import { renderWithWrappers } from "./test-utils";

import { AddObject, EditObject } from "../src/components/object";
import { addObjects } from "../src/actions/objects";


beforeAll(() => { global.fetch = jest.fn(mockFetch); });
afterAll(() => { jest.resetAllMocks(); });
afterEach(() => { resetMocks(); });


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
    let { container } = renderWithWrappers(<Route exact path="/objects/:id"><AddObject /></Route>, {
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
    let linkButton, markdownButton, tdButton;
    objectTypeSelector.querySelectorAll(".object-type").forEach(node => {
        const innerHTML = node.innerHTML;
        // ["Link", "Markdown", "To-Do List"].forEach(type => {})
        if (innerHTML.includes("Link")) linkButton = node;
        else if (innerHTML.includes("Markdown")) markdownButton = node;
        else if (innerHTML.includes("To-Do List")) tdButton = node;
    });
    expect(linkButton).toBeTruthy();
    expect(markdownButton).toBeTruthy();
    expect(tdButton).toBeTruthy();

    // Select markdown object type and check if only markdown inputs are rendered
    fireEvent.click(markdownButton);
    const markdownInput = getByText(container, "Not implemented");
    expect(mainContentContainer.childNodes[mainContentContainer.childNodes.length - 4]).toEqual(objectNameDescriptionInput);    // fourth to last node is NameDescr input (before object data div, tag block, tag block header)
    expect(mainContentContainer.lastChild).toEqual(markdownInput);  // last node is Markdown input mock

    // Select to-do object type and check if only to-do inputs are rendered
    fireEvent.click(markdownButton);
    const tdInput = getByText(container, "Not implemented");
    expect(mainContentContainer.childNodes[mainContentContainer.childNodes.length - 4]).toEqual(objectNameDescriptionInput);    // fourth to last node is NameDescr input
    expect(mainContentContainer.lastChild).toEqual(tdInput);  // last node is To-Do list input mock
    
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
    let saveButton = getByText(container, "Save");
    fireEvent.change(objectNameInput, { target: { value: "existing object_name" } });
    await waitFor(() => expect(store.getState().objectUI.currentObject.object_name).toBe("existing object_name"));  // wait for object_name to be updated in state
    fireEvent.click(saveButton);
    await waitFor(() => getByText(container, "already exists", { exact: false }));
});


test("Handle fetch error", async () => {
    let { container, history, store } = renderWithWrappers(<Route exact path="/objects/:id"><AddObject /></Route>, {
        route: "/objects/add"
    });

    // Check if an error message is displayed and object is not added to the state
    let objectNameInput = getByPlaceholderText(container, "Object name");
    let saveButton = getByText(container, "Save");
    fireEvent.change(objectNameInput, { target: { value: "error" } });
    await waitFor(() => expect(store.getState().objectUI.currentObject.object_name).toBe("error"));  // wait for object_name to be updated in state
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
    fireEvent.change(linkInput, { target: { value: "https://google.com" } });
    await waitFor(() => expect(store.getState().objectUI.currentObject.link).toBe("https://google.com"));
    fireEvent.click(saveButton);
    const object_id = 1000; // mock object returned has this id
    await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe(`/objects/${object_id}`));
    expect(getByPlaceholderText(container, "Object name").value).toEqual("new object");
    expect(getByPlaceholderText(container, "Object description").value).toEqual("new object description");
    expect(getByPlaceholderText(container, "Link").value).toEqual("https://google.com");
    let object = store.getState().objects[object_id];
    getByText(container, object["created_at"]);
    getByText(container, object["modified_at"]);
});
