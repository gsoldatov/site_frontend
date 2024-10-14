import { ModalLayout } from "../../layout/state-users/modal";
import { Actions } from "../actions";


/**
 * UI actions & checks for modal window
 */
export class ModalActions {
    constructor(container) {
        this.container = container;
        this.layout = new ModalLayout(container);
    }

    isDisplayed() {
        this.layout = new ModalLayout(this.container);
        return this.layout.modal !== null;
    }

    /**
     * Fail if modal is not displayed
     */
    ensureDisplayed() {
        if (!this.isDisplayed()) fail("Failed to find a displayed modal window.");
    }

    /**
     * Fail if modal is displayed
     */
    ensureNotDisplayed() {
        if (this.isDisplayed()) fail("Found unexpected displayed modal window.");
    }

    /**
     * Fail if modal does not have `expected` src
     */
    ensureImageSrc(expected) {
        if (!this.isDisplayed()) fail("Incorrect modal image: modal not displayed");
        if (!Actions.hasSrc(this.layout.image, expected)) fail(`Incorrect modal image: expected '${expected}' received '${this.layout.image.src}'`);
    }

    /**
     * Attempts to click modal image
     */
    clickImage() {
        if (!this.layout.image) fail("Failed to click modal background: element not found.");
        Actions.click(this.layout.image);
    }


    /**
     * Attempts to click modal background
     */
    clickBackground() {
        if (!this.layout.background) fail("Failed to click modal background: element not found.");
        Actions.click(this.layout.background);
    }

    /**
     * Attempts to click modal close icon
     */
    clickCloseIcon() {
        if (!this.layout.closeIcon) fail("Failed to click modal close icon: element not found.");
        Actions.click(this.layout.closeIcon);
    }

    /**
     * Ensures modal window is displayed & expanded
     */
    ensureExpanded() {
        if (!this.isDisplayed()) fail("Modal window is not displayed.");
        if (!this.layout.modal.classList.contains("expanded")) fail("Modal window is not expanded.");
    }

    /**
     * Ensures modal window is displayed & not expanded
     */
    ensureNotExpanded(refresh) {
        if (!this.isDisplayed()) fail("Modal window is not displayed.");
        if (this.layout.modal.classList.contains("expanded")) fail("Modal window is expanded.");
    }
}
