import { queryByText } from "@testing-library/react";

import { DisplayControlCheckboxLayout } from "../modules/display";


export class TagsViewMenuLayout {
    container: HTMLElement | null
    showOnlyDisplayedInFeed: DisplayControlCheckboxLayout | null

    constructor(container: HTMLElement | null) {
        this.container = container;
        this.showOnlyDisplayedInFeed = null;
        if (!container) return;

        const showOnlyDisplayedInFeedContainer = queryByText(container, "Show Only Displayed in Feed")?.parentElement;
        this.showOnlyDisplayedInFeed = new DisplayControlCheckboxLayout(showOnlyDisplayedInFeedContainer);
    }
}
