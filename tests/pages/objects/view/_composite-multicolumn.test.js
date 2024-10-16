import React from "react";
import { waitFor } from "@testing-library/react";

import { MockBackend } from "../../../_mock-backend/mock-backend";
import { resetTestConfig } from "../../../_mocks/config";
import { renderWithWrappers } from "../../../_util/render";
import { createTestStore } from "../../../_util/create-test-store";
import { App } from "../../../../src/components/app";

import { ObjectsViewActions } from "../../../_ui/actions/pages/objects-view";
import { ExpandToggleActions, ObjectsViewCardActions } from "../../../_ui/actions/page-parts/objects-view";

import { basicCompositeMulticolumnObject } from "../../../_scenarios/objects/composite-multicolumn";
import { addNonExistingObjectsForObjectsView, mockFetchFailForObjectsView } from "../../../_scenarios/objects/fetch-failures";
import { setObject } from "../../../_scenarios/objects/objects";
import { TagsViewActions } from "../../../_ui/actions/pages/tags-view";
import { ObjectsViewCardLayout } from "../../../_ui/layout/page-parts/objects-view";


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


describe("Load errors", () => {
    test("Object load fetch failure", async () => {
        // Adds a composite multicolumn object & simulate its fetch failure
        basicCompositeMulticolumnObject(1);
        mockFetchFailForObjectsView([1]);

        // Render page
        let { container } = renderWithWrappers(<App />, {
            route: "/objects/view/1"
        });

        // Wait for page load
        const pageActions = new ObjectsViewActions(container);
        await pageActions.waitForError("Failed to fetch data.");
    });


    test("Subobject load fetch failure", async () => {
        // Adds a composite multicolumn object & simulate subobject fetch failure
        basicCompositeMulticolumnObject(1);
        mockFetchFailForObjectsView([2]);

        // Render page
        let { container } = renderWithWrappers(<App />, {
            route: "/objects/view/1"
        });

        // Wait for page load
        const pageActions = new ObjectsViewActions(container);
        await pageActions.waitForLoad();

        // Get card of subobject, which will fail to load & ensure error is displayed
        const { card } = pageActions.getSubobjectCardLayoutByID(2);
        const cardActions = new ObjectsViewCardActions(card);
        await cardActions.waitForError("Failed to fetch data.");
    });


    test("Subobject does not exist", async () => {
        // Adds a composite multicolumn object & simulate subobject fetch failure
        basicCompositeMulticolumnObject(1);
        addNonExistingObjectsForObjectsView([2]);

        // Render page
        let { container } = renderWithWrappers(<App />, {
            route: "/objects/view/1"
        });

        // Wait for page load
        const pageActions = new ObjectsViewActions(container);
        await pageActions.waitForLoad();

        // Get card of subobject, which will fail to load & ensure error is displayed
        const { card } = pageActions.getSubobjectCardLayoutByID(2);
        const cardActions = new ObjectsViewCardActions(card);
        await cardActions.waitForError("not found");
    });
});


describe("Correct load, object card", () => {
    test("Object ID <div>", async () => {
        // Adds a composite multicolumn object
        basicCompositeMulticolumnObject(1);

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


    test("Timestamp (feed timestamp)", async () => {
        // Adds a composite multicolumn object
        basicCompositeMulticolumnObject(1);

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


    test("Timestamp (modified_at)", async () => {
        // Adds a composite multicolumn object & remove `feed_timestamp` value
        basicCompositeMulticolumnObject(1);
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


    test("Header text", async () => {
        // Adds a composite multicolumn object
        basicCompositeMulticolumnObject(1);

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


    test("Header view object button", async () => {
        // Adds a composite multicolumn object
        basicCompositeMulticolumnObject(1);

        // Render page
        let { container } = renderWithWrappers(<App />, {
            route: "/objects/view/1"
        });

        // Wait for page load
        const pageActions = new ObjectsViewActions(container);
        const pageLayout = await pageActions.waitForLoad();

        // Check card header view object button
        expect(pageLayout.rootCard.attributes.header.viewButton).toBeFalsy();
    });


    test("Header edit button (logged as admin)", async () => {
        // Adds a composite multicolumn object
        basicCompositeMulticolumnObject(1);

        // Render page
        let { container, historyManager } = renderWithWrappers(<App />, {
            route: "/objects/view/1"
        });

        // Wait for page load
        const pageActions = new ObjectsViewActions(container);
        const pageLayout = await pageActions.waitForLoad();

        // Check card header edit object button
        const cardActions = new ObjectsViewCardActions(pageLayout.rootCard.card);
        cardActions.clickEditObjectButton();
        historyManager.ensureCurrentURL("/objects/edit/1");
    });


    test("Header edit button (anonymous)", async () => {
        // Adds a composite multicolumn object
        basicCompositeMulticolumnObject(1);

        // Render page
        const { store } = createTestStore({ addAdminToken: false });
        let { container } = renderWithWrappers(<App />, {
            route: "/objects/view/1", store
        });

        // Wait for page load
        const pageActions = new ObjectsViewActions(container);
        const pageLayout = await pageActions.waitForLoad();

        // Check card header edit object button
        expect(pageLayout.rootCard.attributes.header.editButton).toBeFalsy();
    });


    test("Object is edited message", async () => {
        // Adds a composite multicolumn object
        basicCompositeMulticolumnObject(1);

        // Render page
        let { container, storeManager } = renderWithWrappers(<App />, {
            route: "/objects/view/1"
        });

        // Wait for page load
        const pageActions = new ObjectsViewActions(container);
        const pageLayout = await pageActions.waitForLoad();

        // Check if message is not displayed
        expect(pageLayout.rootCard.attributes.objectIsEdited).toBeFalsy();

        // Add object as edited & check if mesage is displayed
        storeManager.editedObjects.reset([1]);
        expect(pageActions.getLayout().rootCard.attributes.objectIsEdited).toBeTruthy();
    });


    test("Description (not displayed)", async () => {
        // Adds a composite multicolumn object
        basicCompositeMulticolumnObject(1);

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


    test("Description (displayed)", async () => {
        // Adds a composite multicolumn object
        basicCompositeMulticolumnObject(1);
        setObject(1, { show_description: true });

        // Render page
        let { container } = renderWithWrappers(<App />, {
            route: "/objects/view/1"
        });

        // Wait for page load
        const pageActions = new ObjectsViewActions(container);
        const pageLayout = await pageActions.waitForLoad();

        // Check if description is not displayed
        const cardActions = new ObjectsViewCardActions(pageLayout.rootCard.card);
        cardActions.checkDescriptionText();
    });


    test("Tags (object is not tagged)", async () => {
        // Adds a composite multicolumn object
        basicCompositeMulticolumnObject(1);
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


    test("Tags", async () => {
        // Adds a composite multicolumn object
        basicCompositeMulticolumnObject(1);
        setObject(1, { show_description: true });

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



    /**
     * TODO, object attributes, when moved to attributes-and-tags
     * - link description;
     * - update scenarios usage (don't use link for description; use link for other tests);
     */
});


describe("Successful load", () => {
    test("Subobject card positions", async () => {
        // Adds a composite multicolumn object & simulate its fetch failure
        basicCompositeMulticolumnObject(1);

        // Render page
        let { container } = renderWithWrappers(<App />, {
            route: "/objects/view/1"
        });

        // Wait for page load
        const pageActions = new ObjectsViewActions(container);
        const pageLayout = await pageActions.waitForLoad();

        // Check if subobject cards are displayed in correct positions
        const cardActions = new ObjectsViewCardActions(pageLayout.rootCard.card);
        cardActions.checkCompositeMulticolumnSubobjectPositions();
    });
});


describe("Expand/collapse toggle", () => {
    test("Default state is correct", async () => {
        // Adds a composite multicolumn object & simulate its fetch failure
        basicCompositeMulticolumnObject(1);

        // Render page
        let { container } = renderWithWrappers(<App />, {
            route: "/objects/view/1"
        });

        // Wait for page load
        const pageActions = new ObjectsViewActions(container);
        const pageLayout = await pageActions.waitForLoad();

        // Check if subobject with `is_expanded` prop set to true has its toggle expanded.
        let expandToggleActions = new ExpandToggleActions(pageLayout.rootCard.data.compositeMulticolumn.columns[0][0].expandToggleContainer);
        expandToggleActions.ensureVisible();
        
        // Check if subobject with `is_expanded` prop set to false has its toggle collapsed.
        expandToggleActions = new ExpandToggleActions(pageLayout.rootCard.data.compositeMulticolumn.columns[0][1].expandToggleContainer);
        expandToggleActions.ensureHidden();
    });


    test("Expansion toggle click changes visibility", async () => {
        // Adds a composite multicolumn object & simulate its fetch failure
        basicCompositeMulticolumnObject(1);

        // Render page
        let { container } = renderWithWrappers(<App />, {
            route: "/objects/view/1"
        });

        // Wait for page load
        const pageActions = new ObjectsViewActions(container);
        const pageLayout = await pageActions.waitForLoad();

        // Get collapsed card and click toggle to expand it
        let expandToggleActions = new ExpandToggleActions(pageLayout.rootCard.data.compositeMulticolumn.columns[0][1].expandToggleContainer);
        expandToggleActions.ensureHidden();
        expandToggleActions.clickToggle();
        expandToggleActions.ensureVisible();

        // Click toggle and collapse card
        expandToggleActions.clickToggle();
        expandToggleActions.ensureHidden();
        
        // Wait for update fetch to complete (otherwise it will fire during the next test)
        await waitFor(() => { expect(global.backend.history.getMatchingRequestsCount("/objects/update")).toEqual(1); });
    });


    test("Expansion toggle click update fetch (admins)", async () => {
        // Adds a composite multicolumn object & simulate its fetch failure
        basicCompositeMulticolumnObject(1);

        // Render page
        let { container } = renderWithWrappers(<App />, {
            route: "/objects/view/1"
        });

        // Wait for page load
        const pageActions = new ObjectsViewActions(container);
        const pageLayout = await pageActions.waitForLoad();

        // Get collapsed card and click toggle to expand it
        let expandToggleActions = new ExpandToggleActions(pageLayout.rootCard.data.compositeMulticolumn.columns[0][1].expandToggleContainer);
        expandToggleActions.ensureHidden();
        expandToggleActions.clickToggle();
        expandToggleActions.ensureVisible();

        const changedSubobjectCardLayout = new ObjectsViewCardLayout(pageLayout.rootCard.data.compositeMulticolumn.columns[0][1].card);
        const changedSubobjectID = parseInt(changedSubobjectCardLayout.objectID);
        
        // Check if update fetch was fired
        await waitFor(() => {
            expect(global.backend.history.getMatchingRequestsCount("/objects/update")).toEqual(1);
            const { body } = global.backend.history.getMatchingRequests("/objects/update")[0].requestContext;
            const changedSubobjectData = body.object.object_data.subobjects.filter(so => so.object_id === changedSubobjectID)[0];
            expect(changedSubobjectData.is_expanded).toEqual(true);
        });
    });


    test("Expansion toggle click update fetch (anonymous)", async () => {
        // Adds a composite multicolumn object & simulate its fetch failure
        basicCompositeMulticolumnObject(1);

        // Render page
        const { store } = createTestStore({ addAdminToken: false });
        let { container } = renderWithWrappers(<App />, {
            route: "/objects/view/1", store
        });

        // Wait for page load
        const pageActions = new ObjectsViewActions(container);
        const pageLayout = await pageActions.waitForLoad();

        // Get collapsed card and click toggle to expand it
        let expandToggleActions = new ExpandToggleActions(pageLayout.rootCard.data.compositeMulticolumn.columns[0][1].expandToggleContainer);
        expandToggleActions.ensureHidden();
        expandToggleActions.clickToggle();
        expandToggleActions.ensureVisible();
        
        // Check if update fetch was not fired
        for (let i = 0; i < 5; i++) await waitFor(() => undefined);
        expect(global.backend.history.getMatchingRequestsCount("/objects/update")).toEqual(0);
    });
});
