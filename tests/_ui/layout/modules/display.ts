/**
 * <DisplayControlCheckbox> nodes' references.
*/
export class DisplayControlCheckboxLayout {
    checkbox: HTMLInputElement | null
    label: HTMLLabelElement | null

    constructor(container: HTMLElement | null | undefined) {
        if (!container) {
            this.checkbox = null;
            this.label = null;
            return;
        }
        this.checkbox = container.querySelector("input");
        this.label = container.querySelector("label");
    }
}
