import { FeedLayout } from "../modules/feed";


/**
 * /tags/view page nodes' references.
 */
export class TagsViewLayout {
    constructor(container) {
        this.feed = new FeedLayout(container.querySelector(".feed-container"))
    }
}
