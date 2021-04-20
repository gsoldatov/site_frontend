import React from "react";
import { Route } from "react-router-dom";

import { fireEvent } from "@testing-library/react";
import { getByText, getByPlaceholderText, waitFor, queryByText, getByTitle, queryByPlaceholderText } from "@testing-library/dom";

import { compareArrays } from "./test-utils/data-checks";
import { renderWithWrappers, renderWithWrappersAndDnDProvider } from "./test-utils/render";
import { clickGeneralTabButton, clickDataTabButton } from "./test-utils/ui-object";
import { getTDLByObjectID } from "./mocks/data-to-do-lists";

import createStore from "../src/store/create-store";

import { AddObject, EditObject } from "../src/components/object";
import { setObjectsTags } from "../src/actions/data-tags";
import { addObjects, addObjectData, deleteObjects } from "../src/actions/data-objects";


/*
    /objects/edit page tests.
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
    setFetchFail(true);

    // Route component is required for matching (getting :id part of the URL in the EditObject component)
    let { container } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
        route: "/objects/1"
    });

    // Check if error message if displayed
    await waitFor(() => getByText(container, "Failed to fetch data."));
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
    getByText(container, "Created at:");
    getByText(container, "Modified at:");

    // Check if object type is displayed, but can't be changed
    const objectTypeSelector = container.querySelector(".object-type-menu");
    const linkButton = getByText(objectTypeSelector, "Link");
    expect(linkButton.parentNode.innerHTML.includes("check")).toBeTruthy();  // link button includes a check icon
    const markdownButton = getByText(objectTypeSelector, "Markdown");
    fireEvent.click(markdownButton);
    expect(store.getState().objectUI.currentObject.object_type).toEqual("link");

    // Check if link data is displayed
    clickDataTabButton(container);
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
    getByText(container, "Created at:");
    getByText(container, "Modified at:");

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
    clickDataTabButton(container);
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
    getByText(container, "Created at:");
    getByText(container, "Modified at:");

    // Check if link is displayed (shortened verison of previous test)
    clickDataTabButton(container);
    expect(getByPlaceholderText(container, "Link").value).toEqual("https://website1.com");
});


test("Check 'Add Object' button", async () => {
    // Route component is required for matching (getting :id part of the URL in the EditObject component)
    let { container, history } = renderWithWrappers(
        <Route exact path="/objects/:id" render={ props => props.match.params.id === "add" ? <AddObject /> : <EditObject /> } />, 
        { route: "/objects/1" }
    );

    // Check if object information is displayed on the page
    await waitFor(() => getByText(container, "Object Information"));
    let addObjectButton = getByText(container, "Add Object");
    fireEvent.click(addObjectButton);
    expect(history.entries[history.length - 1].pathname).toBe("/objects/add");
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

    clickDataTabButton(container);
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
    getByText(container, "Delete This Object?");
    let confimationDialogButtonNo = getByText(container, "No");
    fireEvent.click(confimationDialogButtonNo);
    expect(queryByText(container, "Delete This Object?")).toBeNull();

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
    setFetchFail(true);
    let deleteButton = getByText(container, "Delete");
    fireEvent.click(deleteButton);
    let confimationDialogButtonYes = getByText(container, "Yes");
    fireEvent.click(confimationDialogButtonYes);

    // Check if error message is displayed and object is not deleted from state
    await waitFor(() => getByText(container, "Failed to fetch data."));
    expect(store.getState().objects[1]).toBeTruthy();
    expect(store.getState().objectsTags[1]).toBeTruthy();
    expect(store.getState().links[1]).toBeTruthy();
});

// // unique constraint on lowered object_name is removed
// test("Save an existing link object", async () => {
//     // Route component is required for matching (getting :id part of the URL in the EditObject component)
//     let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
//         route: "/objects/1"
//     });

//     // Add an existing object
//     store.dispatch(addObjects([ { object_id: 2, object_type: "link", object_name: "existing object name", object_description: "", 
//                     created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString() } ]));

//     // Wait for object information to be displayed on the page
//     await waitFor(() => getByText(container, "Object Information"));
//     let saveButton = getByText(container, "Save");
//     let objectNameInput = getByPlaceholderText(container, "Object name");
//     let objectDescriptionInput = getByPlaceholderText(container, "Object description");
//     let oldObject = {...store.getState().objects[1]};
//     let oldObjectData = {...store.getState().links[1]};

//     // Modify attributes
//     fireEvent.change(objectNameInput, { target: { value: "existing object name" } });
//     await waitFor(() => expect(store.getState().objectUI.currentObject.object_name).toBe("existing object name"));
//     fireEvent.change(objectDescriptionInput, { target: { value: "modified object description" } });
//     await waitFor(() => expect(store.getState().objectUI.currentObject.object_description).toBe("modified object description"));

//     // Modify data
//     clickDataTabButton(container);
//     let linkInput = getByPlaceholderText(container, "Link");
//     fireEvent.change(linkInput, { target: { value: "https://test.link.modified" } });
//     await waitFor(() => expect(store.getState().objectUI.currentObject.link).toBe("https://test.link.modified"));

//     // Check if existing object name (in local state) is not saved
//     fireEvent.click(saveButton);
//     await waitFor(() => getByText(container, "already exists", { exact: false }));
//     for (let attr of ["object_name", "object_description", "created_at", "modified_at"]) {
//         expect(store.getState().objects[1][attr]).toEqual(oldObject[attr]);
//     }
//     expect(store.getState().links[1].link).toEqual(oldObjectData.link);

//     // Check if existing object name (on backend) is not saved
//     store.dispatch(deleteObjects([2]));
//     fireEvent.click(saveButton);
//     await waitFor(() => getByText(container, "already exists", { exact: false }));
//     for (let attr of ["object_name", "object_name", "created_at", "modified_at"]) {
//         expect(store.getState().objects[1][attr]).toEqual(oldObject[attr]);
//     }
//     expect(store.getState().links[1].link).toEqual(oldObjectData.link);
// });


test("Save an empty link object", async () => {
    // Route component is required for matching (getting :id part of the URL in the EditObject component)
    let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
        route: "/objects/1"
    });

    // Wait for object information to be displayed on the page
    await waitFor(() => getByText(container, "Object Information"));
    let saveButton = getByText(container, "Save");
    let oldObjectData = {...store.getState().links[1]};

    // Check if an empty link is not saved
    clickDataTabButton(container);
    let linkInput = getByPlaceholderText(container, "Link");
    fireEvent.change(linkInput, { target: { value: "" } });
    await waitFor(() => expect(store.getState().objectUI.currentObject.link).toBe(""));
    fireEvent.click(saveButton);
    await waitFor(() => getByText(container, "Link value is required.", { exact: false }));
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

    // Modify attributes
    fireEvent.change(objectNameInput, { target: { value: "modified object name" } });
    await waitFor(() => expect(store.getState().objectUI.currentObject.object_name).toBe("modified object name"));
    fireEvent.change(objectDescriptionInput, { target: { value: "modified object description" } });
    await waitFor(() => expect(store.getState().objectUI.currentObject.object_description).toBe("modified object description"));

    // Modify data
    clickDataTabButton(container);
    let linkInput = getByPlaceholderText(container, "Link");
    fireEvent.change(linkInput, { target: { value: "https://test.link.modified" } });
    await waitFor(() => expect(store.getState().objectUI.currentObject.link).toBe("https://test.link.modified"));

    //  Save object
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

    // Modify attributes
    fireEvent.change(objectNameInput, { target: { value: "error" } });
    await waitFor(() => expect(store.getState().objectUI.currentObject.object_name).toBe("error"));
    fireEvent.change(objectDescriptionInput, { target: { value: "modified object description" } });
    await waitFor(() => expect(store.getState().objectUI.currentObject.object_description).toBe("modified object description"));

    // Modify data
    clickDataTabButton(container);
    let linkInput = getByPlaceholderText(container, "Link");
    fireEvent.change(linkInput, { target: { value: "https://test.link.modified" } });
    await waitFor(() => expect(store.getState().objectUI.currentObject.link).toBe("https://test.link.modified"));

    // Check error message is displayed and object is not modified in the state
    setFetchFail(true);
    fireEvent.click(saveButton);
    await waitFor(() => getByText(container, "Failed to fetch data."));
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
    // getByText(container, object.created_at);
    // getByText(container, object.modified_at);

    // Check if object type is displayed, but can't be changed
    const objectTypeSelector = container.querySelector(".object-type-menu");
    const markdownButton = getByText(objectTypeSelector, "Markdown");
    expect(markdownButton.parentNode.innerHTML.includes("check")).toBeTruthy();  // markdown button includes a check icon
    const linkButton = getByText(objectTypeSelector, "Link");
    fireEvent.click(linkButton);
    expect(store.getState().objectUI.currentObject.object_type).toEqual("markdown");

    // Check if markdown data is displayed in "both" mode
    clickDataTabButton(container);
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
    // getByText(container, object.created_at);
    // getByText(container, object.modified_at);

    // Check if object type is displayed, but can't be changed
    const objectTypeSelector = container.querySelector(".object-type-menu");
    const markdownButton = getByText(objectTypeSelector, "Markdown");
    expect(markdownButton.parentNode.innerHTML.includes("check")).toBeTruthy();  // markdown button includes a check icon
    const linkButton = getByText(objectTypeSelector, "Link");
    fireEvent.click(linkButton);
    expect(store.getState().objectUI.currentObject.object_type).toEqual("markdown");

    // Check if markdown data is displayed
    clickDataTabButton(container);
    let objectData = store.getState().markdown[1001];
    expect(objectData).toHaveProperty("raw_text");
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


test("Save an empty markdown object", async () => {
    // Route component is required for matching (getting :id part of the URL in the EditObject component)
    let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
        route: "/objects/1001"
    });

    // Wait for object information to be displayed on the page
    await waitFor(() => getByText(container, "Object Information"));
    let saveButton = getByText(container, "Save");
    let oldObjectData = {...store.getState().markdown[1001]};

    // Clear raw text
    clickDataTabButton(container);
    const markdownContainer = document.querySelector(".markdown-container");
    expect(markdownContainer).toBeTruthy();
    let bothModeButton = getByTitle(markdownContainer, "Display edit window and parsed markdown");
    fireEvent.click(bothModeButton);
    let markdownInput = getByPlaceholderText(container, "Enter text here...");
    fireEvent.change(markdownInput, { target: { value: "" } });
    await waitFor(() => expect(store.getState().objectUI.currentObject.markdown.raw_text).toBe(""));

    // Check if an empty markdown is not saved
    fireEvent.click(saveButton);
    await waitFor(() => getByText(container, "Markdown text is required.", { exact: false }));
    expect(store.getState().markdown[1001].raw_text).toEqual(oldObjectData.raw_text);
});


test("Update a markdown object", async () => {
    // Route component is required for matching (getting :id part of the URL in the EditObject component)
    let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
        route: "/objects/1001"
    });

    // Wait for object information to be displayed on the page
    await waitFor(() => getByText(container, "Object Information"));
    let saveButton = getByText(container, "Save");

    // Modify attributes
    let objectNameInput = getByPlaceholderText(container, "Object name");
    let objectDescriptionInput = getByPlaceholderText(container, "Object description");
    fireEvent.change(objectNameInput, { target: { value: "modified object name" } });
    await waitFor(() => expect(store.getState().objectUI.currentObject.object_name).toBe("modified object name"));
    fireEvent.change(objectDescriptionInput, { target: { value: "modified object description" } });
    await waitFor(() => expect(store.getState().objectUI.currentObject.object_description).toBe("modified object description"));
    
    // Modify data
    clickDataTabButton(container);
    const markdownContainer = document.querySelector(".markdown-container");
    expect(markdownContainer).toBeTruthy();
    let bothModeButton = getByTitle(markdownContainer, "Display edit window and parsed markdown");
    fireEvent.click(bothModeButton);
    let inputForm = getByPlaceholderText(markdownContainer, "Enter text here...");
    fireEvent.change(inputForm, { target: { value: "# Modified Markdown" } });
    await waitFor(() => expect(store.getState().objectUI.currentObject.markdown.raw_text).toBe("# Modified Markdown"));

    // Save object    
    fireEvent.click(saveButton);
    await waitFor(() => expect(store.getState().objects[1001].object_name).toEqual("modified object name"));
    expect(store.getState().objects[1001].object_description).toEqual("modified object description");
    expect(store.getState().markdown[1001].raw_text).toEqual("# Modified Markdown");
});


test("Load a to-do list object from state", async () => {
    let store = createStore();
    let object = { object_id: 1, object_type: "to_do_list", object_name: "object name", object_description: "object description", 
                    created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), current_tag_ids: [1, 2, 3, 4, 5] };
    let objectData = { object_id: 1, object_type: "to_do_list", object_data: getTDLByObjectID(2001) };
    store.dispatch(addObjects([object]));
    store.dispatch(setObjectsTags([object]));
    store.dispatch(addObjectData([objectData]));
    // Route component is required for matching (getting :id part of the URL in the EditObject component)
    let { container } = renderWithWrappersAndDnDProvider(<Route exact path="/objects/:id"><EditObject /></Route>, {
        route: "/objects/1",
        store: store
    });

    // Check if object information is displayed on the page
    await waitFor(() => getByText(container, "Object Information"));
    let objectNameInput = getByPlaceholderText(container, "Object name");
    let objectDescriptionInput = getByPlaceholderText(container, "Object description");
    expect(objectNameInput.value).toEqual("object name");
    expect(objectDescriptionInput.value).toEqual("object description");
    // getByText(container, object.created_at);
    // getByText(container, object.modified_at);

    // Check if object type is displayed, but can't be changed
    const objectTypeSelector = container.querySelector(".object-type-menu");
    const TDLButton = getByText(objectTypeSelector, "To-Do List");
    expect(TDLButton.parentNode.innerHTML.includes("check")).toBeTruthy();  // markdown button includes a check icon
    const linkButton = getByText(objectTypeSelector, "Link");
    fireEvent.click(linkButton);
    expect(store.getState().objectUI.currentObject.object_type).toEqual("to_do_list");

    // Check if all items are displayed (detailed interface checks are performed in to-do-lists.test.js)
    clickDataTabButton(container);
    const TDLContainer = container.querySelector(".to-do-list-container");
    expect(TDLContainer).toBeTruthy();
    for (let item of objectData.object_data.items) getByText(TDLContainer, item.item_text);
    getByPlaceholderText(TDLContainer, "New item");
});


test("Load a to-do list object attributes from state and data from backend", async () => {
    let store = createStore({ enableDebugLogging: false });
    let object = { object_id: 2001, object_type: "to_do_list", object_name: "object name", object_description: "object description", 
                    created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), current_tag_ids: [1, 2, 3, 4, 5] };
    store.dispatch(addObjects([object]));
    store.dispatch(setObjectsTags([object]));
    // Route component is required for matching (getting :id part of the URL in the EditObject component)
    let { container } = renderWithWrappersAndDnDProvider(<Route exact path="/objects/:id"><EditObject /></Route>, {
        route: "/objects/2001",
        store: store
    });
    
    // Check if object information is displayed on the page
    await waitFor(() => getByText(container, "Object Information"));
    let objectNameInput = getByPlaceholderText(container, "Object name");
    let objectDescriptionInput = getByPlaceholderText(container, "Object description");
    expect(objectNameInput.value).toEqual("object name");
    expect(objectDescriptionInput.value).toEqual("object description");
    // getByText(container, object.created_at);
    // getByText(container, object.modified_at);

    // Check if object type is displayed, but can't be changed
    const objectTypeSelector = container.querySelector(".object-type-menu");
    const TDLButton = getByText(objectTypeSelector, "To-Do List");
    expect(TDLButton.parentNode.innerHTML.includes("check")).toBeTruthy();  // to-do list button includes a check icon
    const linkButton = getByText(objectTypeSelector, "Link");
    fireEvent.click(linkButton);
    expect(store.getState().objectUI.currentObject.object_type).toEqual("to_do_list");

    // Check if all items are displayed (detailed interface checks are performed in to-do-lists.test.js)
    clickDataTabButton(container);
    const TDLContainer = container.querySelector(".to-do-list-container");
    expect(TDLContainer).toBeTruthy();
    for (let key of store.getState().objectUI.currentObject.toDoList.itemOrder) getByText(TDLContainer, store.getState().objectUI.currentObject.toDoList.items[key].item_text);
    getByPlaceholderText(TDLContainer, "New item");
});


test("Delete a to-do list object", async () => {
    // Route component is required for matching (getting :id part of the URL in the EditObject component)
    let { container, store, history } = renderWithWrappersAndDnDProvider(<Route exact path="/objects/:id"><EditObject /></Route>, {
        route: "/objects/2001"
    });

    // Wait for object information to be displayed on the page
    await waitFor(() => getByText(container, "Object Information"));

    // Check if delete removes the object and redirects
    let deleteButton = getByText(container, "Delete");
    fireEvent.click(deleteButton);
    let confimationDialogButtonYes = getByText(container, "Yes");
    fireEvent.click(confimationDialogButtonYes);

    await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe("/objects"));
    expect(store.getState().objects[2001]).toBeUndefined();
    expect(store.getState().toDoLists[2001]).toBeUndefined();
});


test("Save an empty to-do list object", async () => {
    // Route component is required for matching (getting :id part of the URL in the EditObject component)
    let { container, store } = renderWithWrappersAndDnDProvider(<Route exact path="/objects/:id"><EditObject /></Route>, {
        route: "/objects/2001"
    });

    // Wait for object information to be displayed on the page
    await waitFor(() => getByText(container, "Object Information"));
    let saveButton = getByText(container, "Save");
    let oldObjectData = {...store.getState().toDoLists[2001]};
    clickDataTabButton(container);
    const TDLContainer = container.querySelector(".to-do-list-container");
    expect(TDLContainer).toBeTruthy();
    
    // Delete all items
    TDLContainer.querySelectorAll(".to-do-list-item").forEach(item => {
        if (!queryByPlaceholderText(item, "New item")) {    // skip new item input
            fireEvent.mouseEnter(item);
            const deleteButton = getByTitle(item, "Delete item");
            fireEvent.click(deleteButton);
        }
    });
    expect(Object.keys(store.getState().objectUI.currentObject.toDoList.items).length).toEqual(0);

    // Check if an empty to-do list is not saved
    fireEvent.click(saveButton);
    await waitFor(() => getByText(container, "At least one item is required in the to-do list.", { exact: false }));
    expect(compareArrays(Object.keys(store.getState().toDoLists[2001].items).sort(), Object.keys(oldObjectData.items).sort())).toBeTruthy();
});


test("Update a to-do list object", async () => {
    // Route component is required for matching (getting :id part of the URL in the EditObject component)
    let { container, store } = renderWithWrappersAndDnDProvider(<Route exact path="/objects/:id"><EditObject /></Route>, {
        route: "/objects/2001"
    });

    // Wait for object information to be displayed on the page
    await waitFor(() => getByText(container, "Object Information"));
    let saveButton = getByText(container, "Save");

    // Modify attributes
    let objectNameInput = getByPlaceholderText(container, "Object name");
    let objectDescriptionInput = getByPlaceholderText(container, "Object description");
    fireEvent.change(objectNameInput, { target: { value: "modified object name" } });
    await waitFor(() => expect(store.getState().objectUI.currentObject.object_name).toBe("modified object name"));
    fireEvent.change(objectDescriptionInput, { target: { value: "modified object description" } });
    await waitFor(() => expect(store.getState().objectUI.currentObject.object_description).toBe("modified object description"));

    // Modify data
    clickDataTabButton(container);
    const TDLContainer = container.querySelector(".to-do-list-container");
    expect(TDLContainer).toBeTruthy();
    let newItemInput = getByPlaceholderText(TDLContainer, "New item");
    const newItemIndex = Math.max(...store.getState().objectUI.currentObject.toDoList.itemOrder) + 1;
    fireEvent.input(newItemInput, { target: { innerHTML: "new to-do list item" }});
    await waitFor(() => expect(store.getState().objectUI.currentObject.toDoList.items[newItemIndex].item_text).toBe("new to-do list item"));

    // Save object
    fireEvent.click(saveButton);
    await waitFor(() => expect(store.getState().objects[2001].object_name).toEqual("modified object name"));
    expect(store.getState().objects[2001].object_description).toEqual("modified object description");
    expect(store.getState().toDoLists[2001].items[newItemIndex].item_text).toEqual("new to-do list item");
});
