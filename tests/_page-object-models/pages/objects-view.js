import { Locator } from "../_util/locator";
import { ModelContext } from "../_util/model-context";

import { ObjectsViewCardModel } from "../page-components/objects-view/objects-view-card";
import { ModalWindowModel } from "../state-users/modal-window";


/**
 * Top-level object model for /objects/view/:id page.
 */
export class ObjectsViewModel {
    constructor(container, context) {
        this.container = container;
        this.context = context;

        this.objectsViewCardLocator = new Locator(".objects-view-card-container.root", { node: container });
        
        this._objectsViewCard = null;
        this._modalWindow = null;
    }

    get objectsViewCard() {
        if (!this._objectsViewCard) {
            const context = new ModelContext({
                getObjectID: (() => {
                    const historyManager = context.get("historyManager");
                    return historyManager.getCurrentURL().replace("/objects/view/", "");
                }).bind(context)
            }, this.context);
            this._objectsViewCard = new ObjectsViewCardModel(this.objectsViewCardLocator.node, context);
        }
        return this._objectsViewCard;
    }

    get modalWindow() {
        if (!this._modalWindow) this._modalWindow = new ModalWindowModel(container);
        return this._modalWindow;
    }


}
