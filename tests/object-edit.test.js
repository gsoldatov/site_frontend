import React from "react";
import { Route } from "react-router-dom";

import { fireEvent } from "@testing-library/react";
import { getByText, getByPlaceholderText, waitFor, queryByText, getByTitle } from '@testing-library/dom'

import { mockFetch, setFetchFailParams, resetMocks } from "./mocks/mock-fetch";
import { renderWithWrappers } from "./test-utils";
import createStore from "../src/store/create-store";

import { EditObject } from "../src/components/object";
import { addObjects, addObjectData, setObjectsTags, deleteObjects } from "../src/actions/objects";


beforeAll(() => { global.fetch = jest.fn(mockFetch); });
afterAll(() => { jest.resetAllMocks(); });
afterEach(() => { resetMocks(); });


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
    expect(saveButton.className.startsWith("disabled")).toBeTruthy(); // Semantic UI always adds onClick event to div elements, even if they are disabled (which does nothing in this case)
    // expect(saveButton.onclick).toBeNull(); 
    expect(deleteButton.className.startsWith("disabled")).toBeTruthy(); // Semantic UI always adds onClick event to div elements, even if they are disabled (which does nothing in this case)
    // expect(deleteButton.onclick).toBeNull(); 
});


test("Load an object with fetch error", async () => {
    setFetchFailParams(true, "Test view fetch error");

    // Route component is required for matching (getting :id part of the URL in the EditObject component)
    let { container } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
        route: "/objects/1"
    });

    // Check if error message if displayed
    await waitFor(() => getByText(container, "Test view fetch error", { exact: false }));
});


test("Load a link object from state", async () => {
    let store = createStore({ enableDebugLogging: false });
    let object = { object_id: 1, object_type: "link", object_name: "object name", object_description: "object description", 
                    created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), current_tag_ids: [1, 2, 3, 4, 5] };
    let objectData = { object_id: 1, object_type: "link", object_data: {"link": "https://test.link"} };
    store.dispatch(addObjects([object]));
    store.dispatch(setObjectsTags([object]));
    store.dispatch(addObjectData([objectData]));
    // Route component is required for matching (getting :id part of the URL in the EditObject component)
    let { container } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
        route: "/objects/1",
        store: store
    });

    // Check if object information is displayed on the page
    await waitFor(() => getByText(container, "Object Information"));
    let objectNameInput = getByPlaceholderText(container, "Object name");
    let objectDescriptionInput = getByPlaceholderText(container, "Object description");
    expect(objectNameInput.value).toEqual("object name");
    expect(objectDescriptionInput.value).toEqual("object description");
    getByText(container, object.created_at);
    getByText(container, object.modified_at);

    // Check if object type is displayed, but can't be changed
    const objectTypeSelector = container.querySelector(".object-type-menu");
    const linkButton = getByText(objectTypeSelector, "Link");
    expect(linkButton.parentNode.innerHTML.includes("check")).toBeTruthy();  // link button includes a check icon
    const markdownButton = getByText(objectTypeSelector, "Markdown");
    fireEvent.click(markdownButton);
    expect(store.getState().objectUI.currentObject.object_type).toEqual("link");

    // Check if link data is displayed
    expect(getByPlaceholderText(container, "Link").value).toEqual(objectData.object_data.link);
});


test("Load a link object attributes from state and data from backend", async () => {
    let store = createStore({ enableDebugLogging: false });
    let object = { object_id: 1, object_type: "link", object_name: "object name", object_description: "object description", 
                    created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), current_tag_ids: [1, 2, 3, 4, 5] };
    store.dispatch(addObjects([object]));
    store.dispatch(setObjectsTags([object]));
    // Route component is required for matching (getting :id part of the URL in the EditObject component)
    let { container } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
        route: "/objects/1",
        store: store
    });
    
    // Check if object information is displayed on the page
    await waitFor(() => getByText(container, "Object Information"));
    let objectNameInput = getByPlaceholderText(container, "Object name");
    let objectDescriptionInput = getByPlaceholderText(container, "Object description");
    expect(objectNameInput.value).toEqual("object name");
    expect(objectDescriptionInput.value).toEqual("object description");
    getByText(container, object.created_at);
    getByText(container, object.modified_at);

    // Check if object type is displayed, but can't be changed
    const objectTypeSelector = container.querySelector(".object-type-menu");
    const linkButton = getByText(objectTypeSelector, "Link");
    expect(linkButton.parentNode.innerHTML.includes("check")).toBeTruthy();  // link button includes a check icon
    const markdownButton = getByText(objectTypeSelector, "Markdown");
    fireEvent.click(markdownButton);
    expect(store.getState().objectUI.currentObject.object_type).toEqual("link");

    // Check if link data is displayed
    let objectData = store.getState().links[1];
    expect(objectData).toHaveProperty("link");
    expect(getByPlaceholderText(container, "Link").value).toEqual("https://website1.com");
});


test("Load a link object from backend", async () => {
    // Route component is required for matching (getting :id part of the URL in the EditObject component)
    let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
        route: "/objects/1"
    });

    // Check if object information is displayed on the page
    await waitFor(() => getByText(container, "Object Information"));
    let object = store.getState().objects[1];
    let objectNameInput = getByPlaceholderText(container, "Object name");
    let objectDescriptionInput = getByPlaceholderText(container, "Object description");
    expect(objectNameInput.value).toEqual(object.object_name);
    expect(objectDescriptionInput.value).toEqual(object.object_description);
    getByText(container, object.created_at);
    getByText(container, object.modified_at);

    // Check if link is displayed (shortened verison of previous test)
    expect(getByPlaceholderText(container, "Link").value).toEqual("https://website1.com");
});


test("Modify a link and click cancel", async () => {
    let store = createStore({ enableDebugLogging: false });
    let object = { object_id: 1, object_type: "link", object_name: "object name", object_description: "object description", 
                    created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), current_tag_ids: [1, 2, 3, 4, 5] };
    let objectData = { object_id: 1, object_type: "link", object_data: {"link": "https://test.link"} };
    store.dispatch(addObjects([object]));
    store.dispatch(setObjectsTags([object]));
    store.dispatch(addObjectData([objectData]));
    // Route component is required for matching (getting :id part of the URL in the EditObject component)
    let { container, history } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
        route: "/objects/1",
        store: store
    });
    
    // Wait for object information to be displayed on the page
    await waitFor(() => getByText(container, "Object Information"));

    // Check if changing object attributes modifies the currentObject in the state
    let objectNameInput = getByPlaceholderText(container, "Object name");
    let objectDescriptionInput = getByPlaceholderText(container, "Object description");
    fireEvent.change(objectNameInput, { target: { value: "modified object name" } });
    await waitFor(() => expect(store.getState().objectUI.currentObject.object_name).toBe("modified object name"));
    fireEvent.change(objectDescriptionInput, { target: { value: "modified object description" } });
    await waitFor(() => expect(store.getState().objectUI.currentObject.object_description).toBe("modified object description"));

    let linkInput = getByPlaceholderText(container, "Link");
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
    expect(store.getState().objectsTags[1]).toBeUndefined();
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
    expect(store.getState().objectsTags[1]).toBeTruthy();
    expect(store.getState().links[1]).toBeTruthy();
});


test("Save an existing link object", async () => {
    // Route component is required for matching (getting :id part of the URL in the EditObject component)
    let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
        route: "/objects/1"
    });

    // Wait for object information to be displayed on the page
    await waitFor(() => getByText(container, "Object Information"));
    let saveButton = getByText(container, "Save");
    let objectNameInput = getByPlaceholderText(container, "Object name");
    let objectDescriptionInput = getByPlaceholderText(container, "Object description");
    let linkInput = getByPlaceholderText(container, "Link");
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
    let objectNameInput = getByPlaceholderText(container, "Object name");
    let objectDescriptionInput = getByPlaceholderText(container, "Object description");
    let linkInput = getByPlaceholderText(container, "Link");

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
    let objectNameInput = getByPlaceholderText(container, "Object name");
    let objectDescriptionInput = getByPlaceholderText(container, "Object description");
    let linkInput = getByPlaceholderText(container, "Link");
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
});


test("Load a markdown object from state", async () => {
    let store = createStore({ enableDebugLogging: false });
    let object = { object_id: 1, object_type: "markdown", object_name: "object name", object_description: "object description", 
                    created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), current_tag_ids: [1, 2, 3, 4, 5] };
    let objectData = { object_id: 1, object_type: "markdown", object_data: {"raw_text": "**Test text**"} };
    store.dispatch(addObjects([object]));
    store.dispatch(setObjectsTags([object]));
    store.dispatch(addObjectData([objectData]));
    // Route component is required for matching (getting :id part of the URL in the EditObject component)
    let { container } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
        route: "/objects/1",
        store: store
    });

    // Check if object information is displayed on the page
    await waitFor(() => getByText(container, "Object Information"));
    let objectNameInput = getByPlaceholderText(container, "Object name");
    let objectDescriptionInput = getByPlaceholderText(container, "Object description");
    expect(objectNameInput.value).toEqual("object name");
    expect(objectDescriptionInput.value).toEqual("object description");
    getByText(container, object.created_at);
    getByText(container, object.modified_at);

    // Check if object type is displayed, but can't be changed
    const objectTypeSelector = container.querySelector(".object-type-menu");
    const markdownButton = getByText(objectTypeSelector, "Markdown");
    expect(markdownButton.parentNode.innerHTML.includes("check")).toBeTruthy();  // markdown button includes a check icon
    const linkButton = getByText(objectTypeSelector, "Link");
    fireEvent.click(linkButton);
    expect(store.getState().objectUI.currentObject.object_type).toEqual("markdown");

    // Check if markdown data is displayed in "both" mode
    const markdownContainer = document.querySelector(".markdown-container");
    expect(markdownContainer).toBeTruthy();
    let bothModeButton = getByTitle(markdownContainer, "Display edit window and parsed markdown");
    fireEvent.click(bothModeButton);
    let inputForm = getByPlaceholderText(markdownContainer, "Enter text here...");
    expect(inputForm.textContent).toEqual("**Test text**");
    await waitFor(() => {   // viewContainer is rendered when there is parsed text
        let viewContainer = markdownContainer.querySelector(".markdown-parsed-container");
        getByText(viewContainer, "Test text");
    });

    // Check if parsed markdown is displayed in "view" mode
    let viewModeButton = getByTitle(markdownContainer, "Display parsed markdown");
    fireEvent.click(viewModeButton);
    let viewContainer = markdownContainer.querySelector(".markdown-parsed-container");
    getByText(viewContainer, "Test text");
});


test("Load a markdown object attributes from state and data from backend", async () => {
    let store = createStore({ enableDebugLogging: false });
    let object = { object_id: 1001, object_type: "markdown", object_name: "object name", object_description: "object description", 
                    created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), current_tag_ids: [1, 2, 3, 4, 5] };
    store.dispatch(addObjects([object]));
    store.dispatch(setObjectsTags([object]));
    // Route component is required for matching (getting :id part of the URL in the EditObject component)
    let { container } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
        route: "/objects/1001",
        store: store
    });
    
    // Check if object information is displayed on the page
    await waitFor(() => getByText(container, "Object Information"));
    let objectNameInput = getByPlaceholderText(container, "Object name");
    let objectDescriptionInput = getByPlaceholderText(container, "Object description");
    expect(objectNameInput.value).toEqual("object name");
    expect(objectDescriptionInput.value).toEqual("object description");
    getByText(container, object.created_at);
    getByText(container, object.modified_at);

    // Check if object type is displayed, but can't be changed
    const objectTypeSelector = container.querySelector(".object-type-menu");
    const markdownButton = getByText(objectTypeSelector, "Markdown");
    expect(markdownButton.parentNode.innerHTML.includes("check")).toBeTruthy();  // markdown button includes a check icon
    const linkButton = getByText(objectTypeSelector, "Link");
    fireEvent.click(linkButton);
    expect(store.getState().objectUI.currentObject.object_type).toEqual("markdown");

    // Check if link data is displayed
    let objectData = store.getState().markdown[1001];
    expect(objectData).toHaveProperty("raw_text");
    // expect(getByPlaceholderText(container, "Link").value).toEqual("https://website1.com");
    const markdownContainer = document.querySelector(".markdown-container");
    expect(markdownContainer).toBeTruthy();
    await waitFor(() => {
        let viewContainer = markdownContainer.querySelector(".markdown-parsed-container");
        getByText(viewContainer, "Markdown Object #1001");
    });
});


test("Delete a markdown object", async () => {
    // Route component is required for matching (getting :id part of the URL in the EditObject component)
    let { container, store, history } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
        route: "/objects/1001"
    });

    // Wait for object information to be displayed on the page
    await waitFor(() => getByText(container, "Object Information"));

    // Check if delete removes the object and redirects
    let deleteButton = getByText(container, "Delete");
    fireEvent.click(deleteButton);
    let confimationDialogButtonYes = getByText(container, "Yes");
    fireEvent.click(confimationDialogButtonYes);

    await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe("/objects"));
    expect(store.getState().objects[1001]).toBeUndefined();
    expect(store.getState().markdown[1001]).toBeUndefined();
});

test("Update a markdown object", async () => {
    // Route component is required for matching (getting :id part of the URL in the EditObject component)
    let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
        route: "/objects/1001"
    });

    // Wait for object information to be displayed on the page
    await waitFor(() => getByText(container, "Object Information"));
    let saveButton = getByText(container, "Save");
    let objectNameInput = getByPlaceholderText(container, "Object name");
    let objectDescriptionInput = getByPlaceholderText(container, "Object description");
    const markdownContainer = document.querySelector(".markdown-container");
    expect(markdownContainer).toBeTruthy();
    let bothModeButton = getByTitle(markdownContainer, "Display edit window and parsed markdown");
    fireEvent.click(bothModeButton);
    let inputForm = getByPlaceholderText(markdownContainer, "Enter text here...");

    // Modify object attributes and save
    fireEvent.change(objectNameInput, { target: { value: "modified object name" } });
    await waitFor(() => expect(store.getState().objectUI.currentObject.object_name).toBe("modified object name"));
    fireEvent.change(objectDescriptionInput, { target: { value: "modified object description" } });
    await waitFor(() => expect(store.getState().objectUI.currentObject.object_description).toBe("modified object description"));
    fireEvent.change(inputForm, { target: { value: "# Modified Markdown" } });
    await waitFor(() => expect(store.getState().objectUI.currentObject.markdown.raw_text).toBe("# Modified Markdown"));
    fireEvent.click(saveButton);
    await waitFor(() => expect(store.getState().objects[1001].object_name).toEqual("modified object name"));
    expect(store.getState().objects[1001].object_description).toEqual("modified object description");
    expect(store.getState().markdown[1001].raw_text).toEqual("# Modified Markdown");
});
