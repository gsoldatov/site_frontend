import React, { useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Image, Modal, ModalContent } from "semantic-ui-react";

import { setModalImage } from "../../reducers/ui/modal";
import { getModalUIState } from "../../store/types/ui/modal";

import StyleModalWindow from "../../styles/modules/modal-window.css";


/**
 * Modal window component displaying an image based on app's modal state.
 * 
 * NOTE: if other types of content are to be displayed in a modal window, it can be implemented by using a wrapper component,
 * which will dispatch the render of the appropriate subcomponents.
 */
export const ModalWindow = () => {
    const modalRef = useRef();
    const URL = useSelector(state => state.modalUI.image.URL);
    const isExpanded = useSelector(state => state.modalUI.image.isExpanded);
    const open = URL.length > 0;

    // onClick handlers
    const dispatch = useDispatch();
    const imageOnClick = useMemo(() => () => {
        // When is expanded modal image is clicked to collapse, the scroll coordinates of its container (.modals)
        // need to be reset, so that container's children are rendered properly (if not, collapsed image will be rendered offscreen)
        if (isExpanded) modalRef.current.ref.current.parentNode.scrollTo(0, 0);

        dispatch(setModalImage({ isExpanded: !isExpanded }));
    }, [isExpanded]);
    const modalOnClose = useMemo(() => () => {
        dispatch(setModalImage(getModalUIState().image));
    }, [URL]);

    // mount node & CSS classname
    // NOTE: mountNode = "div.modal-container" is not available during first render of the component;
    // this will cause modal window to be mounted into document.body, if it's displayed at that time;
    // during subsequent renders "div.modal-container" should be available
    const mountNode = useMemo(() => document.querySelector("div.modal-container"), [open]);
    const modalClassname = "modal-window image" + (isExpanded ? " expanded" : "");

    // Render nothing, if URL is empty
    if (!open) return null;

    // Render modal window
    return (
        <Modal open={open} onClose={modalOnClose} mountNode={mountNode} ref={modalRef}
            className={modalClassname} closeIcon centered>
            <ModalContent>
                <Image onClick={imageOnClick} src={URL} />
            </ModalContent>
        </Modal>
    );
};
