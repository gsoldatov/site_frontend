import { waitFor } from "@testing-library/react";

import { TagsViewLayout } from "../../layout/pages/tags-view";


/**
 * UI actions & checks /objects/view/:id object card
 */
export class TagsViewActions {
    container: HTMLElement
    layout: TagsViewLayout

    constructor(container: HTMLElement) {
        this.container = container;
        this.layout = new TagsViewLayout(container);
    }

    /**
     * Waits for feed loading placeholder to disappear
     */
    async waitForFeedLoad() {
        // Wait for placeholder to disappear
        await waitFor((function(this: TagsViewActions) {
            this.layout = new TagsViewLayout(this.container);
            expect(this.layout.feed.placeholders.loading).toBeFalsy();
            expect(this.layout.feed.placeholders.error).toBeFalsy();
        }).bind(this));

        // NOTE: can also wait here for card markdown renders to occur before exiting.

        // // Wait for markdown renders
        // const { object_type, show_description } = global.backend.data.object(this.layout.objectID).attributes;

        // await waitFor((function() {
        //     this.layout = new ObjectsViewCardLayout(this.card);
        //     if (show_description) expect(this.layout.attributes.description).toBeTruthy();
        //     if (object_type === "markdown") expect(this.layout.data.markdown.markdown).toBeTruthy();
        // }).bind(this));

        return this.layout;
    }

    // /**
    //  * Waits for card loading placeholder to disappear and markdown containers to render.
    //  * If `text` is provided, ensures it's in the error message.
    //  */
    // async waitForError(text) {
    //     // Wait for placeholder to disappear
    //     await waitFor((function() {
    //         this.layout = new ObjectsViewCardLayout(this.card);
    //         expect(this.layout.placeholders.loading).toBeFalsy();
    //         expect(this.layout.placeholders.error).toBeTruthy();
    //         if (text && !Actions.containsTextInChildren(this.layout.placeholders.error, text)) fail(`Failed to find error text '${text}'`);
    //     }).bind(this));

    //     return this.layout;
    // }
}
