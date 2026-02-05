import { getByText } from "@testing-library/react";


/**
 * /auth/login page nodes' references.
 */
export class AuthLoginLayout {
    form: { 
        login: HTMLElement | null,
        password: HTMLElement | null,
        submitButton: HTMLElement | null
    }
    errors: {
        form: HTMLElement | null,
        login: HTMLElement | null,
        password: HTMLElement | null,
    }
    

    constructor(container: HTMLElement) {
        this.form = { login: null, password: null, submitButton: null };
        this.errors = { form: null, login: null, password: null };

        let formContainer = container.querySelector<HTMLElement>("form.auth-form");
        if (!formContainer) return;
        
        this.form.login = getByText(formContainer, "Login").parentNode!.querySelector("input");
        this.form.password = getByText(formContainer, "Password").parentNode!.querySelector("input");
        this.form.submitButton = formContainer.querySelector(".auth-form-submit-button-container button");
        
        this.errors.form = formContainer.querySelector<HTMLElement>("div.error.message div.content p");
        this.errors.login = getByText(formContainer, "Login").parentNode!.querySelector("div.prompt");
        this.errors.password = getByText(formContainer, "Password").parentNode!.querySelector("div.prompt");
    }
}
