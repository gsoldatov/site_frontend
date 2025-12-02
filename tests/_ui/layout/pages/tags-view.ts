import { FeedLayout } from "../modules/feed";
import { TagsViewMenuLayout } from "../page-parts/tags-view";


/**
 * /tags/view page nodes' references.
 */
export class TagsViewLayout {
    menu: TagsViewMenuLayout
    feed: FeedLayout

    constructor(container: HTMLElement) {
        this.feed = new FeedLayout(container.querySelector(".feed-container"))
        this.menu = new TagsViewMenuLayout(container.querySelector(".tags-view-menu"))
    }
}
