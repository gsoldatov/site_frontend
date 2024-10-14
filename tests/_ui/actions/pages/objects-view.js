import { waitFor } from "@testing-library/react";

import { Actions } from "../actions";
import { ObjectsViewLayout } from "../../layout/pages/objects-view";
import { ObjectsViewCardLayout } from "../../layout/page-parts/objects-view";


/**
 * UI actions & checks /objects/view/:id page
 */
export class ObjectsViewActions {
    constructor(container) {
        this.container = container;
        this.layout = new ObjectsViewLayout(container);
    }

    /**
     * Waits for page load to end and markdown containers to appear
     */
    async waitForPageLoad() {
        await this.waitForCardLoad((new ObjectsViewLayout(this.container)).rootCard.card);
        this.layout = new ObjectsViewLayout(this.container);
        return this.layout;
    }

    /**
     * Wait for error message to appear on the page with the specified `text`
     */
    async waitForErrorText(text) {
        await waitFor((function() {
            this.layout = new ObjectsViewLayout(this.container);
            expect(this.layout.rootCard.placeholders.loading).toBeFalsy();
            expect(Actions.containsText(this.layout.rootCard.placeholders.error), text).toBeTrue();
        }).bind(this));
        return this.layout;
    }


    /**
     * Waits for card loading placeholder to disappear and markdown containers to render
     */
    async waitForCardLoad(card) {
        let cardLayout;

        // Wait for placeholder to disappear
        await waitFor((function() {
            cardLayout = new ObjectsViewCardLayout(card);
            expect(cardLayout.placeholders.loading).toBeFalsy();
            expect(cardLayout.placeholders.error).toBeFalsy();
        }).bind(this));

        // Wait for markdown renders
        const { object_type, show_description } = global.backend.data.object(cardLayout.objectID);

        await waitFor(() => {
            cardLayout = new ObjectsViewCardLayout(card);
            if (show_description) expect(cardLayout.attributes.description).toBeTruthy();
            if (object_type === "markdown") expect(cardLayout.data.markdown.markdown).toBeTruthy();
        });

        return cardLayout;
    }
}
