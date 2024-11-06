import { setModalImage } from "../../reducers/ui/modal";
import { getFromDocumentApp } from "../document-app";


/**
 * Adds onClick event handlers for <img> elements inside the `container`.
 * 
 * Handlers update app state to display a modal window with the image that got clicked.
 */
export const addImageOnClickHandlers = (container: HTMLElement) => {
    container.querySelectorAll("img").forEach(node => {
        node.addEventListener("click", imageOnClick);
    });
};


/**
 * Sets app's modal window state to display image from `event` target.
 */
const imageOnClick = (e: MouseEvent) => {
    getFromDocumentApp("store").dispatch(setModalImage({ URL: (e.target as HTMLImageElement).src } ));
};
