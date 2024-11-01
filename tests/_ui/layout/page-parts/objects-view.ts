import { queryByTitle } from "@testing-library/react";


/**
 * /objects/view/:id object card nodes' references.
 */
export class ObjectsViewCardLayout {
    card: HTMLElement | null
    objectID: string
    placeholders: { loading: HTMLElement | null, error: HTMLElement | null }
    attributes: AttributesLayout | null
    data: DataLayout | null
    tags: TagsLayout | null

    constructor(card: HTMLElement | null) {
        this.card = card;
        this.objectID = "";
        this.placeholders = { loading: null, error: null };
        this.attributes = null;
        this.data = null;
        this.tags = null;
        if (!card) return;

        // objectID
        const objectIDNode = [...card.children].filter(n => n.classList.contains("objects-view-card-object-id"))[0];
        if (objectIDNode) this.objectID = objectIDNode.textContent || "";

        // Placeholders
        this.placeholders.loading = [...card.children].filter(n => ["ui", "loader"].every(cls => n.classList.contains(cls)))[0] as HTMLElement;
        this.placeholders.error = [...card.children].filter(n => ["ui", "message", "error"].every(cls => n.classList.contains(cls)))[0] as HTMLElement;
        
        this.attributes = new AttributesLayout(card);
        this.data = new DataLayout(card);
        this.tags = new TagsLayout(card);
    }
}


/**
 * /objects/view/:id object card attribute nodes' references.
 */
class AttributesLayout {
    timestamp: HTMLElement | null
    header: { 
        prefix: HTMLElement | null,
        textLink: HTMLElement | null,
        text: HTMLElement | null,
        editButton: HTMLElement | null,
        viewButton: HTMLElement | null
    }
    objectIsEdited: HTMLElement | null
    description: HTMLElement | null

    constructor(card: HTMLElement) {
        this.timestamp = null;
        this.header = { prefix: null, textLink: null, text: null, editButton: null, viewButton: null };
        this.objectIsEdited = null;
        this.description = null;
        if (!card) return;

        const attributesContainer = [...card.children].filter(n => n.classList.contains("objects-view-attributes"))[0];
        if (attributesContainer) {
            // Timestamp
            this.timestamp = attributesContainer.querySelector(".objects-view-timestamp");

            // Header
            const headerContainer = attributesContainer.querySelector<HTMLElement>(".objects-view-header-container")
            if (headerContainer) {
                this.header.prefix = headerContainer.querySelector(".header > .objects-view-header-prefix");
                this.header.textLink = headerContainer.querySelector(".objects-view-header-text-link");
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
    tagsContainer: HTMLElement | null
    tags: HTMLElement[]
    constructor(card: HTMLElement) {
        this.tagsContainer = null;
        this.tags = [];
        if (!card) return;

        this.tagsContainer = card.querySelector(".objects-view-tag-list-container");
        if (this.tagsContainer) this.tags = [...this.tagsContainer.querySelectorAll(".inline-item")].filter(n => n instanceof HTMLElement);;
    }
}


/**
 * /objects/view/:id object card data nodes' references.
 */
class DataLayout {
    link: LinkDataLayout | null
    markdown: MarkdownDataLayout | null
    toDoList: ToDoListDataLayout | null
    compositeBasic: CompositeBasicDataLayout | null
    compositeGroupedLinks: CompositeGroupedLinksLayout | null
    compositeMulticolumn: CompositeMulticolumnDataLayout | null
    compositeChapters: CompositeChaptersDataLayout | null
    compositeSubobjectStub: CompositeSubobjectStubLayout | null

    constructor(card: HTMLElement) {
        this.link = null;
        this.markdown = null;
        this.toDoList = null;
        this.compositeBasic = null;
        this.compositeGroupedLinks = null;
        this.compositeMulticolumn = null;
        this.compositeChapters = null;
        this.compositeSubobjectStub = null;
        if (!card) return;

        const dataContainer = [...card.children].filter(n => n.classList.contains("objects-view-data"))[0] as HTMLElement;
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
    link: HTMLElement | null
    description: HTMLElement | null

    constructor(dataContainer: HTMLElement) {
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
    markdown: HTMLElement | null

    constructor(dataContainer: HTMLElement) {
        this.markdown = null;
        if (!dataContainer.classList.contains("markdown")) return;
        
        this.markdown = dataContainer.querySelector(".rendered-markdown");
    }
}


/**
 * /objects/view/:id object card to-do list data nodes' references.
 */
class ToDoListDataLayout {
    container: HTMLElement | null
    isReadOnlyMessage: HTMLElement | null
    fetchError: HTMLElement | null

    constructor(dataContainer: HTMLElement) {
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
    subobjectCards: HTMLElement[]

    constructor(dataContainer: HTMLElement) {
        this.subobjectCards = [];
        if (!dataContainer.classList.contains("composite-basic")) return;
        
        this.subobjectCards = [...dataContainer.querySelectorAll<HTMLElement>(".objects-view-card-container")];
    }
}


/**
 * /objects/view/:id object card composite grouped links data nodes' references.
 */
class CompositeGroupedLinksLayout {
    placeholders: { loading: HTMLElement | null, error: HTMLElement | null }
    subobjectCards: HTMLElement[]
    linksCard: { header: HTMLElement | null, linkRows: CompositeGroupedTableCellData[] }


    constructor(dataContainer: HTMLElement) {
        this.placeholders = { loading: null, error: null };
        this.subobjectCards = [];
        this.linksCard = { header: null, linkRows: [] };
        if (!dataContainer.classList.contains("composite-grouped-links")) return;
        
        this.subobjectCards = [...dataContainer.querySelectorAll<HTMLElement>(".objects-view-card-container")];

        this.placeholders.loading = [...dataContainer.children].filter(n => ["ui", "loader"].every(cls => n.classList.contains(cls)))[0] as HTMLElement;
        this.placeholders.error = [...dataContainer.children].filter(n => ["ui", "message", "error"].every(cls => n.classList.contains(cls)))[0] as HTMLElement;
        
        this.subobjectCards = [...dataContainer.querySelectorAll<HTMLElement>(".objects-view-card-container:not(.link-card)")];

        const linkCard = dataContainer.querySelector(".objects-view-card-container.link-card");
        if (linkCard) {
            this.linksCard.header = linkCard.querySelector("h2");

            const rows = linkCard.querySelectorAll("table.grouped-links-table > tbody > tr");
            for (let row of rows) {
                const cells = row.querySelectorAll("td");
                const cellData: CompositeGroupedTableCellData = { link: null, description: null };
                if (cells[0]) cellData.link = cells[0].querySelector("a");
                if (cells[1]) cellData.description = cells[1].textContent;
                this.linksCard.linkRows.push(cellData);
            }
        }
    }
}

type CompositeGroupedTableCellData = { link: HTMLElement | null, description: string | null };
 

/**
 * /objects/view/:id object card composite multicolumn data nodes' references.
 */
class CompositeMulticolumnDataLayout {
    columns: CompositeMulticolumnExpandToggleLayout[][]

    constructor(dataContainer: HTMLElement) {
        this.columns = [];
        if (!dataContainer.classList.contains("composite-multicolumn")) return;

        [...dataContainer.querySelectorAll(".objects-view-data-composite-multicolumn-column")].forEach(column => {
            this.columns.push(
                [...column.querySelectorAll<HTMLElement>(".objects-view-data-expand-toggle-container")].map(
                    expandToggleContainer => new CompositeMulticolumnExpandToggleLayout(expandToggleContainer)
                )
            );
        });
    }
}


/**
 * /objects/view/:id multicolumn expand toggle container nodes' references.
 */
export class CompositeMulticolumnExpandToggleLayout {
    expandToggleContainer: HTMLElement | null
    expandToggle: HTMLElement | null
    expandToggleText: HTMLElement | null
    expandContent: HTMLElement | null
    card: HTMLElement | null

    constructor(expandToggleContainer: HTMLElement | null) {
        this.expandToggleContainer = expandToggleContainer;
        this.expandToggle = null;
        this.expandToggleText = null;
        this.expandContent = null
        this.card = null;

        if (!expandToggleContainer) return;

        this.expandToggle = expandToggleContainer.querySelector(".objects-view-data-expand-toggle");
        if (this.expandToggle) this.expandToggleText = this.expandToggle.querySelector("span");
        this.expandContent = expandToggleContainer.querySelector(".objects-view-data-expand-toggle-content");
        if (this.expandContent) this.card = this.expandContent.querySelector(".objects-view-card-container");
    }
}


/**
 * /objects/view/:id object card composite chapters data nodes' references.
 */
class CompositeChaptersDataLayout {
    placeholders: { loading: HTMLElement | null, error: HTMLElement | null }
    hierarchyNavigation: {
        breadcrumbSections: { link: HTMLElement | null, chapterNumber: HTMLElement | null, chapterName: HTMLElement | null }[],
        prev: { link: HTMLElement | null, chapterNumber: HTMLElement | null, chapterName: HTMLElement | null },
        next: { link: HTMLElement | null, chapterNumber: HTMLElement | null, chapterName: HTMLElement | null }
    }
    tableOfContents: {
        attributes: AttributesLayout | null,
        container: CompositeChaptersTableOfContentsElement | null
    }
    chapterObject: { objectCard: HTMLElement | null }

    constructor(dataContainer: HTMLElement) {
        this.placeholders = { loading: null, error: null };
        this.hierarchyNavigation = {
            breadcrumbSections: [],
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
        this.placeholders.loading = [...dataContainer.children].filter(n => ["ui", "loader"].every(cls => n.classList.contains(cls)))[0] as HTMLElement;
        this.placeholders.error = [...dataContainer.children].filter(n => ["ui", "message", "error"].every(cls => n.classList.contains(cls)))[0] as HTMLElement;
        

        // Hierarchy navigation
        const hierarchyNavigationContainer = dataContainer.querySelector(".composite-chapters-hierarchy-navigation-container");
        if (hierarchyNavigationContainer) {
            const breadcrumb = hierarchyNavigationContainer.querySelector(".composite-chapters-hierarchy-navigation-breadcrumb");
            if (breadcrumb) {
                const sections = [...breadcrumb.querySelectorAll<HTMLElement>("div.section")];
                this.hierarchyNavigation.breadcrumbSections = sections.map(s => {
                    const link = s.querySelector("a");
                    const chapterNumber = s.querySelector<HTMLElement>(".composite-chapters-hierarchy-navigation-chapter-number");
                    const chapterName = s.querySelector<HTMLElement>(".composite-chapters-hierarchy-navigation-chapter-name");
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
        this.chapterObject.objectCard = [...dataContainer.children].filter(n => n.classList.contains("objects-view-card-container"))[0] as HTMLElement;
    }
}


/**
 * Returns the table of contents list hierarchy inside the provided `dataContainer`.
 */
const getCompositeChaptersTableOfContents = (dataContainer: HTMLElement): CompositeChaptersTableOfContentsElement | null => {
    const getElement = (element: HTMLElement, parentElement: HTMLElement | null): CompositeChaptersTableOfContentsElement => {
        const objectID = element.getAttribute("data-object-id") || "";
        const displayedChapter = element.getAttribute("data-content") || "";

        const a = [...element.children].filter(n => n.tagName === "A")[0];
        let text = "", link: HTMLElement | null = null, URL = "", chapter = "";
        if (a instanceof HTMLAnchorElement) {
            text = a.textContent || "";
            link = a;
            URL = a.getAttribute("href") || "";    //`a.href` prop returns absolute path instead of relative
            
            const params = a.href.split("?")[1];
            if (params) chapter = (new URLSearchParams(params)).get("ch") || "";
        } else {
            text = element.textContent || "";
        }

        let list = [...element.children].filter(n => n.tagName === "UL")[0];
        if (!list) list = [...element.children].filter(n => n.tagName === "OL")[0];

        const childElements = list ? [...list.children].map(c => getElement(c as HTMLElement, element)) : null;
        
        return {
            element, parentElement,
            objectID, displayedChapter,
            text, link, URL, chapter,
            childElements
        };
    }

    const container = dataContainer.querySelector<HTMLElement>(".composite-chapters-table-of-contents");
    if (!container) return null;

    let list = [...container.children].filter(n => n.tagName === "UL")[0];
    if (!list) list = [...container.children].filter(n => n.tagName === "OL")[0];

    return getElement(container, null);
};

type CompositeChaptersTableOfContentsElement = {
    element: HTMLElement,
    parentElement: HTMLElement | null,
    objectID: string,
    displayedChapter: string,
    text: string, 
    link: HTMLElement | null,
    URL: string,
    chapter: string,
    childElements: CompositeChaptersTableOfContentsElement[] | null
}


/**
 * /objects/view/:id object card composite subobject stub nodes' references.
 */
class CompositeSubobjectStubLayout {
    linkToViewPage: HTMLElement | null

    constructor(dataContainer: HTMLElement) {
        this.linkToViewPage = null;
        if (!dataContainer.classList.contains("composite-subobject")) return;

        this.linkToViewPage = dataContainer.querySelector("a");
    }
}
