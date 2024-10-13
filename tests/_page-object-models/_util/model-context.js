/**
 * Container, which provides access to arbitrary `props` in page object models.
 * 
 * Can be linked to a parent context object.
 */
export class ModelContext {
    constructor(props, parentContext) {
        this.props = props;
        this.parentContext = parentContext;
    }

    /**
     * Tries to return a `prop` from the context or its ancestors.
     */
    get(prop) {
        let curr = this;

        while (curr) {
            if (prop in curr.props) return curr.props[prop];
            curr = curr.parentContext;
        }

        throw Error(`Failed to find context prop '${prop}'.`);
    }
}
