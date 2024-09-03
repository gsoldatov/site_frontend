import { deepCopy } from "../../util/copy";


/**
 * Default modal state
 */
const modalState = {
    image: {
        URL: "",
        isExpanded: false
    }
};


/**
 * Returns a copy of default modal state
 */
export const getDefaultModalState = () => deepCopy(modalState);
