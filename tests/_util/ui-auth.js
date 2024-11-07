import { fireEvent, getByText, waitFor } from "@testing-library/dom";


/**
 * Returns elements of the form on /auth/register page.
 */
export const getRegistrationFormElements = container => {
    let formContainer = container.querySelector("form.auth-form");
    if (!formContainer) return { inputs: {}, errors: {} };

    let inputs = {};
    inputs.login = getByText(formContainer, "Login").parentNode.querySelector("input");
    inputs.password = getByText(formContainer, "Password").parentNode.querySelector("input");
    inputs.password_repeat = getByText(formContainer, "Repeat password").parentNode.querySelector("input");
    inputs.username = getByText(formContainer, "Username").parentNode.querySelector("input");

    let errors = {};
    errors.form = formContainer.querySelector("div.error.message div.content p");
    errors.login = getByText(formContainer, "Login").parentNode.querySelector("div.prompt");
    errors.password = getByText(formContainer, "Password").parentNode.querySelector("div.prompt");
    errors.password_repeat = getByText(formContainer, "Repeat password").parentNode.querySelector("div.prompt");
    errors.username = getByText(formContainer, "Username").parentNode.querySelector("div.prompt");

    let submitButton = formContainer.querySelector(".auth-form-submit-button-container button");

    return { formContainer, inputs, submitButton, errors };
};


/**
 * Waits for registration form inside `container` to become enabled.
 */
export const waitForEnabledRegistationForm = async container => {
    await waitFor(() => {
        const { inputs } = getRegistrationFormElements(container);
        expect(inputs.login.disabled).toBeFalsy();
    });
};


/**
 * Returns elements of the form on /auth/login page.
 */
 export const getLoginFormElements = container => {
    let formContainer = container.querySelector("form.auth-form");
    if (!formContainer) return { inputs: {}, errors: {} };

    let inputs = {};
    inputs.login = getByText(formContainer, "Login").parentNode.querySelector("input");
    inputs.password = getByText(formContainer, "Password").parentNode.querySelector("input");

    let errors = {};
    errors.form = formContainer.querySelector("div.error.message div.content p");
    errors.login = getByText(formContainer, "Login").parentNode.querySelector("div.prompt");
    errors.password = getByText(formContainer, "Password").parentNode.querySelector("div.prompt");

    let formMessage = formContainer.querySelector("div.success.message div.content p");

    let submitButton = formContainer.querySelector(".auth-form-submit-button-container button");

    return { formContainer, inputs, submitButton, errors, formMessage };
};


/**
 * Fills all auth form fields inside `container` with valid values. Type of form (login/register) is set in `formType`.
 */
export const enterValidFormData = (container, formType) => {
    const { inputs } = formElementsGettters[formType](container);

    fireEvent.change(inputs.login, { target: { value: "Correct login" } });
    fireEvent.change(inputs.password, { target: { value: "Correct password" } });

    if (formType === "register") {
        fireEvent.change(inputs.password_repeat, { target: { value: "Correct password" } });
        fireEvent.change(inputs.username, { target: { value: "Correct username" } });
    }
};


/**
 * Waits for auth form to display an error message with the provided `errorText`.
 * Type of form (login/register) is set in `formType`.
 */
export const waitForFormErrorMessage = async (container, formType, errorText) => {
    await waitFor(() => {
        const { formContainer, errors } = formElementsGettters[formType](container);
        expect(errors.form.textContent).toEqual(errorText);
        expect(formContainer.classList.contains("error")).toBeTruthy();
    });
};


/**
 * Checks if a form inside `container` of a provided `formType` (login/register) properly displays `errorText` for the input with the provided `inputName`, 
 * while other input errors are not displayed.
 */
export const checkValidInputErrorDisplay = async (container, formType, inputName, errorText) => {
    await waitFor(() => {
        const { errors } = formElementsGettters[formType](container);
        Object.keys(errors).forEach(name => {
            if (name === inputName) expect(errors[name].textContent).toEqual(errorText);
            else if (name !== "form") expect(errors[name]).toBeNull();
        });
    });
};


/**
 * Waits for login form to display an error message with the provided `errorText`.
 */
 export const waitForLoginFormSuccessMessage = async (container, errorText) => {
    await waitFor(() => {
        const { formContainer, formMessage } = getLoginFormElements(container);
        expect(formMessage.textContent).toEqual(errorText);
        expect(formContainer.classList.contains("success")).toBeTruthy();
    });
};


const formElementsGettters = {
    login: getLoginFormElements,
    register: getRegistrationFormElements
};
