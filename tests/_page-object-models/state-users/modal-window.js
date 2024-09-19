import { Locator } from "../_util/locator"
import { ImgModel } from "../basic/img";
import { NodeModel } from "../basic/node";


export class ModalWindowModel {
    constructor(container) {
        this.modalContainerLocator = new Locator(".modal-container", { node: container });
        this.backgroundLocator = new Locator(".ui.page.modals.dimmer", { locator: this.modalContainerLocator });
        this.modalLocator = new Locator(".ui.modal", { locator: this.modalContainerLocator });
        this.imageLocator = new Locator(".content > img", { locator: this.modalLocator });
        this.closeIconLocator = new Locator("i", { locator: this.modalLocator });

        this.background = new NodeModel(this.backgroundLocator);
        this.img = new ImgModel(this.imageLocator);
        this.closeIcon = new NodeModel(this.closeIconLocator);
    }
    
    isDisplayed() {
        return this.modalLocator.isOnPage();
    }

    ensureDisplayed() {
        this.modalContainerLocator.refresh();
        if (!this.isDisplayed()) fail("Failed to find a displayed modal window.");
    }

    ensureNotDisplayed() {
        this.modalContainerLocator.refresh();
        if (this.isDisplayed()) fail("Found unexpected displayed modal window.");
    }

    ensureImageSrc(expected, refresh) {
        if (refresh) this.modalContainerLocator.refresh();
        this.img.ensureSrc(expected);
    }

    ensureExpanded(refresh) {
        if (refresh) this.modalContainerLocator.refresh();
        if (!this.modalLocator.node.classList.contains("expanded")) fail("Modal window is not expanded.");
    }

    ensureNotExpanded(refresh) {
        if (refresh) this.modalContainerLocator.refresh();
        if (this.modalLocator.node.classList.contains("expanded")) fail("Modal window is expanded.");
    }
}
