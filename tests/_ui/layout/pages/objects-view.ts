import { ObjectsViewCardLayout } from "../page-parts/objects-view";
import { ModalLayout } from "../state-users/modal"


/**
 * /objects/view/:id page nodes' references.
 */
export class ObjectsViewLayout {
    modal: ModalLayout
    rootCard: ObjectsViewCardLayout

    constructor(container: HTMLElement) {
        this.modal = new ModalLayout(container);
        this.rootCard = new ObjectsViewCardLayout(container.querySelector(".objects-view-card-container.root"))
    }
}
