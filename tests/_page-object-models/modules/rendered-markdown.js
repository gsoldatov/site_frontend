import { Locator } from "../_util/locator";

import { ImgModel } from "../basic/img";
import { NodeModel } from "../basic/node";


/**
 * Object model for rendered markdown container & contents
 */
export class RenderedMarkdownModel {
    constructor(locator) {
        this.locator = locator;

        this.renderedMarkdownLocator = new Locator(".rendered-markdown", { locator });

        this._renderedMarkdown = null;
    }

    get renderedMarkdown() {
        if (!this._renderedMarkdown) this._renderedMarkdown = new NodeModel(this.renderedMarkdownLocator);
        return this._renderedMarkdown;
    }

    get images() {
        const images = this.renderedMarkdown.getChildImages();
        if (!images) return null;
        return [...images].map(image => new ImgModel(undefined, image));
    }
}
