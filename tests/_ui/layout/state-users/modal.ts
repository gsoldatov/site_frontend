/**
 * Modal window node references.
 */
export class ModalLayout {
    modalContainer: HTMLElement | null
    background: HTMLElement | null
    modal: HTMLElement | null
    image: HTMLElement | null
    closeIcon: HTMLElement | null

    constructor(container: HTMLElement) {
        this.modalContainer = null;
        this.background = null;
        this.modal = null;
        this.image = null;
        this.closeIcon = null;

        if (!container) return;

        this.modalContainer = container.querySelector(".modal-container");

        if (this.modalContainer) {
            this.background = this.modalContainer.querySelector(".ui.page.modals.dimmer");
            this.modal = this.modalContainer.querySelector(".ui.modal");
            if (this.modal) {
                this.image = this.modal.querySelector(".content > img");
                this.closeIcon = this.modal.querySelector("i");
            }
        }
    }
}
