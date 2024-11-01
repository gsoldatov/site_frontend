/**
 * Feed nodes' references.
 */
export class FeedLayout {
    container: HTMLElement | null
    placeholders: { loading: HTMLElement | null, error: HTMLElement | null }
    feedCards: { container: HTMLElement | null, feedCards: HTMLElement[] }
    pagination: { container: HTMLElement | null, buttons: Record<string, HTMLElement> }

    constructor(feedContainer: HTMLElement | null) {
        this.container = feedContainer;
        this.placeholders = { loading: null, error: null };
        this.feedCards = { container: null, feedCards: [] };
        this.pagination = { container: null, buttons: {} };
        
    
        if (!feedContainer) return;
            
        /* Placeholders */
        this.placeholders.loading = [...feedContainer.children].filter(n => ["ui", "loader"].every(cls => n.classList.contains(cls)))[0] as HTMLElement;
        this.placeholders.error = [...feedContainer.children].filter(n => ["ui", "message", "error"].every(cls => n.classList.contains(cls)))[0] as HTMLElement;
    
        /* Feed cards */
        this.feedCards.container = feedContainer.querySelector(".feed-cards-container");

        if (this.feedCards.container) {
            this.feedCards.feedCards = [...this.feedCards.container.querySelectorAll<HTMLElement>(".feed-card")];
        }

        /* Pagination */
        this.pagination.container = feedContainer.querySelector(".pagination-container");
        if (this.pagination.container) {
            const buttons = this.pagination.container.querySelectorAll("a.item");
            for (let b of buttons) {
                if (b instanceof HTMLElement) {
                if (b.textContent === "⟨") this.pagination.buttons["previous"] = b;
                else if (b.textContent === "⟩") this.pagination.buttons["next"] = b;
                else this.pagination.buttons[b.textContent || ""] = b;
                }
            }
        }
    }
}
