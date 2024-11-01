import { ModalLayout } from "../../layout/state-users/modal";
import { Actions } from "../actions";


/**
 * UI actions & checks for modal window
 */
export class ModalActions {
    container: HTMLElement
    layout: ModalLayout

    constructor(container: HTMLElement) {
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
        if (!this.isDisplayed()) throw Error("Failed to find a displayed modal window.");
    }

    /**
     * Fail if modal is displayed
     */
    ensureNotDisplayed() {
        if (this.isDisplayed()) throw Error("Found unexpected displayed modal window.");
    }

    /**
     * Fail if modal does not have `expected` src
     */
    ensureImageSrc(expected: string) {
        if (!this.isDisplayed()) throw Error("Incorrect modal image: modal not displayed.");
        if (!(this.layout.image instanceof HTMLImageElement)) throw Error("Incorrect modal image: modal image is not an <img> tag.");
        if (!Actions.hasSrc(this.layout.image, expected)) throw Error(`Incorrect modal image: expected '${expected}' received '${this.layout.image.src}'.`);
    }

    /**
     * Attempts to click modal image
     */
    clickImage() {
        if (!this.layout.image) throw Error("Failed to click modal background: element not found.");
        Actions.click(this.layout.image);
    }


    /**
     * Attempts to click modal background
     */
    clickBackground() {
        if (!this.layout.background) throw Error("Failed to click modal background: element not found.");
        Actions.click(this.layout.background);
    }

    /**
     * Attempts to click modal close icon
     */
    clickCloseIcon() {
        if (!this.layout.closeIcon) throw Error("Failed to click modal close icon: element not found.");
        Actions.click(this.layout.closeIcon);
    }

    /**
     * Ensures modal window is displayed & expanded
     */
    ensureExpanded() {
        if (!this.isDisplayed()) throw Error("Modal window is not displayed.");
        if (!this.layout.modal?.classList.contains("expanded")) throw Error("Modal window is not expanded.");
    }

    /**
     * Ensures modal window is displayed & not expanded
     */
    ensureNotExpanded() {
        if (!this.isDisplayed()) throw Error("Modal window is not displayed.");
        if (this.layout.modal?.classList.contains("expanded")) throw Error("Modal window is expanded.");
    }
}
