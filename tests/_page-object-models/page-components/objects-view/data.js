import { Locator } from "../../_util/locator";

import { RenderedMarkdownModel } from "../../modules/rendered-markdown";


/**
 * Object model for object data inside <ObjectsViewCard> component.
 */
export class ObjectsViewCardDataModel {
    constructor(container, context) {
        this.container = container;
        this.context = context;

        this.markdownLocator = new Locator(".objects-view-data.markdown", { node: container });
    }

    get markdown() {
        if (!this._markdown) this._markdown = new RenderedMarkdownModel(this.markdownLocator);
        return this._markdown;
    }
}
