import React from "react";
import ReactDOM from "react-dom";
import { waitFor, fireEvent } from "@testing-library/dom";

import { resetTestConfig } from "../../../_mocks/config";
import { renderWithWrappers } from "../../../_util/render";
import { getObjectsViewCardElements, loadObjectsViewPageAndSelectChapter, waitForCompositeChapterDescription, waitForCompositeChapterDescriptionAsLink } from "../../../_util/ui-objects-view";
import { compareArrays } from "../../../_util/data-checks";
import { getFeedElements } from "../../../_util/ui-index";

import { getConfig, setConfig } from "../../../../src/config";
import { App } from "../../../../src/components/top-level/app";
import { getInlineItem } from "../../../_util/ui-inline";


/*
    /objects/view/:id page tests, composite object data display in `multicolumn` display mode.
*/
beforeEach(() => {
    // isolate fetch mock to avoid tests state collision because of cached data in fetch
    jest.isolateModules(() => {
        const { mockFetch, setFetchFail, addCustomRouteResponse } = require("../../../_mocks/mock-fetch");
        
        // Set test app configuration
        resetTestConfig();
        
        // reset fetch mocks
        jest.resetAllMocks();
        global.fetch = jest.fn(mockFetch);
        global.setFetchFail = jest.fn(setFetchFail);
        global.addCustomRouteResponse = jest.fn(addCustomRouteResponse);
    });
});


describe("General", () => {
    test("Incorrect chapter numbers", async () => {
        for (let ch of ["str", "1.2.99999"]) {
            // Render page
            let { container, historyManager } = renderWithWrappers(<App />, {
                route: `/objects/view/3910?ch=${ch}`
            });

            await waitFor(() => {
                historyManager.ensureCurrentURL("/objects/view/3910");
                expect(historyManager.getCurrentURLSeachParam("ch")).toBeFalsy();
            });

            ReactDOM.unmountComponentAtNode(container);
        }
    });


    test("Placeholder & fetch error", async () => {
        addCustomRouteResponse("/objects/view_composite_hierarchy_elements", "POST", { generator: body => {
            // Throw network error when fetching composite hierarchy
            throw TypeError("NetworkError");
        }});

        // Render page
        let { container } = renderWithWrappers(<App />, {
            route: "/objects/view/3910"
        });

        // Wait for a placeholder to be rendered instead of object data
        await waitFor(() => expect(getObjectsViewCardElements({ container }).data.compositeChapters.placeholders.loading).toBeTruthy());

        // Wait for error placeholder to be displayed
        await waitFor(() => expect(getObjectsViewCardElements({ container }).data.compositeChapters.placeholders.loading).toBeFalsy());
        expect(getObjectsViewCardElements({ container }).data.compositeChapters.placeholders.fetchError).toBeTruthy();
    });
});


describe("Table of contents", () => {
    describe("Partial load of root object", () => {
        test("Missing element's placeholder", async () => {
            addCustomRouteResponse("/objects/view", "POST", { generator: (body, handler) => {
                // Filter a link and a sub-chapter
                const filteredObjectIDs = ["401", "3911"];
                
                const result = handler(body);
                result.body.objects = result.body.objects.filter(o => filteredObjectIDs.indexOf(o.object_id.toString()) === -1);
                result.body.object_data = result.body.object_data.filter(d => filteredObjectIDs.indexOf(d.object_id.toString()) === -1);
                
                return result;
            }});

            // Render page and wait for data to load
            let { container } = renderWithWrappers(<App />, {
                route: "/objects/view/3910"
            });

            // Wait for error placeholder to be displayed
            await waitFor(() => expect(getObjectsViewCardElements({ container }).data.compositeChapters.placeholders.loading).toBeFalsy());
            const compositeChaptersElements = getObjectsViewCardElements({ container }).data.compositeChapters;
            expect(compositeChaptersElements.placeholders.fetchError).toBeFalsy();

            // Check if missing chapters are correctly replaced with placeholders
            const tableOfContentsContainer = compositeChaptersElements.tableOfContents.container;
            expect(tableOfContentsContainer).toBeTruthy();
            expect(tableOfContentsContainer.childElements).toBeTruthy();
            
            // Missing link object
            const missingLink = tableOfContentsContainer.childElements[0];
            expect(missingLink.objectID).toEqual("401");
            expect(missingLink.URL).toBeFalsy();
            expect(missingLink.text).toEqual("<Object is unavailable>");

            // Missing non-root composite chapter
            const missingComposite = tableOfContentsContainer.childElements[6];
            expect(missingComposite.objectID).toEqual("3911");
            expect(missingComposite.URL).toBeFalsy();
            expect(missingComposite.text).toEqual("<Object is unavailable>");
            expect(missingComposite.childElements).toBeFalsy();
        });
    });

    
    describe("Correct load of root object", () => {
        test("Attributes & tags", async () => {
            // Render page and wait for data to load
            let { container, storeManager, historyManager } = renderWithWrappers(<App />, {
                route: "/objects/view/3910"
            });

            // Wait for error placeholder to be displayed
            await waitFor(() => expect(getObjectsViewCardElements({ container }).data.compositeChapters.placeholders.loading).toBeFalsy());
            let compositeChaptersElements = getObjectsViewCardElements({ container }).data.compositeChapters;
            expect(compositeChaptersElements.placeholders.fetchError).toBeFalsy();

            // Check if timestamp is rendered
            expect(compositeChaptersElements.tableOfContents.attributes.timestamp.element).toBeTruthy();

            // Check if header and edit button is displayed, and view button is not
            expect(compositeChaptersElements.tableOfContents.attributes.header.headerText.textContent).toEqual(storeManager.store.getState().objects[3910].object_name);
            expect(compositeChaptersElements.tableOfContents.attributes.header.editButton).toBeTruthy();
            expect(compositeChaptersElements.tableOfContents.attributes.header.viewButton).toBeFalsy();

            // Check if description is correctly rendered
            expect(storeManager.store.getState().objects[3910].show_description).toBeFalsy();
            expect(compositeChaptersElements.tableOfContents.attributes.description.element).toBeFalsy();
            
            storeManager.objects.updateAttributes({ object_id: 3910, show_description: true });
            compositeChaptersElements = getObjectsViewCardElements({ container }).data.compositeChapters;
            await waitFor(() => expect(getObjectsViewCardElements({ container }).data.compositeChapters.tableOfContents.attributes.description.element).toBeTruthy());

            // Check if tags are rendered
            const cardElements = getObjectsViewCardElements({ container });
            expect(cardElements.tags.isRendered).toBeTruthy();

            // Check if each tag name is displayed
            const state = storeManager.store.getState();
            expect(state.objectsTags[3910].length).toEqual(5);

            const renderedTagNames = [...cardElements.tags.tagElements].map(e => e.querySelector("span").textContent);        
            expect(renderedTagNames.length).toEqual(5);
            
            state.objectsTags[3910].forEach(tagID => expect(renderedTagNames.indexOf(state.tags[tagID].tag_name)).toBeGreaterThan(-1));

            // Check redireact to /tags/view page
            fireEvent.click(getInlineItem({ item: cardElements.tags.tagElements[0] }).link);
            historyManager.ensureCurrentURL("/tags/view");
            historyManager.ensureCurrentURLParams("?tagIDs=1");
            await waitFor(() => expect(getFeedElements(container).placeholders.loading).toBeFalsy());
        });


        test("Table of contents", async () => {
            // Render page and wait for data to load
            let { container, store, historyManager } = renderWithWrappers(<App />, {
                route: "/objects/view/3910"
            });

            // Wait for error placeholder to be displayed
            await waitFor(() => expect(getObjectsViewCardElements({ container }).data.compositeChapters.placeholders.loading).toBeFalsy());
            let compositeChaptersElements = getObjectsViewCardElements({ container }).data.compositeChapters;
            expect(compositeChaptersElements.placeholders.fetchError).toBeFalsy();

            // First-level chapters
            let expectedObjectIDs = ["401", "1401", "2401", "3901", "3907", "3909", "3911"];
            let childElements = compositeChaptersElements.tableOfContents.container.childElements || [];
            expect(compareArrays(expectedObjectIDs, childElements.map(e => e.objectID))).toBeTruthy();

            expectedObjectIDs.forEach((objectID, i) => {
                const element = childElements[i];
                expect(element.text).toEqual(store.getState().objects[objectID].object_name);
                expect(element.chapter).toEqual((i+1).toString());
                expect(element.URL).toEqual(`/objects/view/3910?ch=${i+1}`);
                if (i === 6) expect(element.childElements).toBeTruthy();
                else expect(element.childElements).toBeFalsy();
            });

            // Second-level chapters
            expectedObjectIDs = ["411", "3912"];
            childElements = childElements[6].childElements;
            expect(compareArrays(expectedObjectIDs, childElements.map(e => e.objectID))).toBeTruthy();

            expectedObjectIDs.forEach((objectID, i) => {
                const element = childElements[i];
                expect(element.text).toEqual(store.getState().objects[objectID].object_name);
                expect(element.chapter).toEqual(`7.${i+1}`);
                expect(element.URL).toEqual(`/objects/view/3910?ch=7.${i+1}`);
                if (i === 1) expect(element.childElements).toBeTruthy();
                else expect(element.childElements).toBeFalsy();
            });

            // Third-level chapters
            expectedObjectIDs = ["421"];
            childElements = childElements[1].childElements;
            expect(compareArrays(expectedObjectIDs, childElements.map(e => e.objectID))).toBeTruthy();

            expectedObjectIDs.forEach((objectID, i) => {
                const element = childElements[i];
                expect(element.text).toEqual(store.getState().objects[objectID].object_name);
                expect(element.chapter).toEqual(`7.2.${i+1}`);
                expect(element.URL).toEqual(`/objects/view/3910?ch=7.2.${i+1}`);
                expect(element.childElements).toBeFalsy();
            });

            // Check if link redirects
            fireEvent.click(childElements[0].link);
            await historyManager.waitForCurrentURLAndSearchParamsToBe(childElements[0].URL);
        });


        test("Composite with `chapters` display mode with maximum hierarchy depth exceeded", async () => {
            // Render page and wait for data to load
            let { container } = renderWithWrappers(<App />, {
                route: "/objects/view/3910"
            });
            
            // Reduce the maximum hierarchy depth (note, that renderWithWrappers resets app's config)
            const config = getConfig();
            setConfig({ ...config, compositeChapters: { ...config.compositeChapters, maxHierarchyDepth: 1 }});

            // Wait for error placeholder to be displayed
            await waitFor(() => expect(getObjectsViewCardElements({ container }).data.compositeChapters.placeholders.loading).toBeFalsy());
            let compositeChaptersElements = getObjectsViewCardElements({ container }).data.compositeChapters;
            expect(compositeChaptersElements.placeholders.fetchError).toBeFalsy();

            // Check if table of contents has no children for the chapter with maximum depth exceeded
            expect(compositeChaptersElements.tableOfContents.container.childElements[6].childElements).toBeFalsy();
        });
    });


    describe("Correct load of non-root object", () => {
        test("Attributes & tags", async () => {
            addCustomRouteResponse("/objects/view", "POST", { generator: (body, handler) => {
                // Add custom tag IDs for root composite object                
                const result = handler(body);
                result.body.objects = result.body.objects.map(o => {
                    if (o.object_id === 3910) o.current_tag_ids = [101, 102, 103, 104, 105, 106];
                    return o;
                });
                
                return result;
            }});

            // Render page and wait for data to load
            let { container, storeManager, historyManager } = renderWithWrappers(<App />, {
                route: "/objects/view/3910"
            });

            // Wait for error placeholder to be displayed
            await waitFor(() => expect(getObjectsViewCardElements({ container }).data.compositeChapters.placeholders.loading).toBeFalsy());
            let compositeChaptersElements = getObjectsViewCardElements({ container }).data.compositeChapters;
            expect(compositeChaptersElements.placeholders.fetchError).toBeFalsy();

            const object_id = compositeChaptersElements.tableOfContents.container.childElements[6].objectID;

            // Open a subchapter
            fireEvent.click(compositeChaptersElements.tableOfContents.container.childElements[6].link);
            await historyManager.waitForCurrentURLAndSearchParamsToBe(compositeChaptersElements.tableOfContents.container.childElements[6].URL);
            await waitFor(() => expect(getObjectsViewCardElements({ container }).data.compositeChapters.placeholders.loading).toBeFalsy());
            compositeChaptersElements =  getObjectsViewCardElements({ container }).data.compositeChapters;

            // Check if timestamp is not rendered
            expect(compositeChaptersElements.tableOfContents.attributes.timestamp.element).toBeFalsy();

            // Check if header and edit button is displayed, and view button is not
            expect(compositeChaptersElements.tableOfContents.attributes.header.headerText.textContent).toEqual(storeManager.store.getState().objects[object_id].object_name);
            expect(compositeChaptersElements.tableOfContents.attributes.header.editButton).toBeTruthy();
            expect(compositeChaptersElements.tableOfContents.attributes.header.viewButton).toBeFalsy();

            // Check if description is correctly rendered (check combination of settings from parent's object data and current object's display settings)
            // show_description = no, show_description_composite = inherit
            expect(storeManager.store.getState().objects[object_id].show_description).toBeFalsy();
            expect(compositeChaptersElements.tableOfContents.attributes.description.element).toBeFalsy();

            // show_description = yes, show_description_composite = inherit
            storeManager.objects.updateAttributes({ object_id, show_description: true });
            compositeChaptersElements = getObjectsViewCardElements({ container }).data.compositeChapters;
            await waitFor(() => expect(getObjectsViewCardElements({ container }).data.compositeChapters.tableOfContents.attributes.description.element).toBeTruthy());

            // show_description = yes, show_description_composite = no
            storeManager.objects.updateCompositeSubobjectData(3910, object_id, { show_description_composite: "no" });
            await waitFor(() => expect(getObjectsViewCardElements({ container }).data.compositeChapters.tableOfContents.attributes.description.element).toBeFalsy());

            // show_description = no, show_description_composite = yes
            storeManager.objects.updateAttributes({ object_id, show_description: false });
            storeManager.objects.updateCompositeSubobjectData(3910, object_id, { show_description_composite: "yes" });
            await waitFor(() => expect(getObjectsViewCardElements({ container }).data.compositeChapters.tableOfContents.attributes.description.element).toBeTruthy());

            // Check if tags are rendered
            let cardElements = getObjectsViewCardElements({ container });
            expect(cardElements.tags.isRendered).toBeTruthy();

            // Check if each tag name (of the root object's tags) is displayed
            const state = storeManager.store.getState();
            expect(state.objectsTags[3910].length).toEqual(6);

            const renderedTagNames = [...cardElements.tags.tagElements].map(e => e.querySelector("span").textContent);        
            expect(renderedTagNames.length).toEqual(6);
            
            state.objectsTags[3910].forEach(tagID => expect(renderedTagNames.indexOf(state.tags[tagID].tag_name)).toBeGreaterThan(-1));

            // Check redireact to /tags/view page
            fireEvent.click(getInlineItem({ item: cardElements.tags.tagElements[0] }).link);
            historyManager.ensureCurrentURL("/tags/view");
            historyManager.ensureCurrentURLParams("?tagIDs=101");
            await waitFor(() => expect(getFeedElements(container).placeholders.loading).toBeFalsy());
        });


        test("Table of contents", async () => {
            // Render page and wait for data to load
            let { container, store, historyManager } = renderWithWrappers(<App />, {
                route: "/objects/view/3910"
            });

            // Wait for error placeholder to be displayed
            await waitFor(() => expect(getObjectsViewCardElements({ container }).data.compositeChapters.placeholders.loading).toBeFalsy());
            let compositeChaptersElements = getObjectsViewCardElements({ container }).data.compositeChapters;
            expect(compositeChaptersElements.placeholders.fetchError).toBeFalsy();

            const objectID = compositeChaptersElements.tableOfContents.container.childElements[6].objectID;

            // Open a subchapter
            fireEvent.click(compositeChaptersElements.tableOfContents.container.childElements[6].link);
            await historyManager.waitForCurrentURLAndSearchParamsToBe(compositeChaptersElements.tableOfContents.container.childElements[6].URL);
            compositeChaptersElements =  getObjectsViewCardElements({ container }).data.compositeChapters;

            // First-level chapters
            let expectedObjectIDs = ["411", "3912"];
            let childElements = compositeChaptersElements.tableOfContents.container.childElements || [];
            expect(compareArrays(expectedObjectIDs, childElements.map(e => e.objectID))).toBeTruthy();

            expectedObjectIDs.forEach((objectID, i) => {
                const element = childElements[i];
                expect(element.text).toEqual(store.getState().objects[objectID].object_name);
                expect(element.chapter).toEqual(`7.${i+1}`);
                expect(element.URL).toEqual(`/objects/view/3910?ch=7.${i+1}`);
                if (i === 1) expect(element.childElements).toBeTruthy();
                else expect(element.childElements).toBeFalsy();
            });

            // Second-level chapters
            expectedObjectIDs = ["421"];
            childElements = childElements[1].childElements;
            expect(compareArrays(expectedObjectIDs, childElements.map(e => e.objectID))).toBeTruthy();

            expectedObjectIDs.forEach((objectID, i) => {
                const element = childElements[i];
                expect(element.text).toEqual(store.getState().objects[objectID].object_name);
                expect(element.chapter).toEqual(`7.2.${i+1}`);
                expect(element.URL).toEqual(`/objects/view/3910?ch=7.2.${i+1}`);
                expect(element.childElements).toBeFalsy();
            });

            // Check if link redirects
            fireEvent.click(childElements[0].link);
            await historyManager.waitForCurrentURLAndSearchParamsToBe(childElements[0].URL);
        });
    });
});


describe("Chapter object", () => {
    test("Placeholder & fetch error", async () => {
        addCustomRouteResponse("/objects/view", "POST", { generator: (body, handler) => {
            // Throw network error when fetching object data for the chapter
            const result = handler(body);
            let isChapterDataInResponse = false;
            for (let d of result.body.object_data)
                if (d.object_id === 401) {
                    isChapterDataInResponse = true;
                    break;
                }
            
            if (isChapterDataInResponse) throw TypeError("NetworkError");

            return result;
        }});

        // Render page and open a chapter
        let { container } = await loadObjectsViewPageAndSelectChapter(3910, 1);

        // Check if fetch error message is displayed
        const card = getObjectsViewCardElements({ container }).data.compositeChapters.chapterObject.objectCard;
        expect(getObjectsViewCardElements({ card }).placeholders.fetchError).toBeTruthy();
    });


    test("Chapter object description", async () => {
        // Render page and open a chapter
        const parentID = 3910;
        let { container, storeManager, chapterObjectID } = await loadObjectsViewPageAndSelectChapter(parentID, 1);

        // object = no & subobject = inherit => not displayed
        storeManager.objects.updateAttributes({ object_id: chapterObjectID, show_description: false });
        storeManager.objects.updateCompositeSubobjectData(parentID, chapterObjectID, { show_description_composite: "inherit", show_description_as_link_composite: "no" });
        await waitForCompositeChapterDescription(container, false);

        // object = yes & subobject = inherit => displayed
        storeManager.objects.updateAttributes({ object_id: chapterObjectID, show_description: true });
        await waitForCompositeChapterDescription(container, true);

        // object = yes & subobject = no => not displayed
        storeManager.objects.updateCompositeSubobjectData(parentID, chapterObjectID, { show_description_composite: "no" });
        await waitForCompositeChapterDescription(container, false);

        // object = no & subobject = yes => displayed
        storeManager.objects.updateAttributes({ object_id: chapterObjectID, show_description: false });
        storeManager.objects.updateCompositeSubobjectData(parentID, chapterObjectID, { show_description_composite: "yes" });
        await waitForCompositeChapterDescription(container, true);

        // object = yes & subobject = inherit & subobject show description as link = yes => not displayed, link is displayed
        storeManager.objects.updateAttributes({ object_id: chapterObjectID, show_description: true });
        storeManager.objects.updateCompositeSubobjectData(parentID, chapterObjectID, { show_description_composite: "inherit", show_description_as_link_composite: "yes" });
        await waitForCompositeChapterDescription(container, false);

        // object = no & subobject = yes & subobject show description as link = yes => not displayed, link is displayed
        storeManager.objects.updateAttributes({ object_id: chapterObjectID, show_description: false });
        storeManager.objects.updateCompositeSubobjectData(parentID, chapterObjectID, { show_description_composite: "yes", show_description_as_link_composite: "yes" });
        await waitForCompositeChapterDescription(container, false);
    });


    test("Chapter object description as link", async () => {
        // Render page and open a chapter
        const parentID = 3910;
        let { container, storeManager, chapterObjectID } = await loadObjectsViewPageAndSelectChapter(parentID, 1);
        const descriptionText = storeManager.store.getState().objects[chapterObjectID].object_description;

        // parent = no & subobject = inherit => not displayed
        storeManager.objects.updateData(chapterObjectID, "link", { show_description_as_link: false });
        storeManager.objects.updateCompositeSubobjectData(parentID, chapterObjectID, {show_description_as_link_composite: "inherit" });
        await waitForCompositeChapterDescriptionAsLink(container, descriptionText, false);

        // parent = yes & subobject = inherit = displayed
        storeManager.objects.updateData(chapterObjectID, "link", { show_description_as_link: true });
        await waitForCompositeChapterDescriptionAsLink(container, descriptionText, true);

        // parent = yes & subobject = no => not displayed
        storeManager.objects.updateCompositeSubobjectData(parentID, chapterObjectID, {show_description_as_link_composite: "no" });
        await waitForCompositeChapterDescriptionAsLink(container, descriptionText, false);

        // parent = no & subobject = yes => displayed
        storeManager.objects.updateData(chapterObjectID, "link", { show_description_as_link: false });
        storeManager.objects.updateCompositeSubobjectData(parentID, chapterObjectID, {show_description_as_link_composite: "yes" });
        await waitForCompositeChapterDescriptionAsLink(container, descriptionText, true);
    });


    test("Link", async () => {
        // Render page and open a chapter
        let { container, store, chapterObjectID } = await loadObjectsViewPageAndSelectChapter(3910, 1);

        // Check if object name is displayed
        const card = getObjectsViewCardElements({ container }).data.compositeChapters.chapterObject.objectCard;
        const cardElements = getObjectsViewCardElements({ card });
        expect(cardElements.placeholders.fetchError).toBeFalsy();
        expect(cardElements.attributes.header.headerText.textContent).toEqual(store.getState().objects[chapterObjectID].object_name);

        // Check if link is displayed
        await waitFor(() => expect(cardElements.data.link.link.getAttribute("href")).toEqual(store.getState().links[chapterObjectID].link));
    });


    test("Markdown", async () => {
        // Render page and open a chapter
        let { container, storeManager, chapterObjectID } = await loadObjectsViewPageAndSelectChapter(3910, 2);

        // Check if object name is displayed
        const card = getObjectsViewCardElements({ container }).data.compositeChapters.chapterObject.objectCard;
        const cardElements = getObjectsViewCardElements({ card });
        expect(cardElements.placeholders.fetchError).toBeFalsy();
        expect(cardElements.attributes.header.headerText.textContent).toEqual(storeManager.store.getState().objects[chapterObjectID].object_name);
        
        // Change markdown raw_text
        storeManager.objects.updateData(chapterObjectID, "markdown", { raw_text: "# Some text" });

        // Check if updated markdown is rendered
        await waitFor(() => {
            const markdownContainer = getObjectsViewCardElements({ card }).data.markdown.container;
            expect(markdownContainer).toBeTruthy();

            const renrederedHeader = markdownContainer.querySelector("h3");
            expect(renrederedHeader).toBeTruthy();
            expect(renrederedHeader.textContent).toEqual("Some text");
        });
    });


    test("To-do list", async () => {
        // Render page and open a chapter
        let { container, store, chapterObjectID } = await loadObjectsViewPageAndSelectChapter(3910, 3);

        // Check if object name is displayed
        const card = getObjectsViewCardElements({ container }).data.compositeChapters.chapterObject.objectCard;
        const cardElements = getObjectsViewCardElements({ card });
        expect(cardElements.placeholders.fetchError).toBeFalsy();
        expect(cardElements.attributes.header.headerText.textContent).toEqual(store.getState().objects[chapterObjectID].object_name);
        
        // Check if first to-do list item is rendered
        const TDLContainer = cardElements.data.toDoList.container;
        const itemInput = TDLContainer.querySelector(".to-do-list-item-input");
        expect(itemInput.textContent).toEqual(store.getState().toDoLists[chapterObjectID].items[0].item_text);
    });


    test("Composite, basic", async () => {
        // Render page and open a chapter
        let { container, store, chapterObjectID } = await loadObjectsViewPageAndSelectChapter(3910, 4);

        // Check if object name is displayed
        const card = getObjectsViewCardElements({ container }).data.compositeChapters.chapterObject.objectCard;
        const cardElements = getObjectsViewCardElements({ card });
        expect(cardElements.placeholders.fetchError).toBeFalsy();
        expect(cardElements.attributes.header.headerText.textContent).toEqual(store.getState().objects[chapterObjectID].object_name);
        
        // Check if cards are displayed in correct order (column asc -> row asc)
        const expectedSubobjectIDs = [101, 1101, 2101, 3101];
        const subobjectCards = cardElements.data.compositeBasic.subobjectCards;
        
        expect(subobjectCards.length).toEqual(expectedSubobjectIDs.length);
        expect([...subobjectCards].map(card => parseInt(getObjectsViewCardElements({ card }).objectID))).toEqual(expectedSubobjectIDs);
    });


    test("Composite, grouped links", async () => {
        // Render page and open a chapter
        let { container, store, chapterObjectID } = await loadObjectsViewPageAndSelectChapter(3910, 5);

        // Check if object name is displayed
        const card = getObjectsViewCardElements({ container }).data.compositeChapters.chapterObject.objectCard;
        const cardElements = getObjectsViewCardElements({ card });
        expect(cardElements.placeholders.fetchError).toBeFalsy();
        expect(cardElements.attributes.header.headerText.textContent).toEqual(store.getState().objects[chapterObjectID].object_name);
        
        // Check if cards are displayed in correct order (column asc -> row asc)
        const expectedNonLinkSubobjectIDs = [1201, 2201, 3201, 1202];
        const subobjectCards = cardElements.data.compositeGroupedLinks.subobjectCards;
        
        expect(subobjectCards.length).toEqual(expectedNonLinkSubobjectIDs.length);
        expect([...subobjectCards].map(card => parseInt(getObjectsViewCardElements({ card }).objectID))).toEqual(expectedNonLinkSubobjectIDs);

        // Check if expected links are displayed
        const expectedLinkSubobjectIDs = [201, 202, 203];
        expect(cardElements.data.compositeGroupedLinks.linksCard.linkRows.length).toEqual(expectedLinkSubobjectIDs.length);
        for (let i = 0; i < expectedLinkSubobjectIDs.length; i++) {
            const row = cardElements.data.compositeGroupedLinks.linksCard.linkRows[i];
            expect(row.link.getAttribute("href")).toEqual(store.getState().links[expectedLinkSubobjectIDs[i]].link);
        }
    });


    test("Composite, multicolumn", async () => {
        // Render page and open a chapter
        let { container, store, chapterObjectID } = await loadObjectsViewPageAndSelectChapter(3910, 6);

        // Check if object name is displayed
        const card = getObjectsViewCardElements({ container }).data.compositeChapters.chapterObject.objectCard;
        const cardElements = getObjectsViewCardElements({ card });
        expect(cardElements.placeholders.fetchError).toBeFalsy();
        expect(cardElements.attributes.header.headerText.textContent).toEqual(store.getState().objects[chapterObjectID].object_name);
        
        // Check if basic display mode is used and cards are displayed in correct order (column asc -> row asc)
        const expectedSubobjectIDs = [301, 1301, 2301, 3301, 302, 1302, 2302, 303, 1303, 304];
        const subobjectCards = cardElements.data.compositeBasic.subobjectCards;
        
        expect(subobjectCards.length).toEqual(expectedSubobjectIDs.length);
        expect([...subobjectCards].map(card => parseInt(getObjectsViewCardElements({ card }).objectID))).toEqual(expectedSubobjectIDs);
    });


    test("Composite, chapters with exceeded max depth", async () => {
        // Render page and open a chapter
        let { container, store, chapterObjectID } = await loadObjectsViewPageAndSelectChapter(3910, 7, 1);

        // Check if object name is displayed
        const card = getObjectsViewCardElements({ container }).data.compositeChapters.chapterObject.objectCard;
        const cardElements = getObjectsViewCardElements({ card });
        expect(cardElements.placeholders.fetchError).toBeFalsy();
        expect(cardElements.attributes.header.headerText.textContent).toEqual(store.getState().objects[chapterObjectID].object_name);
        
        // Check if basic display mode is used and cards are displayed in correct order (column asc -> row asc)
        const expectedSubobjectIDs = [411, 3912];
        const subobjectCards = cardElements.data.compositeBasic.subobjectCards;
        
        expect(subobjectCards.length).toEqual(expectedSubobjectIDs.length);
        expect([...subobjectCards].map(card => parseInt(getObjectsViewCardElements({ card }).objectID))).toEqual(expectedSubobjectIDs);
    });
});


describe("Hierarchy navigation controls", () => {
    test("Breadcrumb", async () => {
        // Render page and wait for data to load
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/view/3910"
        });

        // Wait for the page to load
        await waitFor(() => expect(getObjectsViewCardElements({ container }).data.compositeChapters.placeholders.loading).toBeFalsy());
        let compositeChaptersElements = getObjectsViewCardElements({ container }).data.compositeChapters;
        expect(compositeChaptersElements.placeholders.fetchError).toBeFalsy();

        // Check if breadcrumb is not rendered
        expect(compositeChaptersElements.hierarchyNavigation.breadcrumbSections).toBeFalsy();

        // Open deepmost subchapter and wait for page to load
        const element = compositeChaptersElements.tableOfContents.container.childElements[6].childElements[1].childElements[0];
        fireEvent.click(element.link);
        await waitFor(() => expect(getObjectsViewCardElements({ container }).data.compositeChapters.chapterObject.objectCard).toBeTruthy());
        let card = getObjectsViewCardElements({ container }).data.compositeChapters.chapterObject.objectCard;
        await waitFor(() => expect(getObjectsViewCardElements({ card }).placeholders.loading).toBeFalsy());
        expect(getObjectsViewCardElements({ card }).attributes.header.headerText.textContent).toEqual(store.getState().objects[element.objectID].object_name);

        // Check breadcrumb
        let breadcrumbSections = getObjectsViewCardElements({ container }).data.compositeChapters.hierarchyNavigation.breadcrumbSections;
        expect(breadcrumbSections.length).toEqual(4);
        
        const baseURL = "/objects/view/3910";
        expect(breadcrumbSections[0].link.getAttribute("href")).toEqual(baseURL);
        expect(breadcrumbSections[0].chapterName.textContent).toEqual(store.getState().objects[3910].object_name);

        expect(breadcrumbSections[1].link.getAttribute("href")).toEqual(baseURL + "?ch=7");
        expect(breadcrumbSections[1].chapterName.textContent).toEqual(store.getState().objects[3911].object_name);

        expect(breadcrumbSections[2].link.getAttribute("href")).toEqual(baseURL + "?ch=7.2");
        expect(breadcrumbSections[2].chapterName.textContent).toEqual(store.getState().objects[3912].object_name);

        expect(breadcrumbSections[3].link).toBeFalsy();
        expect(breadcrumbSections[3].chapterName.textContent).toEqual(store.getState().objects[421].object_name);

        // Move two levels up
        fireEvent.click(breadcrumbSections[1].link);
        await waitFor(() => expect(getObjectsViewCardElements({ container }).data.compositeChapters.tableOfContents.attributes.header.headerText.textContent).toEqual(store.getState().objects[3911].object_name));

        // Check breadcrumb
        breadcrumbSections = getObjectsViewCardElements({ container }).data.compositeChapters.hierarchyNavigation.breadcrumbSections;
        expect(breadcrumbSections.length).toEqual(2);
        
        expect(breadcrumbSections[0].link.getAttribute("href")).toEqual(baseURL);
        expect(breadcrumbSections[0].chapterName.textContent).toEqual(store.getState().objects[3910].object_name);

        expect(breadcrumbSections[1].link).toBeFalsy();
        expect(breadcrumbSections[1].chapterName.textContent).toEqual(store.getState().objects[3911].object_name);

        // Move up to root object
        fireEvent.click(breadcrumbSections[0].link);
        await waitFor(() => expect(getObjectsViewCardElements({ container }).data.compositeChapters.tableOfContents.attributes.header.headerText.textContent).toEqual(store.getState().objects[3910].object_name));

        // Check if breadcrumb is not rendered
        expect(compositeChaptersElements.hierarchyNavigation.breadcrumbSections).toBeFalsy();
    });
    
    
    test("Previous & next", async () => {
        // Render page and wait for data to load
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/view/3910"
        });

        // Wait for the page to load
        await waitFor(() => expect(getObjectsViewCardElements({ container }).data.compositeChapters.placeholders.loading).toBeFalsy());
        let compositeChaptersElements = getObjectsViewCardElements({ container }).data.compositeChapters;
        expect(compositeChaptersElements.placeholders.fetchError).toBeFalsy();

        // Check if previous and next are not rendered
        expect(compositeChaptersElements.hierarchyNavigation.prev.link).toBeFalsy();
        expect(compositeChaptersElements.hierarchyNavigation.next.link).toBeFalsy();

        // Open first subchapter
        fireEvent.click(compositeChaptersElements.tableOfContents.container.childElements[0].link);
        await waitFor(() => {
            const card = getObjectsViewCardElements({ container }).data.compositeChapters.chapterObject.objectCard;
            expect(getObjectsViewCardElements({ card }).attributes.header.headerText.textContent).toEqual(store.getState().objects[401].object_name)
        });

        // Check if prev and next elements are correctly rendered
        let prev = getObjectsViewCardElements({ container }).data.compositeChapters.hierarchyNavigation.prev;
        let next = getObjectsViewCardElements({ container }).data.compositeChapters.hierarchyNavigation.next;
        expect(prev.link).toBeFalsy();
        expect(next.chapterName.textContent).toEqual(store.getState().objects[1401].object_name);

        // Loop through next chapters
        const chapterObjectIDs = [401, 1401, 2401, 3901, 3907, 3909, 3911];

        for (let i = 1; i < chapterObjectIDs.length; i++) {
            fireEvent.click(next.link);
            await waitFor(() => {
                const objectID = chapterObjectIDs[i];
                // Intermediate chapters
                if (i < 6) {
                    const card = getObjectsViewCardElements({ container }).data.compositeChapters.chapterObject.objectCard;
                    expect(getObjectsViewCardElements({ card }).attributes.header.headerText.textContent).toEqual(store.getState().objects[objectID].object_name)
                }

                // Last chapter
                else expect(getObjectsViewCardElements({ container }).data.compositeChapters.tableOfContents.attributes.header.headerText.textContent).toEqual(store.getState().objects[objectID].object_name);
            });

            prev = getObjectsViewCardElements({ container }).data.compositeChapters.hierarchyNavigation.prev;
            next = getObjectsViewCardElements({ container }).data.compositeChapters.hierarchyNavigation.next;

            expect(prev.chapterName.textContent).toEqual(store.getState().objects[chapterObjectIDs[i - 1]].object_name);
            if (i < 6) expect(next.chapterName.textContent).toEqual(store.getState().objects[chapterObjectIDs[i + 1]].object_name);
            else (expect(next.link).toBeFalsy());
        }

        // Move to prev chapter
        fireEvent.click(prev.link);
        await waitFor(() => {
            const card = getObjectsViewCardElements({ container }).data.compositeChapters.chapterObject.objectCard;
            expect(getObjectsViewCardElements({ card }).attributes.header.headerText.textContent).toEqual(store.getState().objects[3909].object_name)
        });
    });
});
