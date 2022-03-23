import React from "react";

import { waitFor, fireEvent, queryByTitle } from "@testing-library/dom";

import { renderWithWrappers } from "./render";

import { App } from "../../src/components/top-level/app";


/**
 * Returns elements of an objects view `card`.
 * If `container` is provided, returns the elements of the topmost object card found in the `container`.
 */
export const getObjectsViewCardElements = ({ container, card }) => {
    const result = {
        objectID: null,
        placeholders: {
            loading: null,
            fetchError: null
        },
        attributes: {
            timestamp: { element: null, },
            header: { headerPrefix: null, headerText: null, editButton: null, viewButton: null },
            objectIsEdited: { element: null },
            description: {element: null }
        },
        data: {
            link: { element: null },
            
            markdown: { container: null },
            
            toDoList: { 
                container: null,
                isReadOnlyMessage: null,
                fetchError: null
            },
            
            compositeBasic: { subobjectCards: [] },
            
            compositeGroupedLinks: {
                placeholders: {
                    loading: null,
                    fetchError: null
                },
                subobjectCards: [],
                linksCard: {
                    header: null,
                    linkRows: []
                }
            },

            compositeMulticolumn: { subobjectCards: [] },

            compositeChapters: {
                placeholders: {
                    loading: null,
                    fetchError: null
                },
                
                hierarchyNavigation: {
                    breadcrumbSections: null,
                    prev: { link: null, chapterNumber: null, chapterName: null },
                    next: { link: null, chapterNumber: null, chapterName: null }
                },

                tableOfContents: {
                    attributes: {
                        timestamp: { element: null, },
                        header: { headerPrefix: null, headerText: null, editButton: null, viewButton: null },
                        objectIsEdited: { element: null },
                        description: {element: null }
                    },
                    container: null
                },
                chapterObject: {
                    objectCard: null
                }
            },

            compositeSubobjectBasic: { linkToViewPage: null }
        },
        tags: {
            isRendered: false,
            tagElements: []
        }
    };

    /* Find main object's card if container is provided */
    if (container) card = container.querySelector(".objects-view-card-container");

    if (card) {
        /* Object id */
        result.objectID = ([...card.childNodes].filter(n => n.classList.contains("objects-view-card-object-id"))[0] || {}).textContent;

        /* Placeholders */
        result.placeholders.loading = [...card.childNodes].filter(n => n.classList.contains("ui") && n.classList.contains("loader"))[0];
        result.placeholders.fetchError =  [...card.childNodes].filter(n => n.classList.contains("ui") && n.classList.contains("message") && n.classList.contains("error"))[0];

        /* Object attributes */
        result.attributes = getAttributes(card);
        
        /* Object data */
        const dataContainer = [...card.childNodes].filter(n => n.classList.contains("objects-view-data"))[0];

        if (dataContainer) {
            // Link
            if (dataContainer.classList.contains("link"))
                result.data.link.element = dataContainer.querySelector("a");
            
            // Markdown
            if (dataContainer.classList.contains("markdown"))
                result.data.markdown.container = dataContainer.querySelector("div");
            
            // To-do list
            if (dataContainer.classList.contains("to-do-list")) {
                result.data.toDoList.container = dataContainer.querySelector("div.to-do-list-container");
                result.data.toDoList.isReadOnlyMessage = dataContainer.querySelector(".ui.info.message");
                result.data.toDoList.fetchError = dataContainer.querySelector(".ui.message.error");
            }

            // Composite, basic display mode
            if (dataContainer.classList.contains("composite-basic"))
                result.data.compositeBasic.subobjectCards = dataContainer.querySelectorAll(".objects-view-card-container");
            
            // Composite, grouped_links display mode
            if (dataContainer.classList.contains("composite-grouped-links")) {
                result.data.compositeGroupedLinks.placeholders.loading = [...dataContainer.childNodes].filter(n => n.classList.contains("ui") && n.classList.contains("loader"))[0];
                result.data.compositeGroupedLinks.placeholders.fetchError =  [...dataContainer.childNodes].filter(n => n.classList.contains("ui") && n.classList.contains("message") && n.classList.contains("error"))[0];

                result.data.compositeGroupedLinks.subobjectCards = [...dataContainer.querySelectorAll(".objects-view-card-container:not(.link-card)")];

                const linkCard = dataContainer.querySelector(".objects-view-card-container.link-card");
                if (linkCard) {
                    result.data.compositeGroupedLinks.linksCard.header = linkCard.querySelector("h2");

                    const rows = linkCard.querySelectorAll("table.grouped-links-table > tbody > tr");
                    for (let row of rows) {
                        const cells = row.querySelectorAll("td");
                        const cellData = { link: null, description: null };
                        if (cells[0]) cellData.link = cells[0].querySelector("a");
                        if (cells[1]) cellData.description = cells[1].textContent;
                        result.data.compositeGroupedLinks.linksCard.linkRows.push(cellData);
                    }
                }
            }

            // Composite, multicolumn display mode
            if (dataContainer.classList.contains("composite-multicolumn")) {
                const columns = dataContainer.querySelectorAll(".objects-view-data-composite-multicolumn-column");

                columns.forEach(column => {
                    const columnSubobjectCards = [...column.childNodes].filter(n => n.classList.contains("objects-view-card-container"));
                    result.data.compositeMulticolumn.subobjectCards.push(columnSubobjectCards);
                });
            }

            // Composite, chapters display mode
            if (dataContainer.classList.contains("composite-chapters")) {
                // Placeholders
                result.data.compositeChapters.placeholders.loading = [...dataContainer.childNodes].filter(n => n.classList.contains("ui") && n.classList.contains("loader"))[0];
                result.data.compositeChapters.placeholders.fetchError =  [...dataContainer.childNodes].filter(n => n.classList.contains("ui") && n.classList.contains("message") && n.classList.contains("error"))[0];

                // Hierarchy navigation
                const hierarchyNavigationContainer = dataContainer.querySelector(".composite-chapters-hierarchy-navigation-container");
                if (hierarchyNavigationContainer) {
                    const breadcrumb = hierarchyNavigationContainer.querySelector(".composite-chapters-hierarchy-navigation-breadcrumb");
                    if (breadcrumb) {
                        const sections = [...breadcrumb.querySelectorAll("div.section")];
                        result.data.compositeChapters.hierarchyNavigation.breadcrumbSections = sections.map(s => {
                            const link = s.querySelector("a");
                            const chapterNumber = s.querySelector(".composite-chapters-hierarchy-navigation-chapter-number");
                            const chapterName = s.querySelector(".composite-chapters-hierarchy-navigation-chapter-name");
                            return { link, chapterNumber, chapterName };
                        });

                        const prev = hierarchyNavigationContainer.querySelector(".composite-chapters-hierarchy-navigation-prev-next-item.prev");
                        if (prev) {
                            result.data.compositeChapters.hierarchyNavigation.prev.link = prev.querySelector("a");
                            result.data.compositeChapters.hierarchyNavigation.prev.chapterNumber = prev.querySelector(".composite-chapters-hierarchy-navigation-chapter-number");
                            result.data.compositeChapters.hierarchyNavigation.prev.chapterName = prev.querySelector(".composite-chapters-hierarchy-navigation-chapter-name");
                        }

                        const next = hierarchyNavigationContainer.querySelector(".composite-chapters-hierarchy-navigation-prev-next-item.next");
                        if (next) {
                            result.data.compositeChapters.hierarchyNavigation.next.link = next.querySelector("a");
                            result.data.compositeChapters.hierarchyNavigation.next.chapterNumber = next.querySelector(".composite-chapters-hierarchy-navigation-chapter-number");
                            result.data.compositeChapters.hierarchyNavigation.next.chapterName = next.querySelector(".composite-chapters-hierarchy-navigation-chapter-name");
                        }
                    }
                }

                // Table of contents
                result.data.compositeChapters.tableOfContents.attributes = getAttributes(dataContainer);
                result.data.compositeChapters.tableOfContents.container = getCompositeChaptersTableOfContents(dataContainer);

                // Chapter object
                result.data.compositeChapters.chapterObject.objectCard = [...dataContainer.childNodes].filter(n => n.classList.contains("objects-view-card-container"))[0];
            }
                
            // Composite subobject in basic display mode
            if (dataContainer.classList.contains("composite-subobject"))
                result.data.compositeSubobjectBasic.linkToViewPage = dataContainer.querySelector("a");
        }

        /* Tags */
        const tagListContainer = [...card.childNodes].filter(n => n.classList.contains("objects-view-tag-list-container"))[0];

        if (tagListContainer) {
            // Is taglist rendered
            result.tags.isRendered = true;

            // List of tag elements
            result.tags.tagElements = tagListContainer.querySelectorAll(".inline-item-list-wrapper > .inline-item");
        }
    }    

    return result;
};


/**
 * Returns object attributes inside the provided `card`.
 */
const getAttributes = card => {
    const result = {
        timestamp: { element: null, },
        header: { headerPrefix: null, headerText: null, editButton: null, viewButton: null },
        objectIsEdited: { element: null },
        description: {element: null }
    };

    const attributesContainer = [...card.childNodes].filter(n => n.classList.contains("objects-view-attributes"))[0];

    if (attributesContainer) {
        // Timestamp elements and value
        result.timestamp.element = attributesContainer.querySelector(".objects-view-timestamp")

        // Header element and text, view & edit buttons
        const headerContainer = attributesContainer.querySelector(".objects-view-header-container");
        if (headerContainer) {
            result.header.headerPrefix = headerContainer.querySelector(".header > .objects-view-header-prefix");
            result.header.headerText = headerContainer.querySelector(".header > .objects-view-header-text");
            result.header.editButton = queryByTitle(headerContainer, "Edit object");
            result.header.viewButton = queryByTitle(headerContainer, "View object");
        }

        // Object is edited message
        result.objectIsEdited.element = attributesContainer.querySelector(".objects-view-object-is-edited-container");

        // Description
        result.description.element = attributesContainer.querySelector(".objects-view-description");        
    }

    return result;
};


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
 * Renders /objects/view/:objectID page for the provided `objectID`, then opens the chapter with the specified `chapterNumber` (1-based).
 * 
 * NOTE: only top-level chapters can currently be opened.
 */
export const loadObjectsViewPageAndSelectChapter = async (objectID, chapterNumber) => {
    // Render page and wait for data to load
    let { container, store, history } = renderWithWrappers(<App />, {
        route: `/objects/view/${objectID}`
    });

    // Wait for error placeholder to be displayed
    await waitFor(() => expect(getObjectsViewCardElements({ container }).data.compositeChapters.placeholders.loading).toBeFalsy());
    let compositeChaptersElements = getObjectsViewCardElements({ container }).data.compositeChapters;
    expect(compositeChaptersElements.placeholders.fetchError).toBeFalsy();

    // Open a chapter with `link` object_type
    fireEvent.click(compositeChaptersElements.tableOfContents.container.childElements[chapterNumber - 1].link);
    await waitFor(() => expect(history.location.pathname + history.location.search).toEqual(compositeChaptersElements.tableOfContents.container.childElements[chapterNumber - 1].URL));
    await waitFor(() => expect(getObjectsViewCardElements({ container }).data.compositeChapters.chapterObject.objectCard).toBeTruthy());

    const card = getObjectsViewCardElements({ container }).data.compositeChapters.chapterObject.objectCard;

    // Wait for object card's load to end
    await waitFor(() => expect(getObjectsViewCardElements({ card }).placeholders.loading).toBeFalsy());

    const chapterObjectID = compositeChaptersElements.tableOfContents.container.childElements[chapterNumber - 1].objectID;

    return { container, store, history, chapterObjectID };
};
