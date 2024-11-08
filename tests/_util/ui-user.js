import { fireEvent, waitFor, getByText, queryByText } from "@testing-library/dom";


/**
 * Returns elements of a /users/:id page's view mode in the provided `container`.
 */
export const getUserPageViewModeElements = container => {
    const viewContainer = container.querySelector(".user-page-view-container");
    if (!viewContainer) return {};

    // Error & loader
    let result = { viewContainer };
    result.error = container.querySelector("div.ui.error.message p");
    if (result.error) return result;

    result.loader = container.querySelector("div.loader");
    if (result.loader) return result;

    // Header & edit mode button
    const headerContainer = viewContainer.querySelector(".user-page-view-header-container");
    result.header = headerContainer.querySelector("h3");
    result.editModeButton = headerContainer.querySelector(".user-page-view-edit-mode-button-container button");

    // User info
    for (let [name, label] of [["registeredAt", "Registered at"], ["userLevel", "User level"], 
        ["canLogin", "Can login"], ["canEditObjects", "Can edit objects"]]) {
            const labelNode = queryByText(viewContainer, label, { exact: false });
            if (labelNode) result[name] = labelNode.parentNode.querySelector(".user-page-view-item-value");
        }
    
    return result;
};


/**
 * Returns elements of a /users/:id page's edit mode in the provided `container`.
 */
export const getUserPageEditModeElements = container => {
    let result = {};
    
    // Header & message
    result.header = container.querySelector(".user-page-edit-header");
    result.message = container.querySelector(".user-page-edit-message");
    if (result.message) result.messageText = result.message.querySelector("p");

    // Form container
    let formContainer = container.querySelector("form.user-page-form");
    if (!formContainer) return { ...result, inputs: {}, errors: {} };
    result.formContainer = formContainer;

    // Inputs
    let inputs = {};
    inputs.login = getByText(formContainer, "New login").parentNode.querySelector("input");
    inputs.password = getByText(formContainer, "New password").parentNode.querySelector("input");
    inputs.passwordRepeat = getByText(formContainer, "Repeat new password").parentNode.querySelector("input");
    inputs.username = getByText(formContainer, "New username").parentNode.querySelector("input");

    inputs.userLevel = queryByText(formContainer, "User level").parentNode.querySelector(".ui.selection.dropdown");
    inputs.canLogin = queryByText(formContainer, "Can login").parentNode.querySelector("input");
    inputs.canEditObjects = queryByText(formContainer, "Can edit objects").parentNode.querySelector("input");

    inputs.tokenOwnerPassword = getByText(formContainer, "Your current password").parentNode.querySelector("input");
    
    result.inputs = inputs;
    
    // Errors
    let errors = {};
    errors.login = getByText(formContainer, "New login").parentNode.querySelector("div.prompt");
    errors.password = getByText(formContainer, "New password").parentNode.querySelector("div.prompt");
    errors.passwordRepeat = getByText(formContainer, "Repeat new password").parentNode.querySelector("div.prompt");
    errors.username = getByText(formContainer, "New username").parentNode.querySelector("div.prompt");
    errors.tokenOwnerPassword = getByText(formContainer, "Your current password").parentNode.querySelector("div.prompt");
    result.errors = errors;

    // Buttons
    result.updateButton = getByText(formContainer.querySelector(".user-page-form-button-container"), "Update");
    result.cancelButton = getByText(formContainer.querySelector(".user-page-form-button-container"), "Cancel");

    return result;
};


/**
 * Clears edit user form data text inputs.
 */
 export const clearFormData = container => {
    const { inputs } = getUserPageEditModeElements(container);

    for (let name of ["login", "password", "passwordRepeat", "username", "tokenOwnerPassword"]) {
        fireEvent.change(inputs[name], { target: { value: "" } });
    }
};


/**
 * Checks if a user update form inside `container` properly displays `errorText` for the input with the provided `inputName`.
 */
 export const checkValidInputErrorDisplay = async (container, inputName, errorText) => {
    await waitFor(() => {
        const { errors } = getUserPageEditModeElements(container);
        Object.keys(errors).forEach(name => {
            if (name === inputName) {
                if (errors[name]?.textContent !== errorText) throw Error(`Expected  input '${inputName}' to have error '${errorText}', found ${errors?.textContent}`);
            }
            // if (name === inputName) expect(errors[name].textContent).toEqual(errorText);
            // else expect(errors[name]).toBeNull();    // zod validator may return multiple errors => partially filled form will contain multiple errors
        });
    });
};

/**
 * Waits for a message of provided `type` with provided `text` to appear inside `container` with a user edit form.
 */
export const waitForFormMessage = async (container, type, text) => {
    await waitFor(() => {
        const { message, messageText } = getUserPageEditModeElements(container);
        expect(message.classList.contains(type)).toBeTruthy();
        expect(messageText.textContent).toEqual(text);
    })
};
