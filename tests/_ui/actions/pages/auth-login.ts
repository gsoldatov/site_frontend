import { fireEvent, waitFor } from "@testing-library/react";

import { AuthLoginLayout } from "../../layout/pages/auth-login";


/**
 * UI actions & checks /auth/login page
 */
export class AuthLoginActions {
    container: HTMLElement
    layout: AuthLoginLayout

    constructor(container: HTMLElement) {
        this.container = container;
        this.layout = this.getLayout();
    }

    /**
     * Refreshes layout and returns it.
     */
    getLayout() {
        this.layout = new AuthLoginLayout(this.container);
        return this.layout;
    }

    /**
     * Sets login & password in the login page form and submits it.
     */
    enterCredentialsAndSubmit(login: string, password: string) {
        if (!this.layout.form.login) throw Error(`Could not find login form field.`);
        if (!this.layout.form.password) throw Error(`Could not find password form field.`);
        if (!this.layout.form.submitButton) throw Error(`Could not find form submit button.`);

        fireEvent.change(this.layout.form.login, { target: { value: login } });
        fireEvent.change(this.layout.form.password, { target: { value: password } });
        fireEvent.click(this.layout.form.submitButton);
    }

    /**
     * Waits for login error text to become equal to `text`.
     */
    async waitForLoginError(text: string) {
        await waitFor(
            () => {
                this.getLayout();
                expect(this.layout.errors.login?.textContent).toEqual(text);
            },
            { onTimeout: () => Error(`Login error text is '${this.layout.errors.login?.textContent}', expected: '${text}'.`) }
        );
    }

    /**
     * Waits for password error text to become equal to `text`.
     */
    async waitForPasswordError(text: string) {
        await waitFor(
            () => {
                this.getLayout();
                expect(this.layout.errors.password?.textContent).toEqual(text);
            },
            { onTimeout: () => Error(`Password error text is '${this.layout.errors.password?.textContent}', expected: '${text}'.`) }
        );
    }

    /**
     * Waits for form error text to become equal to `text`.
     */
    async waitForFormError(text: string) {
        await waitFor(
            () => {
                this.getLayout();
                expect(this.layout.errors.form?.textContent).toContain(text);
            },
            { onTimeout: () => Error(`Form error text is '${this.layout.errors.form?.textContent}', not containing expected: '${text}'.`) }
        );
    }

    /**
     * Checks if form and form field errors are absent
     */
    ensureNoErrors() {
        this.getLayout();
        if (this.layout.errors.form?.textContent) throw Error("Form error is not empty.");
        if (this.layout.errors.login?.textContent) throw Error("Login error is not empty.")
        if (this.layout.errors.password?.textContent) throw Error("Password error is not empty.")
    }

    /**
     * Checks if login form is disabled
     */
    ensureFormIsDisabled() {
        // @ts-ignore
        if (!this.layout.form.submitButton.disabled)
            throw Error("Login form is not disabled.")
    }

    /**
     * Checks if login form is enabled
     */
    ensureFormIsEnabled() {
        // @ts-ignore
        if (this.layout.form.submitButton.disabled)
            throw Error("Login form is not enabled.")
    }

    // /**
    //  * Waits for page load to end and markdown containers to appear
    //  */
    // async waitForLoad() {
    //     const cardActions = new ObjectsViewCardActions(this.layout.rootCard.card);
    //     await cardActions.waitForLoad();
    //     this.layout = new ObjectsViewLayout(this.container);
    //     return this.layout;
    // }

    // /**
    //  * Waits for error message to appear on the page.
    //  * If `text` is provided, ensures it's in the error message.
    //  */
    // async waitForError(text: string) {
    //     const cardActions = new ObjectsViewCardActions(this.layout.rootCard.card);
    //     await cardActions.waitForError(text);
    //     this.layout = new ObjectsViewLayout(this.container);
    //     return this.layout;
    // }

    // /**
    //  * Returns a subobject card for the specified `subobjectID` or fails, if it does not exist.
    //  */
    // getSubobjectCardLayoutByID(subobjectID: number | string) {
    //     if (!this.layout.rootCard?.data?.compositeMulticolumn) throw Error("Failed to get subobject card: multicolumn data not found.");
        
    //     for (let column of this.layout.rootCard.data.compositeMulticolumn.columns) {
    //         for (let cardData of column) {
    //             const layout = new ObjectsViewCardLayout(cardData.card);
    //             if (layout.objectID === subobjectID.toString()) return layout;
    //         }
    //     }

    //     throw Error(`Failed to get subobject card: card for subobject '${subobjectID}' not found.`);
    // }
}
