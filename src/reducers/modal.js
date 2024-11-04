import { SET_MODAL_IMAGE } from "../actions/modal";


const setModalImage = (state, action) => {
    const { image } = action;

    return {
        ...state,
        modalUI: {
            ...state.modalUI,
            image: { ...state.modalUI.image, ...image }
        }
    }
};


const root = {
    SET_MODAL_IMAGE: setModalImage
};

export default root;
