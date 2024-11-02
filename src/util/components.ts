import { type ReactNode, Children, isValidElement } from "react";
import { createStore } from "redux";


/**
 * Returns true, if any component in `children` will render anything.
 * https://github.com/facebook/react/issues/5517#issuecomment-2056832956
 * 
 * NOTE: `child.type(child.props)` does not work for some SUIR components due to props being read-only.
 * A possible workaround is to add a <div> wrapper in such cases.
 */
export const anyChildIsRendered = (children: ReactNode) => {
    const childArray = Children.toArray(children);

    if (childArray.length === 0) return false;
    return childArray.some(child => {
        if (!isValidElement(child)) return false;
        // child.type can be at least a function or a string
        // @ts-ignore (child.type is not always callable)
        if (typeof(child.type) === "function" && !child.type(child.props)) return false;
        return child.type;
    });
};


/**
 * Creates a simple Redux store with provided `initialState` and a reducer function, which allows to pass partial updates to the state.
 * 
 * To use created store, context, provider component & hook must be set up, as described here: https://react-redux.js.org/api/hooks#custom-context
 */
export const createComponentStore = <T extends Record<string, any>>(initialState: T) => {
    // A shortened reducer, which does not use action types and simply returns a new version of `state` with new values from `stateProps`.
    const reducer = (state: T, stateProps: Partial<T>) => {
        // Validate function params & new props' names
        if (typeof(stateProps) !== "object" || stateProps === null) throw Error(`Received ${stateProps} instead of an object.`);
        const statePropsKeys = [...Object.keys(stateProps)].filter(key => key !== "type");
        const nonExistingProps = statePropsKeys.filter(key => !(key in state));
        if (nonExistingProps.length > 0) throw Error(`Received props, which do not exist in state: ${nonExistingProps}.`);

        // Don't update state, if no new values were provided
        if (!statePropsKeys.some(key => stateProps[key] !== state[key])) return state;

        // Return updated state
        return { ...state, ...stateProps };
    };

    // @ts-ignore (reducer type does not match the type required by Redux, but it still works)
    return createStore(reducer, initialState);
};
