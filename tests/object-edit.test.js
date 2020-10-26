import React from "react";
import { Route } from "react-router-dom";

import { fireEvent } from "@testing-library/react";
import { getByText, getByLabelText, waitFor, queryByText } from '@testing-library/dom'

import { mockFetch, setFetchFailParams } from "./mocks/mock-fetch";
import { renderWithWrappers } from "./test-utils";
import createStore from "../src/store/create-store";

import { EditObject } from "../src/components/object/object";
import { addObjects, addObjectData, deleteObjects } from "../src/actions/objects";

beforeAll(() => {
    global.fetch = jest.fn(mockFetch);
});

afterAll(() => {
    setFetchFailParams();   // reset fetch params
    jest.resetAllMocks();
})

test("Load a non-existing object + check buttons", async () => {
    // Route component is required for matching (getting :id part of the URL in the EditObject component)
    let { container } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
        route: "/objects/9999"
    });

    // Check if error message if displayed
    await waitFor(() => getByText(container, "not found", { exact: false }));

    // Check if save and delete buttons can't be clicked if object fetch failed
    let saveButton = getByText(container, "Save");
    let deleteButton = getByText(container, "Delete");
    let cancelButton = getByText(container, "Cancel");
    expect(saveButton.onclick).toBeNull();
    expect(deleteButton.onclick).toBeNull();
});

test("Load an object with fetch error", async () => {
    setFetchFailParams(true, "Test view fetch error");

    // Route component is required for matching (getting :id part of the URL in the EditObject component)
    let { container } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
        route: "/objects/1"
    });

    // Check if error message if displayed
    await waitFor(() => getByText(container, "Test view fetch error", { exact: false }));
    setFetchFailParams();   // reset fetch params
});

test("Load a link object from state", async () => {
    let store = createStore({ enableDebugLogging: false });
    let object = { object_id: 1, object_type: "link", object_name: "object name", object_description: "object description", 
                    created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString() };
    let objectData = { object_id: 1, object_type: "link", object_data: {"link": "https://test.link"} };
    store.dispatch(addObjects([object]));
    store.dispatch(addObjectData([objectData]));
    // Route component is required for matching (getting :id part of the URL in the EditObject component)
    let { container } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/1",
            store: store
        });

    // Check if object information is displayed on the page
    await waitFor(() => getByText(container, "Object Information"));
    let objectNameInput = getByLabelText(container, "Object name");
    let objectDescriptionInput = getByLabelText(container, "Object description");
    expect(objectNameInput.value).toEqual("object name");
    expect(objectDescriptionInput.value).toEqual("object description");
    getByText(container, object.created_at);
    getByText(container, object.modified_at);

    // Check if object type is displayed, but can't be changed
    let typeSelector = getByLabelText(container, "Object type");
    expect(typeSelector.value).toEqual("link");
    expect(typeSelector.disabled).toBeTruthy();

    // Check if link data is displayed
    expect(getByLabelText(container, "Link").value).toEqual(objectData.object_data.link);
});

test("Load a link object attributes from state and data from backend", async () => {
    let store = createStore({ enableDebugLogging: false });
    let object = { object_id: 1, object_type: "link", object_name: "object name", object_description: "object description", 
                    created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString() };
    store.dispatch(addObjects([object]));
    // Route component is required for matching (getting :id part of the URL in the EditObject component)
    let { container } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/1",
            store: store
        });
    
    // Check if object information is displayed on the page
    await waitFor(() => getByText(container, "Object Information"));
    let objectNameInput = getByLabelText(container, "Object name");
    let objectDescriptionInput = getByLabelText(container, "Object description");
    expect(objectNameInput.value).toEqual("object name");
    expect(objectDescriptionInput.value).toEqual("object description");
    getByText(container, object.created_at);
    getByText(container, object.modified_at);

    // Check if object type is displayed, but can't be changed
    let typeSelector = getByLabelText(container, "Object type");
    expect(typeSelector.value).toEqual("link");
    expect(typeSelector.disabled).toBeTruthy();

    // Check if link data is displayed
    let objectData = store.getState().links[1];
    expect(objectData).toHaveProperty("link");
    expect(getByLabelText(container, "Link").value).toEqual("https://website1.com");
});


test("Load a link object from backend", async () => {
    // Route component is required for matching (getting :id part of the URL in the EditObject component)
    let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
        route: "/objects/1"
    });

    // Check if object information is displayed on the page
    await waitFor(() => getByText(container, "Object Information"));
    let object = store.getState().objects[1];
    let objectNameInput = getByLabelText(container, "Object name");
    let objectDescriptionInput = getByLabelText(container, "Object description");
    expect(objectNameInput.value).toEqual(object.object_name);
    expect(objectDescriptionInput.value).toEqual(object.object_description);
    getByText(container, object.created_at);
    getByText(container, object.modified_at);

    // Check if link is displayed (shortened verison of previous test)
    expect(getByLabelText(container, "Link").value).toEqual("https://website1.com");
});

test("Modify a link and click cancel", async () => {
    let store = createStore({ enableDebugLogging: false });
    let object = { object_id: 1, object_type: "link", object_name: "object name", object_description: "object description", 
                    created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString() };
    let objectData = { object_id: 1, object_type: "link", object_data: {"link": "https://test.link"} };
    store.dispatch(addObjects([object]));
    store.dispatch(addObjectData([objectData]));
    // Route component is required for matching (getting :id part of the URL in the EditObject component)
    let { container, history } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/1",
            store: store
        });
    
    // Wait for object information to be displayed on the page
    await waitFor(() => getByText(container, "Object Information"));

    // Check if changing object attributes modifies the currentObject in the state
    let objectNameInput = getByLabelText(container, "Object name");
    let objectDescriptionInput = getByLabelText(container, "Object description");
    fireEvent.change(objectNameInput, { target: { value: "modified object name" } });
    await waitFor(() => expect(store.getState().objectUI.currentObject.object_name).toBe("modified object name"));
    fireEvent.change(objectDescriptionInput, { target: { value: "modified object description" } });
    await waitFor(() => expect(store.getState().objectUI.currentObject.object_description).toBe("modified object description"));

    let linkInput = getByLabelText(container, "Link");
    fireEvent.change(linkInput, { target: { value: "https://test.link.modified" } });
    await waitFor(() => expect(store.getState().objectUI.currentObject.link).toBe("https://test.link.modified"));

    // Check if cancel button redirects to /objects page and does not modify object values
    let cancelButton = getByText(container, "Cancel");
    fireEvent.click(cancelButton);
    expect(history.entries[history.length - 1].pathname).toBe("/objects");
    for (let attr of ["object_id", "object_name", "object_description", "created_at", "modified_at"]) {
        expect(store.getState().objects[object["object_id"]][attr]).toEqual(object[attr]);
    }
    expect(store.getState().links[object["object_id"]].link).toEqual(objectData.object_data.link);
});

test("Delete a link object", async () => {
    // Route component is required for matching (getting :id part of the URL in the EditObject component)
    let { container, store, history } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
        route: "/objects/1"
    });

    // Wait for object information to be displayed on the page
    await waitFor(() => getByText(container, "Object Information"));
    let deleteButton = getByText(container, "Delete");
    fireEvent.click(deleteButton);

    // Check if confirmation dialog has appeared
    getByText(container, "Delete this object?");
    let confimationDialogButtonNo = getByText(container, "No");
    fireEvent.click(confimationDialogButtonNo);
    expect(queryByText(container, "Delete this object?")).toBeNull();

    // Check if delete removes the object and redirects
    deleteButton = getByText(container, "Delete");
    fireEvent.click(deleteButton);
    let confimationDialogButtonYes = getByText(container, "Yes");
    fireEvent.click(confimationDialogButtonYes);

    await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe("/objects"));
    expect(store.getState().objects[1]).toBeUndefined();
    expect(store.getState().links[1]).toBeUndefined();
});

test("Delete a link object with fetch error", async () => {
    // Route component is required for matching (getting :id part of the URL in the EditObject component)
    let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
        route: "/objects/1"
    });

    // Wait for object information to be displayed on the page and try to delete the object
    await waitFor(() => getByText(container, "Object Information"));
    setFetchFailParams(true, "Test delete fetch error");
    let deleteButton = getByText(container, "Delete");
    fireEvent.click(deleteButton);
    let confimationDialogButtonYes = getByText(container, "Yes");
    fireEvent.click(confimationDialogButtonYes);

    // Check if error message is displayed and object is not deleted from state
    await waitFor(() => getByText(container, "Test delete fetch error"));
    expect(store.getState().objects[1]).toBeTruthy();
    expect(store.getState().links[1]).toBeTruthy();
    setFetchFailParams();   // reset fetch params
});

test("Save an existing link object", async () => {
    // Route component is required for matching (getting :id part of the URL in the EditObject component)
    let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
        route: "/objects/1"
    });

    // Wait for object information to be displayed on the page
    await waitFor(() => getByText(container, "Object Information"));
    let saveButton = getByText(container, "Save");
    let objectNameInput = getByLabelText(container, "Object name");
    let objectDescriptionInput = getByLabelText(container, "Object description");
    let linkInput = getByLabelText(container, "Link");
    let oldObject = {...store.getState().objects[1]};
    let oldObjectData = {...store.getState().links[1]};

    // Check if existing object name (in local state) is not saved
    store.dispatch(addObjects([ { object_id: 2, object_type: "link", object_name: "existing object name", object_description: "", 
                    created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString() } ]));
    fireEvent.change(objectNameInput, { target: { value: "existing object name" } });
    await waitFor(() => expect(store.getState().objectUI.currentObject.object_name).toBe("existing object name"));
    fireEvent.change(objectDescriptionInput, { target: { value: "modified object description" } });
    await waitFor(() => expect(store.getState().objectUI.currentObject.object_description).toBe("modified object description"));
    fireEvent.change(linkInput, { target: { value: "https://test.link.modified" } });
    await waitFor(() => expect(store.getState().objectUI.currentObject.link).toBe("https://test.link.modified"));
    fireEvent.click(saveButton);
    await waitFor(() => getByText(container, "already exists", { exact: false }));
    for (let attr of ["object_name", "object_description", "created_at", "modified_at"]) {
        expect(store.getState().objects[1][attr]).toEqual(oldObject[attr]);
    }
    expect(store.getState().links[1].link).toEqual(oldObjectData.link);

    // Check if existing object name (on backend) is not saved
    store.dispatch(deleteObjects([2]));
    fireEvent.click(saveButton);
    await waitFor(() => getByText(container, "already exists", { exact: false }));
    for (let attr of ["object_name", "object_name", "created_at", "modified_at"]) {
        expect(store.getState().objects[1][attr]).toEqual(oldObject[attr]);
    }
    expect(store.getState().links[1].link).toEqual(oldObjectData.link);
});

test("Update a link object", async () => {
    // Route component is required for matching (getting :id part of the URL in the EditObject component)
    let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
        route: "/objects/1"
    });

    // Wait for object information to be displayed on the page
    await waitFor(() => getByText(container, "Object Information"));
    let saveButton = getByText(container, "Save");
    let objectNameInput = getByLabelText(container, "Object name");
    let objectDescriptionInput = getByLabelText(container, "Object description");
    let linkInput = getByLabelText(container, "Link");

    // Modify object attributes and save
    fireEvent.change(objectNameInput, { target: { value: "modified object name" } });
    await waitFor(() => expect(store.getState().objectUI.currentObject.object_name).toBe("modified object name"));
    fireEvent.change(objectDescriptionInput, { target: { value: "modified object description" } });
    await waitFor(() => expect(store.getState().objectUI.currentObject.object_description).toBe("modified object description"));
    fireEvent.change(linkInput, { target: { value: "https://test.link.modified" } });
    await waitFor(() => expect(store.getState().objectUI.currentObject.link).toBe("https://test.link.modified"));
    fireEvent.click(saveButton);
    await waitFor(() => expect(store.getState().objects[1].object_name).toEqual("modified object name"));
    expect(store.getState().objects[1].object_description).toEqual("modified object description");
    expect(store.getState().links[1].link).toEqual("https://test.link.modified");
});

test("Update a link object with fetch error", async () => {
    // Route component is required for matching (getting :id part of the URL in the EditObject component)
    let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
        route: "/objects/1"
    });

    // Wait for object information to be displayed on the page and try modifying the object
    await waitFor(() => getByText(container, "Object Information"));
    let oldObject = {...store.getState().objects[1]};
    let oldLink = {...store.getState().links[1]};
    let saveButton = getByText(container, "Save");
    let objectNameInput = getByLabelText(container, "Object name");
    let objectDescriptionInput = getByLabelText(container, "Object description");
    let linkInput = getByLabelText(container, "Link");
    fireEvent.change(objectNameInput, { target: { value: "error" } });
    await waitFor(() => expect(store.getState().objectUI.currentObject.object_name).toBe("error"));
    fireEvent.change(objectDescriptionInput, { target: { value: "modified object description" } });
    await waitFor(() => expect(store.getState().objectUI.currentObject.object_description).toBe("modified object description"));
    fireEvent.change(linkInput, { target: { value: "https://test.link.modified" } });
    await waitFor(() => expect(store.getState().objectUI.currentObject.link).toBe("https://test.link.modified"));
    setFetchFailParams(true, "Test update fetch error");
    fireEvent.click(saveButton);

    // Check error message is displayed and object is not modified in the state
    await waitFor(() => getByText(container, "Test update fetch error"));
    for (let attr of ["object_name", "object_description", "created_at", "modified_at"]) {
        expect(store.getState().objects[1][attr]).toEqual(oldObject[attr]);
    }
    expect(store.getState().links[1].link).toEqual(oldLink.link);
    setFetchFailParams();   // reset fetch params
});