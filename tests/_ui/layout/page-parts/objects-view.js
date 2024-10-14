import { queryByTitle } from "@testing-library/react";


/**
 * /objects/view/:id object card nodes' references.
 */
export class ObjectsViewCardLayout {
    constructor(card) {
        this.card = card;
        this.objectID = null;
        this.placeholders = { loading: null, error: null };
        this.attributes = null;
        this.data = null;
        this.tags = null;
        if (!card) return;

        // objectID
        const objectIDNode = [...card.childNodes].filter(n => n.classList.contains("objects-view-card-object-id"))[0];
        if (objectIDNode) this.objectID = objectIDNode.textContent;

        // Placeholders
        this.placeholders.loading = [...card.childNodes].filter(n => ["ui", "loader"].every(cls => n.classList.contains(cls)))[0];
        this.placeholders.error = [...card.childNodes].filter(n => ["ui", "message", "error"].every(cls => n.classList.contains(cls)))[0];
        
        this.attributes = new AttributesLayout(card);
        this.data = new DataLayout(card);
        this.tags = new TagsLayout(card);
    }
}


/**
 * /objects/view/:id object card attribute nodes' references.
 */
class AttributesLayout {
    constructor(card) {
        this.timestamp = null;
        this.header = { prefix: null, text: null, editButton: null, viewButton: null };
        this.objectIsEdited = null;
        this.description = null;
        if (!card) return;

        const attributesContainer = [...card.childNodes].filter(n => n.classList.contains("objects-view-attributes"))[0];
        if (attributesContainer) {
            // Timestamp
            this.timestamp = attributesContainer.querySelector(".objects-view-timestamp");

            // Header
            const headerContainer = attributesContainer.querySelector(".objects-view-header-container")
            if (headerContainer) {
                this.header.prefix = headerContainer.querySelector(".header > .objects-view-header-prefix");
                this.header.text = headerContainer.querySelector(".header > .objects-view-header-text");
                this.header.editButton = queryByTitle(headerContainer, "Edit object");
                this.header.viewButton = queryByTitle(headerContainer, "View object");
            }

            // Object is edited
            this.objectIsEdited = attributesContainer.querySelector(".objects-view-object-is-edited-container");

            // Description
            this.description = attributesContainer.querySelector(".objects-view-description .rendered-markdown");
        }
    }
}


/**
 * /objects/view/:id object card tags nodes' references.
 */
class TagsLayout {
    constructor(card) {
        this.tagsContainer = null;
        this.tags = [];
        if (!card) return;

        this.tagsContainer = card.querySelector(".objects-view-tag-list-container");
        if (this.tagsContainer) this.tags = [...this.tagsContainer.querySelectorAll(".inline-item")];
    }
}


/**
 * /objects/view/:id object card data nodes' references.
 */
class DataLayout {
    constructor(card) {
        this.link = null;
        this.markdown = null;
        this.toDoList = null;
        this.compositeBasic = null;
        this.compositeGroupedLinks = null;
        this.compositeMulticolumn = null;
        this.compositeChapters = null;
        this.compositeSubobjectStub = null;
        if (!card) return;

        const dataContainer = [...card.childNodes].filter(n => n.classList.contains("objects-view-data"))[0];
        if (dataContainer) {
            this.link = new LinkDataLayout(dataContainer);
            this.markdown = new MarkdownDataLayout(dataContainer);
            this.toDoList = new ToDoListDataLayout(dataContainer);
            this.compositeBasic = new CompositeBasicDataLayout(dataContainer);
            this.compositeGroupedLinks = new CompositeGroupedLinksLayout(dataContainer);
            this.compositeMulticolumn = new CompositeMulticolumnDataLayout(dataContainer);
            this.compositeChapters = new CompositeChaptersDataLayout(dataContainer);
            this.compositeSubobjectStub = new CompositeSubobjectStubLayout(dataContainer);
        }
    }
}


/**
 * /objects/view/:id object card link data nodes' references.
 */
class LinkDataLayout {
    constructor(dataContainer) {
        this.link = null;
        this.description = null
        if (!dataContainer.classList.contains("link")) return;
        
        this.link = dataContainer.querySelector("a");
        if (this.link) this.description = this.link.querySelector(".rendered-markdown");
    }
}


/**
 * /objects/view/:id object card markdown data nodes' references.
 */
class MarkdownDataLayout {
    constructor(dataContainer) {
        this.markdown = null;
        if (!dataContainer.classList.contains("markdown")) return;
        
        this.markdown = dataContainer.querySelector(".rendered-markdown");
    }
}


/**
 * /objects/view/:id object card to-do list data nodes' references.
 */
class ToDoListDataLayout {
    constructor(dataContainer) {
        this.container = null;
        this.isReadOnlyMessage = null;
        this.fetchError = null;
        if (!dataContainer.classList.contains("to-do-list")) return;

        this.container = dataContainer.querySelector(".to-do-list-container");
        this.isReadOnlyMessage = dataContainer.querySelector(".ui.info.message");
        this.fetchError = dataContainer.querySelector(".ui.message.error");
    }
}


/**
 * /objects/view/:id object card composite basic data nodes' references.
 */
class CompositeBasicDataLayout {
    constructor(dataContainer) {
        this.subobjectCards = [];
        if (!dataContainer.classList.contains("composite-basic")) return;
        
        this.subobjectCards = [...dataContainer.querySelectorAll(".objects-view-card-container")];
    }
}


/**
 * /objects/view/:id object card composite grouped links data nodes' references.
 */
class CompositeGroupedLinksLayout {
    constructor(dataContainer) {
        this.placeholders = { loading: null, error: null };
        this.subobjectCards = [];
        this.linksCard = { header: null, linkRows: null };
        if (!dataContainer.classList.contains("composite-grouped-links")) return;
        
        this.subobjectCards = dataContainer.querySelectorAll(".objects-view-card-container");

        this.placeholders.loading = [...dataContainer.childNodes].filter(n => ["ui", "loader"].every(cls => n.classList.contains(cls)))[0];
        this.placeholders.error = [...dataContainer.childNodes].filter(n => ["ui", "message", "error"].every(cls => n.classList.contains(cls)))[0];
        
        this.subobjectCards = [...dataContainer.querySelectorAll(".objects-view-card-container:not(.link-card)")];

        const linkCard = dataContainer.querySelector(".objects-view-card-container.link-card");
        if (linkCard) {
            this.linksCard.header = linkCard.querySelector("h2");

            const rows = linkCard.querySelectorAll("table.grouped-links-table > tbody > tr");
            for (let row of rows) {
                const cells = row.querySelectorAll("td");
                const cellData = { link: null, description: null };
                if (cells[0]) cellData.link = cells[0].querySelector("a");
                if (cells[1]) cellData.description = cells[1].textContent;
                this.linksCard.linkRows.push(cellData);
            }
        }
    }
}
 

/**
 * /objects/view/:id object card composite multicolumn data nodes' references.
 */
class CompositeMulticolumnDataLayout {
    constructor(dataContainer) {
        this.columns = [];
        if (!dataContainer.classList.contains("composite-multicolumn")) return;

        [...dataContainer.querySelectorAll(".objects-view-data-composite-multicolumn-column")].forEach(column => {
            this.columns.push(
                [...column.querySelectorAll(".objects-view-data-expand-toggle-container")].map(expandContainer => {
                    const multicolumnCard = { expandToggle: null, expandContent: null, card: null };
                    multicolumnCard.expandToggle = expandContainer.querySelector(".objects-view-data-expand-toggle");
                    multicolumnCard.expandContent = expandContainer.querySelector(".objects-view-data-expand-content");
                    if (multicolumnCard.expandContent) multicolumnCard.card = multicolumnCard.expandContent(".objects-view-card-container");
                    return multicolumnCard;
                })
            );
        });
    }
}


/**
 * /objects/view/:id object card composite chapters data nodes' references.
 */
class CompositeChaptersDataLayout {
    constructor(dataContainer) {
        this.placeholders = { loading: null, error: null };
        this.hierarchyNavigation = {
            breadcrumbSections: null,
            prev: { link: null, chapterNumber: null, chapterName: null },
            next: { link: null, chapterNumber: null, chapterName: null }
        };
        this.tableOfContents = {
            attributes: null,
            container: null
        };
        this.chapterObject = { objectCard: null };
        if (!dataContainer.classList.contains("composite-chapters")) return;

        // Placeholders
        this.placeholders.loading = [...dataContainer.childNodes].filter(n => ["ui", "loader"].every(cls => n.classList.contains(cls)))[0];
        this.placeholders.error = [...dataContainer.childNodes].filter(n => ["ui", "message", "error"].every(cls => n.classList.contains(cls)))[0];
        

        // Hierarchy navigation
        const hierarchyNavigationContainer = dataContainer.querySelector(".composite-chapters-hierarchy-navigation-container");
        if (hierarchyNavigationContainer) {
            const breadcrumb = hierarchyNavigationContainer.querySelector(".composite-chapters-hierarchy-navigation-breadcrumb");
            if (breadcrumb) {
                const sections = [...breadcrumb.querySelectorAll("div.section")];
                this.hierarchyNavigation.breadcrumbSections = sections.map(s => {
                    const link = s.querySelector("a");
                    const chapterNumber = s.querySelector(".composite-chapters-hierarchy-navigation-chapter-number");
                    const chapterName = s.querySelector(".composite-chapters-hierarchy-navigation-chapter-name");
                    return { link, chapterNumber, chapterName };
                });

                const prev = hierarchyNavigationContainer.querySelector(".composite-chapters-hierarchy-navigation-prev-next-item.prev");
                if (prev) {
                    this.hierarchyNavigation.prev.link = prev.querySelector("a");
                    this.hierarchyNavigation.prev.chapterNumber = prev.querySelector(".composite-chapters-hierarchy-navigation-chapter-number");
                    this.hierarchyNavigation.prev.chapterName = prev.querySelector(".composite-chapters-hierarchy-navigation-chapter-name");
                }

                const next = hierarchyNavigationContainer.querySelector(".composite-chapters-hierarchy-navigation-prev-next-item.next");
                if (next) {
                    this.hierarchyNavigation.next.link = next.querySelector("a");
                    this.hierarchyNavigation.next.chapterNumber = next.querySelector(".composite-chapters-hierarchy-navigation-chapter-number");
                    this.hierarchyNavigation.next.chapterName = next.querySelector(".composite-chapters-hierarchy-navigation-chapter-name");
                }
            }
        }

        // Table of contents
        this.tableOfContents.attributes = new AttributesLayout(dataContainer);
        this.tableOfContents.container = getCompositeChaptersTableOfContents(dataContainer);

        // Chapter object
        this.chapterObject.objectCard = [...dataContainer.childNodes].filter(n => n.classList.contains("objects-view-card-container"))[0];
    }
}

/**
 * Returns the table of contents list hierarchy inside the provided `dataContainer`.
 */
const getCompositeChaptersTableOfContents = dataContainer => {
    const getElement = (element, parentElement) => {
        const result = { element, parentElement };
        result.objectID = element.getAttribute("data-object-id");
        result.displayedChapter = element.getAttribute("data-content");

        const a = [...element.childNodes].filter(n => n.tagName === "A")[0];
        if (a) {
            result.text = a.textContent;
            result.link = a;
            result.URL = a.getAttribute("href");    //`a.href` prop returns absolute path instead of relative
            
            const params = a.href.split("?")[1];
            if (params) result.chapter = (new URLSearchParams(params)).get("ch");
        } else {
            result.text = element.textContent;
            result.link = null;
            result.URL = null;
            result.chapter = null;
        }

        let list = [...element.childNodes].filter(n => n.tagName === "UL")[0];
        if (!list) list = [...element.childNodes].filter(n => n.tagName === "OL")[0];

        result.childElements = list ? [...list.childNodes].map(c => getElement(c, element)) : null;
        
        return result;
    }

    const container = dataContainer.querySelector(".composite-chapters-table-of-contents");
    if (!container) return null;

    let list = [...container.childNodes].filter(n => n.tagName === "UL")[0];
    if (!list) list = [...container.childNodes].filter(n => n.tagName === "OL")[0];

    return getElement(container, null);
};


/**
 * /objects/view/:id object card composite subobject stub nodes' references.
 */
class CompositeSubobjectStubLayout {
    constructor(dataContainer) {
        this.linkToViewPage = null;
        if (!dataContainer.classList.contains("composite-subobject")) return;

        this.linkToViewPage = dataContainer.querySelector("a");
    }
}
