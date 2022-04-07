import { fireEvent, getByTitle, waitFor } from "@testing-library/dom";

/**
 * Searches for a markdown editor inside `container` and returns its elements.
 * An existing markdown editor container `editorContainer` can be provided instead to return its elements.
 */
export const getMarkdownEditorElements = ({ container, editorContainer }) => {
    const result = {
        editorContainer: null,

        displayModeMenu: { viewModeButton: null, editModeButton: null, bothModeButton: null },

        renderedMarkdown: null,
        editMarkdownInput: null
    };

    if (!editorContainer) editorContainer = container.querySelector(".markdown-editor-container");

    if (editorContainer) {
        result.editorContainer = editorContainer;

        const menu = editorContainer.querySelector(".markdown-editor-display-mode-menu");
        result.displayModeMenu.viewModeButton = getByTitle(menu, "Display parsed markdown");
        result.displayModeMenu.editModeButton = getByTitle(menu, "Display edit window");
        result.displayModeMenu.bothModeButton = getByTitle(menu, "Display edit window and parsed markdown");

        result.renderedMarkdown = editorContainer.querySelector(".rendered-markdown");
        result.editMarkdownInput = editorContainer.querySelector(".edit-page-textarea");
    }

    return result;
};


/**
 * Sets the text in `editMarkdownInput` to `value`.
 */
export const setMarkdownRawText = (editMarkdownInput, value) => {
    fireEvent.change(editMarkdownInput, { target: { value }} );
};


/**
 * Waits for an <h3> tag with specified `text` to appear inside `editorContainer` or `renderedMarkdown`.
 */
export const waitForMarkdownHeaderRender = async ({ editorContainer, renderedMarkdown, text }) => {
    await waitFor(() => {
        if (!renderedMarkdown) {
            const markdownEditorElements = getMarkdownEditorElements({ editorContainer });
            renderedMarkdown = markdownEditorElements.renderedMarkdown;
        }
        expect(renderedMarkdown).toBeTruthy();
        const header = renderedMarkdown.querySelector("h3");
        expect(header).toBeTruthy();
        expect(header.textContent).toEqual(text);
    });
};
