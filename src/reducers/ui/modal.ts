import type { ModalImageUI } from "../../store/types/ui/modal";
import type { State } from "../../store/types/state";


/**
 * Updates state.modalUI.image with values from `image`.
 */
export const setModalImage = (image: Partial<ModalImageUI>) => ({ type: "SET_MODAL_IMAGE", image });


const _setModalImage = (state: State, action: { image: Partial<ModalImageUI> }): State => {
    const { image } = action;

    return {
        ...state,
        modalUI: {
            ...state.modalUI,
            image: { ...state.modalUI.image, ...image }
        }
    }
};


export const modalRoot = {
    "SET_MODAL_IMAGE": _setModalImage
};
