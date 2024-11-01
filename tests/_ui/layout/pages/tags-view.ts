import { FeedLayout } from "../modules/feed";


/**
 * /tags/view page nodes' references.
 */
export class TagsViewLayout {
    feed: FeedLayout

    constructor(container: HTMLElement) {
        this.feed = new FeedLayout(container.querySelector(".feed-container"))
    }
}
