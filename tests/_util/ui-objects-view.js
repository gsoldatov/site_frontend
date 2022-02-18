import { queryByTitle } from "@testing-library/dom";


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
            header: { header: null, editButton: null, viewButton: null },
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
        const attributesContainer = [...card.childNodes].filter(n => n.classList.contains("objects-view-attributes"))[0];

        if (attributesContainer) {
            // Timestamp elements and value
            result.attributes.timestamp.element = attributesContainer.querySelector(".objects-view-timestamp")

            // Header element and text, view & edit buttons
            const headerContainer = attributesContainer.querySelector(".object-view-header-container");
            if (headerContainer) {
                result.attributes.header.header = headerContainer.querySelector(".header");
                result.attributes.header.editButton = queryByTitle(headerContainer, "Edit object");
                result.attributes.header.viewButton = queryByTitle(headerContainer, "View object");
            }

            // Object is edited message
            result.attributes.objectIsEdited.element = attributesContainer.querySelector(".objects-view-object-is-edited-container");

            // Description
            result.attributes.description.element = attributesContainer.querySelector(".objects-view-description");        
        }
        
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
                result.data.compositeBasic.subobjectCards = dataContainer.querySelectorAll(".objects-view-card-container.subobject");
            
            // Composite, grouped_links display mode
            if (dataContainer.classList.contains("composite-grouped-links")) {
                result.data.compositeGroupedLinks.placeholders.loading = [...dataContainer.childNodes].filter(n => n.classList.contains("ui") && n.classList.contains("loader"))[0];
                result.data.compositeGroupedLinks.placeholders.fetchError =  [...dataContainer.childNodes].filter(n => n.classList.contains("ui") && n.classList.contains("message") && n.classList.contains("error"))[0];

                result.data.compositeGroupedLinks.subobjectCards = [...dataContainer.querySelectorAll(".objects-view-card-container.subobject:not(.link-card)")];

                const linkCard = dataContainer.querySelector(".objects-view-card-container.subobject.link-card");
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
