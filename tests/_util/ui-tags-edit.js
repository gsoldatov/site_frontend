import { queryByLabelText, queryByPlaceholderText, queryByText, screen } from "@testing-library/react";
import { getSideMenuDialogControls, getSideMenuItem } from "./ui-common";
import { getMarkdownEditorElements } from "./ui-markdown-editor";


/**
 * Returns elements of the /tags/edit/:id page inside the `container`.
 */
export const getTagsEditElements = container => {
    const result = {
        placeholders: {
            loading: null,
            fetchError: null
        },

        sideMenu: {
            addNewTagButton: null,
            viewTagButton: null,
            saveButton: null,
            deleteButton: null,
            deleteDialogControls: {
                header: null,
                checkbox: null,
                buttons: {}
            },
            cancelButton: null
        },

        header: null,

        createdAt: null,
        modifiedAt: null,
        
        tagSaveError: null,
        tagNameInput: null,
        
        tagDescription: {
            editorContainer: null,
            displayModeMenu: { viewModeButton: null, editModeButton: null, bothModeButton: null },
            renderedMarkdown: null,
            editMarkdownInput: null
        },
        
        publishTagCheckbox: null
    };

    // Placeholders
    const tagsEditPageContainer = container.querySelector(".tag-edit-page-container");
    if (tagsEditPageContainer) {
        result.placeholders.loading = tagsEditPageContainer.querySelector(".ui.loader:not(.error-message)");
        result.placeholders.fetchError =  tagsEditPageContainer.querySelector(".ui.message.error-message:not(.loader)");
    }

    // Side menu
    result.sideMenu.addNewTagButton = getSideMenuItem(container, "Add a New Tag");
    result.sideMenu.viewTagButton = getSideMenuItem(container, "View Tag");
    result.sideMenu.saveButton = getSideMenuItem(container, "Save");
    result.sideMenu.deleteButton = getSideMenuItem(container, "Delete");
    result.sideMenu.deleteDialogControls = getSideMenuDialogControls(container);
    result.sideMenu.cancelButton = getSideMenuItem(container, "Cancel");

    // Header, timestamps & save error
    result.header = queryByText(container, "Add a New Tag");
    if (!result.header) result.header = queryByText(container, "Tag Information");
    result.tagSaveError = container.querySelector(".error-container");
    const createdAtLabel = queryByText(container, "Created at:");
    if (createdAtLabel) result.createdAt = createdAtLabel.parentNode.querySelector(".timestamp-text");
    const modifiedAtLabel = queryByText(container, "Modified at:");
    if (modifiedAtLabel) result.modifiedAt = modifiedAtLabel.parentNode.querySelector(".timestamp-text");

    // Inputs
    result.tagNameInput = queryByPlaceholderText(container, "Tag name");
    result.tagDescription = getMarkdownEditorElements({ container });
    const publishTagLabel = queryByText(container, "Publish Tag");
    if (publishTagLabel) result.publishTagCheckbox = publishTagLabel.parentNode.querySelector("input");

    return result;
};
