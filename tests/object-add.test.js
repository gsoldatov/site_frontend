import React from "react";
import { Route } from "react-router-dom";

import { fireEvent } from "@testing-library/react";
import { getByText, getByLabelText, waitFor, queryByLabelText } from '@testing-library/dom'

import { mockFetch, setFetchFailParams } from "./mocks/mock-fetch";
import { renderWithWrappers } from "./test-utils";

import { AddObject, EditObject } from "../src/components/object/object";
import { addObjects } from "../src/actions/objects";

beforeAll(() => {
    global.fetch = jest.fn(mockFetch);
});

afterAll(() => {
    setFetchFailParams();   // reset fetch params
    jest.resetAllMocks();
})

test("Render and click cancel button", async () => {
    let { container, history } = renderWithWrappers(<Route exact path="/objects/:id"><AddObject /></Route>, {
        route: "/objects/add"
    });
    
    // Check if add object page was loaded with empty input fields
    let addObjectHeader = getByText(container, "Add a New Object");
    let objectNameInput = getByLabelText(container, "Object name");
    let objectDescriptionInput = getByLabelText(container, "Object description");
    expect(objectNameInput.value).toBe("");
    expect(objectDescriptionInput.value).toBe("");

    // Check if an empty name can't be submitted
    let saveButton = getByText(container, "Save");
    let cancelButton = getByText(container, "Cancel");
    expect(saveButton.onclick).toBeNull();

    // Check if cancel button redirects to /objects page
    fireEvent.click(cancelButton);
    expect(history.entries[history.length - 1].pathname).toBe("/objects");
});

test("Select different object types", async () => {
    let { container } = renderWithWrappers(<AddObject />);

    // Check if object types selector is rendered and enabled
    let objectTypeSelector = getByLabelText(container, "Object type");
    expect(objectTypeSelector.readOnly).toBeFalsy();

    // Select markdown object type and check if only markdown inputs are rendered
    fireEvent.change(objectTypeSelector, { target: { value: "markdown" } });
    await waitFor(() => getByText(objectTypeSelector, "Markdown"));
    expect(queryByLabelText(container, "Link")).toBeNull();
    // TODO add checks for new object types

    // Select todo object type and check if only todo inputs are rendered
    fireEvent.change(objectTypeSelector, { target: { value: "todo" } });
    await waitFor(() => getByText(objectTypeSelector, "To-Do List"));
    expect(queryByLabelText(container, "Link")).toBeNull();
    // TODO add checks for new object types

    // Select link object type and check if only link inputs are rendered
    fireEvent.change(objectTypeSelector, { target: { value: "link" } });
    await waitFor(() => getByText(objectTypeSelector, "Link"));
    getByLabelText(container, "Link");
    // TODO add checks for new object types
});

test("Modify object name and try saving an existing (in local state) object name", async () => {
    let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><AddObject /></Route>, {
        route: "/objects/add"
    });

    // Check if input is updating the state
    let objectNameInput = getByLabelText(container, "Object name");
    let objectDescriptionInput = getByLabelText(container, "Object description");
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
    let objectNameInput = getByLabelText(container, "Object name");
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
    let objectNameInput = getByLabelText(container, "Object name");
    let saveButton = getByText(container, "Save");
    fireEvent.change(objectNameInput, { target: { value: "error" } });
    await waitFor(() => expect(store.getState().objectUI.currentObject.object_name).toBe("error"));  // wait for object_name to be updated in state
    setFetchFailParams(true, "Test add fetch error");
    fireEvent.click(saveButton);
    await waitFor(() => getByText(container, "Test add fetch error"));
    expect(history.entries[history.length - 1].pathname).toBe("/objects/add");
    expect(store.getState().objects[1000]).toBeUndefined();
    setFetchFailParams();   // reset fetch params
});

test("Save a new link", async () => {
    let { container, history, store } = renderWithWrappers(
        <Route exact path="/objects/:id" render={ props => props.match.params.id === "add" ? <AddObject /> : <EditObject /> } />, 
        { route: "/objects/add" }
    );

    let objectNameInput = getByLabelText(container, "Object name");
    let objectDescriptionInput = getByLabelText(container, "Object description");
    let linkInput = getByLabelText(container, "Link");
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
    expect(getByLabelText(container, "Object name").value).toEqual("new object");
    expect(getByLabelText(container, "Object description").value).toEqual("new object description");
    expect(getByLabelText(container, "Link").value).toEqual("https://google.com");
    let object = store.getState().objects[object_id];
    getByText(container, object["created_at"]);
    getByText(container, object["modified_at"]);
});
