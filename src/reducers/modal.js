import { SET_MODAL_IMAGE } from "../actions/modal";


const setModalImage = (state, action) => {
    const { image } = action;

    return {
        ...state,
        modal: {
            ...state.modal,
            image: { ...state.modal.image, ...image }
        }
    }
};


const root = {
    SET_MODAL_IMAGE: setModalImage
};

export default root;
