import React from "react";

import { MockBackend } from "../../../_mock-backend/mock-backend";
import { resetTestConfig } from "../../../_mocks/config";
import { renderWithWrappers } from "../../../_util/render";
import { createTestStore } from "../../../_util/create-test-store";
import { App } from "../../../../src/components/app";

import { ObjectsViewActions } from "../../../_ui/actions/pages/objects-view";
import {  ObjectsViewCardActions } from "../../../_ui/actions/page-parts/objects-view";

import { setObject } from "../../../_scenarios/objects/objects";
import { TagsViewActions } from "../../../_ui/actions/pages/tags-view";


/*
    /objects/view/:id page tests for composite multicolumn objects
*/
beforeEach(() => {
    // Set test app configuration
    resetTestConfig();
    
    global.backend = new MockBackend();
    global.fetch = global.backend.fetch;
});


afterEach(async () => {
    await (async () => {})();
})



describe("Common", () => {
    describe("Object ID <div>", () => {
        test("Object ID <div> is displayed", async () => {
            // Render page
            let { container, historyManager } = renderWithWrappers(<App />, {
                route: "/objects/view/1"
            });

            // Wait for page load
            const pageActions = new ObjectsViewActions(container);
            const pageLayout = await pageActions.waitForLoad();

            // Check if object ID <div> contains expected value
            const cardActions = new ObjectsViewCardActions(pageLayout.rootCard.card);
            cardActions.ensureObjectID(historyManager.getObjectID());
        });
    });

    describe("Timestamp", () => {
        test("Feed timestamp display", async () => {
            // Render page
            let { container } = renderWithWrappers(<App />, {
                route: "/objects/view/1"
            });

            // Wait for page load
            const pageActions = new ObjectsViewActions(container);
            const pageLayout = await pageActions.waitForLoad();

            // Check card timestamp
            const cardActions = new ObjectsViewCardActions(pageLayout.rootCard.card);
            cardActions.checkTimestamp("feed_timestamp");
        });


        test("Modified at display", async () => {
            // Remove `feed_timestamp` value
            setObject(1, { feed_timestamp: "" });

            // Render page
            let { container } = renderWithWrappers(<App />, {
                route: "/objects/view/1"
            });

            // Wait for page load
            const pageActions = new ObjectsViewActions(container);
            const pageLayout = await pageActions.waitForLoad();

            // Check card timestamp
            const cardActions = new ObjectsViewCardActions(pageLayout.rootCard.card);
            cardActions.checkTimestamp("modified_at");
        });
    });

    describe("Header", () => {
        test("Text", async () => {
            // Render page
            let { container } = renderWithWrappers(<App />, {
                route: "/objects/view/1"
            });

            // Wait for page load
            const pageActions = new ObjectsViewActions(container);
            const pageLayout = await pageActions.waitForLoad();

            // Check card header text
            const cardActions = new ObjectsViewCardActions(pageLayout.rootCard.card);
            cardActions.checkHeaderText();
        });


        test("View object button", async () => {
            // Render page
            let { container } = renderWithWrappers(<App />, {
                route: "/objects/view/1"
            });

            // Wait for page load
            const pageActions = new ObjectsViewActions(container);
            const pageLayout = await pageActions.waitForLoad();

            // Check if view object button is not displayed
            expect(pageLayout.rootCard.attributes.header.viewButton).toBeFalsy();
        });


        test("Edit button (logged as admin)", async () => {
            // Render page
            let { container, historyManager } = renderWithWrappers(<App />, {
                route: "/objects/view/1"
            });

            // Wait for page load
            const pageActions = new ObjectsViewActions(container);
            const pageLayout = await pageActions.waitForLoad();

            // Check if edit object button is displayed & working
            const cardActions = new ObjectsViewCardActions(pageLayout.rootCard.card);
            cardActions.clickEditObjectButton();
            historyManager.ensureCurrentURL("/objects/edit/1");
        });


        test("Edit button (anonymous)", async () => {
            // Render page
            const { store } = createTestStore({ addAdminToken: false });
            let { container } = renderWithWrappers(<App />, {
                route: "/objects/view/1", store
            });

            // Wait for page load
            const pageActions = new ObjectsViewActions(container);
            const pageLayout = await pageActions.waitForLoad();

            // Check if edit object button is not displayed
            expect(pageLayout.rootCard.attributes.header.editButton).toBeFalsy();
        });
    });


    describe("Object is edited message", () => {
        test("Display with & without edited object present in state", async () => {
            // Render page
            let { container, storeManager } = renderWithWrappers(<App />, {
                route: "/objects/view/1"
            });

            // Wait for page load
            const pageActions = new ObjectsViewActions(container);
            const pageLayout = await pageActions.waitForLoad();

            // Check if message is not displayed when object is not edited
            expect(pageLayout.rootCard.attributes.objectIsEdited).toBeFalsy();

            // Add object as edited & check if mesage is displayed
            storeManager.editedObjects.reset([1]);
            expect(pageActions.getLayout().rootCard.attributes.objectIsEdited).toBeTruthy();
        });
    });

    describe("Description (non-link)", () => {
        test("Not displayed", async () => {
            setObject(1, { object_type: "markdown" });

            // Render page
            let { container } = renderWithWrappers(<App />, {
                route: "/objects/view/1"
            });

            // Wait for page load
            const pageActions = new ObjectsViewActions(container);
            const pageLayout = await pageActions.waitForLoad();

            // Check if description is not displayed
            expect(pageLayout.rootCard.attributes.description).toBeFalsy();
        });


        test("Displayed", async () => {
            // Set object type & `show_description` to true
            setObject(1, { object_type: "markdown", show_description: true });

            // Render page
            let { container } = renderWithWrappers(<App />, {
                route: "/objects/view/1"
            });

            // Wait for page load
            const pageActions = new ObjectsViewActions(container);
            const pageLayout = await pageActions.waitForLoad();

            // Check if description is displayed
            const cardActions = new ObjectsViewCardActions(pageLayout.rootCard.card);
            cardActions.checkDescriptionText();
        });
    });

    describe("Tags", () => {
        test("Object without tags", async () => {
            // Clear default object tags
            setObject(1, { current_tag_ids: [] });

            // Render page
            let { container } = renderWithWrappers(<App />, {
                route: "/objects/view/1"
            });

            // Wait for page load
            const pageActions = new ObjectsViewActions(container);
            const pageLayout = await pageActions.waitForLoad();

            // Check if tag container is not displayed
            const cardActions = new ObjectsViewCardActions(pageLayout.rootCard.card);
            cardActions.checkTags();
        });


        test("Object with tags", async () => {
            // Render page
            let { container, historyManager } = renderWithWrappers(<App />, {
                route: "/objects/view/1"
            });

            // Wait for page load
            const pageActions = new ObjectsViewActions(container);
            const pageLayout = await pageActions.waitForLoad();

            // Check if correct tags are displayed
            const cardActions = new ObjectsViewCardActions(pageLayout.rootCard.card);
            cardActions.checkTags();

            // Click tag and check if redirect occured
            const tagID = global.backend.data.object(1).attributes.current_tag_ids[0];
            cardActions.clickTag(pageLayout.rootCard.tags.tags[0]);
            historyManager.ensureCurrentURL("/tags/view");
            historyManager.ensureCurrentURLParams(`?tagIDs=${tagID}`);

            // Wait for /tags/view page load
            const tagsViewPageActions = new TagsViewActions(container);
            await tagsViewPageActions.waitForFeedLoad();
        });
    });
});


describe("Link", () => {
    describe("Description (link)", () => {
        test("Desctiption NOT displayed & link NOT displayed as description", async () => {
            setObject(1, { object_type: "link", show_description: false }, { show_description_as_link: false });

            // Render page
            let { container } = renderWithWrappers(<App />, {
                route: "/objects/view/1"
            });

            // Wait for page load
            const pageActions = new ObjectsViewActions(container);
            const pageLayout = await pageActions.waitForLoad();

            // Check if description is not displayed
            expect(pageLayout.rootCard.attributes.description).toBeFalsy();
        });


        test("Desctiption NOT displayed & link displayed as description", async () => {
            setObject(1, { object_type: "link", show_description: false }, { show_description_as_link: true });

            // Render page
            let { container } = renderWithWrappers(<App />, {
                route: "/objects/view/1"
            });

            // Wait for page load
            const pageActions = new ObjectsViewActions(container);
            const pageLayout = await pageActions.waitForLoad();

            // Check if description is not displayed
            expect(pageLayout.rootCard.attributes.description).toBeFalsy();
        });


        test("Desctiption displayed & link displayed as description", async () => {
            setObject(1, { object_type: "link", show_description: true }, { show_description_as_link: true });

            // Render page
            let { container } = renderWithWrappers(<App />, {
                route: "/objects/view/1"
            });

            // Wait for page load
            const pageActions = new ObjectsViewActions(container);
            const pageLayout = await pageActions.waitForLoad();

            // Check if description is not displayed
            expect(pageLayout.rootCard.attributes.description).toBeFalsy();
        });


        test("Desctiption displayed & link NOT displayed as description", async () => {
            setObject(1, { object_type: "link", show_description: true }, { show_description_as_link: false });

            // Render page
            let { container } = renderWithWrappers(<App />, {
                route: "/objects/view/1"
            });

            // Wait for page load
            const pageActions = new ObjectsViewActions(container);
            const pageLayout = await pageActions.waitForLoad();

            // // Check if description is not displayed
            // expect(pageLayout.rootCard.attributes.description).toBeFalsy();
            // Check if description is displayed
            const cardActions = new ObjectsViewCardActions(pageLayout.rootCard.card);
            cardActions.checkDescriptionText();
        });
    });
});
