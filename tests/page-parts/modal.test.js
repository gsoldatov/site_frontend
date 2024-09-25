import React from "react";

import { MockBackend } from "../_mock-backend/mock-backend";
import { resetTestConfig } from "../_mocks/config";
import { renderWithWrappers } from "../_util/render";
import { App } from "../../src/components/app";

import { ObjectsViewModel } from "../_page-object-models/pages/objects-view";
import { ModalWindowModel } from "../_page-object-models/state-users/modal-window";

import { markdownObjectWithImages } from "../_scenarios/modal";



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

    let { container, modelContext } = renderWithWrappers(<App />, {
        route: "/objects/view/1"
    });

    // Wait for page load
    const objectsViewModel = new ObjectsViewModel(container, modelContext);
    await objectsViewModel.objectsViewCard.waitForPageLoad();

    // Check if modal is not displayed by default
    const modalWindowModel = new ModalWindowModel(container);
    modalWindowModel.ensureNotDisplayed();
    
    // Click on first image
    const { images } = objectsViewModel.objectsViewCard.data.markdown;
    images[0].click();
    modalWindowModel.ensureDisplayed();
    modalWindowModel.ensureImageSrc(images[0].src);

    // Close modal and click another image
    modalWindowModel.background.click();
    modalWindowModel.ensureNotDisplayed();

    images[1].click();
    modalWindowModel.ensureDisplayed();
    modalWindowModel.ensureImageSrc(images[1].src);
});


test("Image is correctly expanded & collapsed", async () => {
    // Add backend data & render
    markdownObjectWithImages();

    let { container, modelContext } = renderWithWrappers(<App />, {
        route: "/objects/view/1"
    });

    // Wait for page load
    const objectsViewModel = new ObjectsViewModel(container, modelContext);
    await objectsViewModel.objectsViewCard.waitForPageLoad();

    // Check if modal is not displayed by default
    const modalWindowModel = new ModalWindowModel(container);
    modalWindowModel.ensureNotDisplayed();
    
    // Click on first image
    const { images } = objectsViewModel.objectsViewCard.data.markdown;
    images[0].click();
    modalWindowModel.ensureDisplayed();
    
    // Expand modal
    modalWindowModel.img.click();
    modalWindowModel.ensureExpanded();

    // Collapse modal
    modalWindowModel.img.click();
    modalWindowModel.ensureNotExpanded();
});


test("Image is correctly closed on outside click", async () => {
    // Add backend data & render
    markdownObjectWithImages();

    let { container, modelContext } = renderWithWrappers(<App />, {
        route: "/objects/view/1"
    });

    // Wait for page load
    const objectsViewModel = new ObjectsViewModel(container, modelContext);
    await objectsViewModel.objectsViewCard.waitForPageLoad();

    // Check if modal is not displayed by default
    const modalWindowModel = new ModalWindowModel(container);
    modalWindowModel.ensureNotDisplayed();
    
    // Click on first image
    const { images } = objectsViewModel.objectsViewCard.data.markdown;
    images[0].click();
    modalWindowModel.ensureDisplayed();
    
    // Close modal and click another image
    modalWindowModel.background.click();
    modalWindowModel.ensureNotDisplayed();
});


test("Image is correctly closed on close icon click", async () => {
    // Add backend data & render
    markdownObjectWithImages();

    let { container, modelContext } = renderWithWrappers(<App />, {
        route: "/objects/view/1"
    });

    // Wait for page load
    const objectsViewModel = new ObjectsViewModel(container, modelContext);
    await objectsViewModel.objectsViewCard.waitForPageLoad();

    // Check if modal is not displayed by default
    const modalWindowModel = new ModalWindowModel(container);
    modalWindowModel.ensureNotDisplayed();
    
    // Click on first image
    const { images } = objectsViewModel.objectsViewCard.data.markdown;
    images[0].click();
    modalWindowModel.ensureDisplayed();
    
    // Close modal and click another image
    modalWindowModel.closeIcon.click();
    modalWindowModel.ensureNotDisplayed();
});
