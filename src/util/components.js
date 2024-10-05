import { Children, isValidElement } from "react";


/**
 * Returns true, if any component in `children` will render anything.
 * https://github.com/facebook/react/issues/5517#issuecomment-2056832956
 * 
 * NOTE: `child.type(child.props)` does not work for some SUIR components due to props being read-only.
 * A possible workaround is to add a <div> wrapper in such cases.
 */
export const anyChildIsRendered = children => {
    const childArray = Children.toArray(children);

    if (childArray.length === 0) return false;
    return childArray.some(child => isValidElement(child) && child.type(child.props));
};
