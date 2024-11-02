export const SET_MODAL_IMAGE = "SET_MODAL_IMAGE";


/** [Reducer file](../reducers/modal.js) */
export const setModalImage = (image: { URL: string, isExpanded: boolean }) => ({ type: SET_MODAL_IMAGE, image });   // NOTE: use state types, when they're available
