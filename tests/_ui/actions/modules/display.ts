import { Actions } from "../actions";
import { DisplayControlCheckboxLayout } from "../../layout/modules/display"


/** Actions & checks for <DisplayControlCheckbox> component. */
export class DisplayControlCheckboxActions {
    layout: DisplayControlCheckboxLayout
    
    constructor(layout: DisplayControlCheckboxLayout) {
        this.layout = layout
    }

    /** Returns if checkbox is selected */
    isSelected() {
        const { checkbox } = this.layout;
        if (!checkbox) throw Error("Checkbox not found.");
        return checkbox.classList.contains("checkbox");
    }

    toggleSelection() {
        const { checkbox } = this.layout;
        if (!checkbox) throw Error("Checkbox not found.");
        Actions.click(checkbox);
    }
}
