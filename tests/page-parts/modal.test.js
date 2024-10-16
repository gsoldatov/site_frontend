import React from "react";

import { MockBackend } from "../_mock-backend/mock-backend";
import { resetTestConfig } from "../_mocks/config";
import { renderWithWrappers } from "../_util/render";
import { App } from "../../src/components/app";

import { markdownObjectWithImages } from "../_scenarios/modal";
import { ObjectsViewActions } from "../_ui/actions/pages/objects-view";
import { ModalActions } from "../_ui/actions/state-users/modal";
import { Actions } from "../_ui/actions/actions";


/*
    Modal window display tests for rendered markdown images.
*/
beforeEach(() => {
    // Set test app configuration
    resetTestConfig();
    
    global.backend = new MockBackend();
    global.fetch = global.backend.fetch;

    // Add a stub for method absent in test env
    window.HTMLElement.prototype.scrollTo = () => {};
});

afterEach(() => {
    delete window.HTMLElement.prototype[scrollTo];
});


test("Image is correctly displayed on click", async () => {
    // Add backend data & render
    markdownObjectWithImages();

    let { container } = renderWithWrappers(<App />, {
        route: "/objects/view/1"
    });

    // Wait for page load
    const pageActions = new ObjectsViewActions(container);
    const pageLayout = await pageActions.waitForLoad();

    // Check if modal is not displayed by default
    const modalActions = new ModalActions(container);
    modalActions.ensureNotDisplayed();

    // Click on first image
    const images = Actions.getMatchingChildren(pageLayout.rootCard.data.markdown.markdown, "img", 2);
    Actions.click(images[0]);
    modalActions.ensureImageSrc(images[0].src);

    // Close modal and click another image
    modalActions.clickBackground();
    modalActions.ensureNotDisplayed();

    Actions.click(images[1]);
    modalActions.ensureImageSrc(images[1].src);
});


test("Image is correctly expanded & collapsed", async () => {
    // Add backend data & render
    markdownObjectWithImages();

    let { container } = renderWithWrappers(<App />, {
        route: "/objects/view/1"
    });

    // Wait for page load
    const pageActions = new ObjectsViewActions(container);
    const pageLayout = await pageActions.waitForLoad();

    // Click on first image
    const images = Actions.getMatchingChildren(pageLayout.rootCard.data.markdown.markdown, "img", 2);
    Actions.click(images[0]);
    const modalActions = new ModalActions(container);
    
    // Expand modal
    modalActions.clickImage();
    modalActions.ensureExpanded();

    // Collapse modal
    modalActions.clickImage();
    modalActions.ensureNotExpanded();
});


test("Image is correctly closed on outside click", async () => {
    // Add backend data & render
    markdownObjectWithImages();

    let { container } = renderWithWrappers(<App />, {
        route: "/objects/view/1"
    });

    // Wait for page load
    const pageActions = new ObjectsViewActions(container);
    const pageLayout = await pageActions.waitForLoad();

    // Click on first image
    const images = Actions.getMatchingChildren(pageLayout.rootCard.data.markdown.markdown, "img", 2);
    Actions.click(images[0]);

    // Close modal
    const modalActions = new ModalActions(container);
    modalActions.clickBackground();
    modalActions.ensureNotDisplayed();
});


test("Image is correctly closed on close icon click", async () => {
    // Add backend data & render
    markdownObjectWithImages();

    let { container } = renderWithWrappers(<App />, {
        route: "/objects/view/1"
    });

    // Wait for page load
    const pageActions = new ObjectsViewActions(container);
    const pageLayout = await pageActions.waitForLoad();

    // Click on first image
    const images = Actions.getMatchingChildren(pageLayout.rootCard.data.markdown.markdown, "img", 2);
    Actions.click(images[0]);

    // Close modal
    const modalActions = new ModalActions(container);
    modalActions.clickCloseIcon();
    modalActions.ensureNotDisplayed();
});
