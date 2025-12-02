import React from "react";

import { getBackend, MockBackend } from "../../../_mock-backend/mock-backend";
import { resetTestConfig } from "../../../_mocks/config";
import { renderWithWrappers } from "../../../_util/render";
import { createTestStore } from "../../../_util/create-test-store";
import { App } from "../../../../src/components/app";

import { ObjectsViewActions } from "../../../_ui/actions/pages/objects-view";
import {  ObjectsViewCardActions } from "../../../_ui/actions/page-parts/objects-view";

import { setObject } from "../../../_scenarios/objects/objects";
import { TagsViewActions } from "../../../_ui/actions/pages/tags-view";
import { Actions } from "../../../_ui/actions/actions";
import { TagsViewMenuActions } from "../../../_ui/actions/page-parts/tags-view";


/*
    /tags/view/:id page menu tests
*/
beforeEach(() => {
    // Set test app configuration
    resetTestConfig();
    
    global.backend = new MockBackend();
    global.fetch = global.backend.fetch;
});


afterEach(async () => {
    await (async () => {})();
});


test("Show only displayed in feed", async () => {
    // Render page
    let { container, historyManager } = renderWithWrappers(<App />, {
        route: "/tags/view?tagIDs=1"
    });
    const backend = getBackend();

    // Wait for page load
    const pageActions = new TagsViewActions(container);
    const pageLayout = await pageActions.waitForFeedLoad();

    // Check if all objects are fetched by default
    let requests = backend.history.getMatchingRequests("/objects/get_page_object_ids");
    expect(requests[0].requestContext.body["pagination_info"]["show_only_displayed_in_feed"]).toEqual(false);

    // Check if checkbox is not selected by default
    let menuActions = new TagsViewMenuActions(pageLayout.menu);
    menuActions.showOnlyDisplayedInFeedIsNotChecked();

    // Toggle checkbox selection
    menuActions.toggleShowOnlyDisplayedInFeed();
    await pageActions.waitForFeedReload();

    // Check if only displayed in feed objects were fetched
    requests = backend.history.getMatchingRequests("/objects/get_page_object_ids");
    expect(requests[1].requestContext.body["pagination_info"]["show_only_displayed_in_feed"]).toEqual(true);
});