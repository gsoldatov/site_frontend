import { Locator } from "../../_util/locator";
import { NodeModel } from "../../basic/node";
import { ObjectsViewCardDataModel } from "./data";

/**
 * Object model for an <ObjectsViewCard> component.
 */
export class ObjectsViewCardModel {
    constructor(container, context) {
        this.container = container;
        this.context = context;
        
        this.loaderLocator = new Locator(".ui.loader", { node: container });
        this.errorLocator = new Locator(".ui.error.message", { node: container });
        
        this._loader = null;
        this._error = null;
        this._data = null;
    }

    get loader() {
        if (!this._loader) this._loader = new NodeModel(this.loaderLocator);
        return this._loader;
    }

    get error() {
        if (!this._error) this._error = new NodeModel(this.errorLocator);
        return this._error;
    }

    async waitForPageLoad() {
        await this.loader.waitForAbsence();
        await this.error.waitForAbsence();
    }

    async waitForErrorText(expected) {
        await this.error.waitFor();
        expect(this.error.containsTextInChildren(expected)).toBeTruthy();
    }

    get data() {
        if (!this._data) this._data = new ObjectsViewCardDataModel(this.container, this.context);
        return this._data;
    }
}