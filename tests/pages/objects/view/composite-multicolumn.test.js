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
