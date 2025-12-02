import { TagsViewMenuLayout } from "../../layout/page-parts/tags-view";
import { DisplayControlCheckboxActions } from "../modules/display";

/**
 * UI actions & checks /tags/view menu
 */
export class TagsViewMenuActions {
    menu: TagsViewMenuLayout

    constructor(menu: TagsViewMenuLayout | null) {
        if (!menu) throw Error("Could not find /tags/view page menu.");
        this.menu = menu;
    }

    /** Checks if checkbox is selected */
    showOnlyDisplayedInFeedIsChecked() {
        if (!this.menu.showOnlyDisplayedInFeed) throw Error("Show only displayed in feed checkbox not found.");
        const checkboxActions = new DisplayControlCheckboxActions(this.menu.showOnlyDisplayedInFeed);
        if (!checkboxActions.isSelected()) throw Error("Show only displayed in feed checkbox is not selected");
    }

    /** Checks if checkbox is not selected */
    showOnlyDisplayedInFeedIsNotChecked() {
        if (!this.menu.showOnlyDisplayedInFeed) throw Error("Show only displayed in feed checkbox not found.");
        const checkboxActions = new DisplayControlCheckboxActions(this.menu.showOnlyDisplayedInFeed);
        if (checkboxActions.isSelected()) throw Error("Show only displayed in feed checkbox is selected");
    }

    /** Toggles checkbox selection */
    toggleShowOnlyDisplayedInFeed() {
        if (!this.menu.showOnlyDisplayedInFeed) throw Error("Show only displayed in feed checkbox not found.");
        const checkboxActions = new DisplayControlCheckboxActions(this.menu.showOnlyDisplayedInFeed);
        checkboxActions.toggleSelection();
    }
}
