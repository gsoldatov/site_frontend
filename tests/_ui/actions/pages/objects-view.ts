import { ObjectsViewLayout } from "../../layout/pages/objects-view";
import { ObjectsViewCardActions } from "../page-parts/objects-view";
import { ObjectsViewCardLayout } from "../../layout/page-parts/objects-view";


/**
 * UI actions & checks /objects/view/:id page
 */
export class ObjectsViewActions {
    container: HTMLElement
    layout: ObjectsViewLayout

    constructor(container: HTMLElement) {
        this.container = container;
        this.layout = new ObjectsViewLayout(container);
    }

    /**
     * Refreshes layout and returns it
     */
    getLayout() {
        this.layout = new ObjectsViewLayout(this.container);
        return this.layout;
    }

    /**
     * Waits for page load to end and markdown containers to appear
     */
    async waitForLoad() {
        const cardActions = new ObjectsViewCardActions(this.layout.rootCard.card);
        await cardActions.waitForLoad();
        this.layout = new ObjectsViewLayout(this.container);
        return this.layout;
    }

    /**
     * Waits for error message to appear on the page.
     * If `text` is provided, ensures it's in the error message.
     */
    async waitForError(text: string) {
        const cardActions = new ObjectsViewCardActions(this.layout.rootCard.card);
        await cardActions.waitForError(text);
        this.layout = new ObjectsViewLayout(this.container);
        return this.layout;
    }

    /**
     * Returns a subobject card for the specified `subobjectID` or fails, if it does not exist.
     */
    getSubobjectCardLayoutByID(subobjectID: number | string) {
        if (!this.layout.rootCard?.data?.compositeMulticolumn) throw Error("Failed to get subobject card: multicolumn data not found.");
        
        for (let column of this.layout.rootCard.data.compositeMulticolumn.columns) {
            for (let cardData of column) {
                const layout = new ObjectsViewCardLayout(cardData.card);
                if (layout.objectID === subobjectID.toString()) return layout;
            }
        }

        throw Error(`Failed to get subobject card: card for subobject '${subobjectID}' not found.`);
    }
}
