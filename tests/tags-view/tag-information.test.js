import React from "react";
import { waitFor, fireEvent } from "@testing-library/react";

import { createTestStore } from "../_util/create-test-store";
import { renderWithWrappers } from "../_util/render";
import { getTagsViewElements, checkDisplayedTagsViewFeedCardIDs } from "../_util/ui-tags-view";

import { App } from "../../src/components/top-level/app";


/*
    /tags/view tag selection & selected tags display
*/
beforeEach(() => {
    // isolate fetch mock to avoid tests state collision because of cached data in fetch
    jest.isolateModules(() => {
        const { mockFetch, setFetchFail, addCustomRouteResponse } = require("../_mocks/mock-fetch");
        // reset fetch mocks
        jest.resetAllMocks();
        global.fetch = jest.fn(mockFetch);
        global.setFetchFail = jest.fn(setFetchFail);
        global.addCustomRouteResponse = jest.fn(addCustomRouteResponse);
    });
});

describe("Tag information", () => {
    test("Information block not displayed if no valid tags are selected", async () => {
            let { container } = renderWithWrappers(<App />, {
                route: "/tags/view?tagIDs=0,-1,asd"
            });

            // Check if no selected tags are rendered
            expect(getTagsViewElements(container).tagInformation.container).toBeNull();
    });


    test("Header text", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/tags/view?tagIDs=5"
        });

        // Wait for header text to be correctly displayed
        await waitFor(() => expect(getTagsViewElements(container).tagInformation.tagCard.header.textContent).toEqual(store.getState().tags[5].tag_name));
    });


    test("Header edit button for admin", async () => {
        let { container, history } = renderWithWrappers(<App />, {
            route: "/tags/view?tagIDs=5"
        });

        // Wait for header text to be correctly displayed
        await waitFor(() => expect(getTagsViewElements(container).tagInformation.tagCard.editButton).toBeTruthy());
        fireEvent.click(getTagsViewElements(container).tagInformation.tagCard.editButton);

        expect(history.entries[history.entries.length - 1].pathname).toEqual("/tags/edit/5");
    });


    test("Header edit butoon for anonymous user", async () => {
        const store = createTestStore({ addAdminToken: false });
        let { container } = renderWithWrappers(<App />, {
            route: "/tags/view?tagIDs=5", store
        });

        // Wait for header text to be correctly displayed
        await waitFor(() => expect(getTagsViewElements(container).tagInformation.tagCard.header.textContent).toEqual(store.getState().tags[5].tag_name));

        // Check if edit button is displayed
        expect(getTagsViewElements(container).tagInformation.tagCard.editButton).toBeFalsy();
    });


    test("Header description", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/tags/view?tagIDs=5"
        });

        // Wait for header description to be rendered
        await waitFor(() => {
            const { description } = getTagsViewElements(container).tagInformation.tagCard;
            expect(description).toBeTruthy();
            expect(description.querySelector("p").textContent).toEqual(store.getState().tags[5].tag_description);
        });
    });


    test("Header description template", async () => {
        // Return tags without description
        addCustomRouteResponse("/tags/view", "POST", { generator: (body, handler) => {
            const response = handler(body);
            response.body.tags.forEach(tag => { tag.tag_description = "" });
            return response;
        }});

        let { container } = renderWithWrappers(<App />, {
            route: "/tags/view?tagIDs=5"
        });

        // Wait for header description to be rendered
        await waitFor(() => {
            const { description } = getTagsViewElements(container).tagInformation.tagCard;
            expect(description).toBeTruthy();
            expect(description.textContent).toEqual("<No description>");
        });
    });
});


describe("Previous & next buttons", () => {
    test("Single selected tag", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/tags/view?tagIDs=5"
        });

        // Wait for header text to be correctly displayed
        await waitFor(() => expect(getTagsViewElements(container).tagInformation.tagCard.header.textContent).toEqual(store.getState().tags[5].tag_name));

        // Check if previous & next buttons are not displayed
        expect(getTagsViewElements(container).tagInformation.prevButton).toBeFalsy();
        expect(getTagsViewElements(container).tagInformation.nextButton).toBeFalsy();
    });


    test("Multiple selected tags", async () => {
        const tagIDs = [5, 9, 13];
        let { container, store } = renderWithWrappers(<App />, {
            route: `/tags/view?tagIDs=${tagIDs}`
        });

        // Wait for header text of the first selected tag to be correctly displayed
        await waitFor(() => expect(getTagsViewElements(container).tagInformation.tagCard.header.textContent).toEqual(store.getState().tags[tagIDs[0]].tag_name));

        // Check if previous & next buttons are displayed
        const { prevButton, nextButton } = getTagsViewElements(container).tagInformation;
        expect(prevButton).toBeTruthy();
        expect(nextButton).toBeTruthy();

        // Click next button & check tag information display
        for (let i = 0; i < tagIDs.length; i++) {
            fireEvent.click(nextButton);
            await waitFor(() => {
                const tagID = tagIDs[(i + 1) % tagIDs.length];
                const { header, description } = getTagsViewElements(container).tagInformation.tagCard;
                expect(header.textContent).toEqual(store.getState().tags[tagID].tag_name);
                expect(description.querySelector("p").textContent).toEqual(store.getState().tags[tagID].tag_description);
            });
        }

        // Click prev button & check tag information display
        for (let i = tagIDs.length; i > 0; i--) {
            fireEvent.click(prevButton);
            await waitFor(() => {
                const tagID = tagIDs[i - 1];
                const { header, description } = getTagsViewElements(container).tagInformation.tagCard;
                expect(header.textContent).toEqual(store.getState().tags[tagID].tag_name);
                expect(description.querySelector("p").textContent).toEqual(store.getState().tags[tagID].tag_description);
            });
        }
    });
});

//         - prev & next tag buttons:
//             - not displayed if a single tag is selected;
//             - displayed for multiple selected tags:
//                 - click prev & next buttons several times > check if correct tag info & markdown are displayed;

// test("Valid tags are displayed", async () => {
//     const validTags = [5, 10, 15];
//     let { container, store } = renderWithWrappers(<App />, {
//         route: `/tags/view?tagIDs=0,-1,${validTags}`
//     });

//     // Wait for valid selected tags to be rendered in correct order
//     await waitFor(() => {
//         const { tags } = getTagsViewElements(container).selectedTags;
//         expect(tags.length).toEqual(validTags.length);
        
//         for (let i = 0; i < validTags.length; i++) {
//             const tagID = validTags[i];
//             const item = getInlineItem({ item: tags[i] });
//             expect(item.linkTagID).toEqual(tagID);
//             expect(item.textSpan.textContent).toEqual(store.getState().tags[tagID].tag_name);
//         }
//     });
// });


// test("Tag item on click redirect", async () => {
//     // Return different object IDs for different selected tags
//     const firstObjectIDs = [5, 25, 45], secondObjectIDs = [100, 200, 300];
//     addCustomRouteResponse("/objects/get_page_object_ids", "POST", { generator: (body, handler) => {
//         const tagIDs = JSON.parse(body).pagination_info.tags_filter;
//         const response = handler(body);
//         if (tagIDs[0] === 5) response.body.pagination_info.object_ids = firstObjectIDs;
//         if (tagIDs[0] === 10) response.body.pagination_info.object_ids = secondObjectIDs;
//         return response;
//     }});

//     let { container, history } = renderWithWrappers(<App />, {
//         route: `/tags/view?tagIDs=5,10&p=2`
//     });

//     // Wait for valid selected tags to be rendered
//     await waitFor(() => expect(getTagsViewElements(container).selectedTags.tags.length).toEqual(2));

//     // Click on tag item and check if redirect occured
//     const item = getTagsViewElements(container).selectedTags.tags[1];
//     fireEvent.click(getInlineItem({ item }).link);
//     expect(history.entries[history.entries.length - 1].pathname).toEqual("/tags/view");
//     expect(history.entries[history.entries.length - 1].search).toEqual("?tagIDs=10");
//     await waitFor(() => expect(getTagsViewElements(container).feed.placeholders.loading).toBeFalsy());

//     // Check if correct objects are rendered
//     checkDisplayedTagsViewFeedCardIDs(container, secondObjectIDs);
// });


// test("Select a tag with dropdown", async () => {
//     // Return different object IDs for different selected tags
//     const firstObjectIDs = [5, 25, 45], secondObjectIDs = [100, 200, 300];
//     addCustomRouteResponse("/objects/get_page_object_ids", "POST", { generator: (body, handler) => {
//         const tagIDs = JSON.parse(body).pagination_info.tags_filter;
//         const response = handler(body);
//         if (tagIDs.length === 2) response.body.pagination_info.object_ids = firstObjectIDs;
//         if (tagIDs.length === 3) response.body.pagination_info.object_ids = secondObjectIDs;
//         return response;
//     }});

//     const newSelectedTagName = "new selected tag", newSelectedTagID = 50;
//     // Return a fixed id for new selected tag
//     addCustomRouteResponse("/tags/search", "POST", { status: 200, body: { tag_ids: [newSelectedTagID, 100, 200] }});

//     // Return a fixed name for new selected tag
//     addCustomRouteResponse("/tags/view", "POST", { generator: (body, handler) => {
//         const response = handler(body);
//         response.body.tags.forEach(tag => { if (tag.tag_id === newSelectedTagID) tag.tag_name = newSelectedTagName; });
//         return response;
//     }});

//     let { container, history } = renderWithWrappers(<App />, {
//         route: `/tags/view?tagIDs=5,10&p=2`
//     });

//     // Wait for valid selected tags to be rendered
//     await waitFor(() => expect(getTagsViewElements(container).selectedTags.tags.length).toEqual(2));

//     // Add a new tag with dropdown
//     fireEvent.change(getTagsViewElements(container).dropdown.input, { target: { value: newSelectedTagName } });
//     await waitFor(() => expect(getTagsViewElements(container).dropdown.optionsByText[newSelectedTagName]).toBeTruthy());
//     fireEvent.click(getTagsViewElements(container).dropdown.optionsByText[newSelectedTagName]);

//     // Check if redirect occured
//     expect(history.entries[history.entries.length - 1].pathname).toEqual("/tags/view");
//     const expectedSearch = history.entries[history.entries.length - 1].search.replace(/%252C/g, ",");      // decodeURIComponent not working in test env for some reason
//     expect(expectedSearch).toEqual(`?tagIDs=5,10,${newSelectedTagID}`);
//     await waitFor(() => expect(getTagsViewElements(container).selectedTags.tags.length).toEqual(3));

//     // Check if correct objects are rendered
//     await waitFor(() => checkDisplayedTagsViewFeedCardIDs(container, secondObjectIDs));
// });


// test("Remove tag selection", async () => {
//     // Return different object IDs for different selected tags
//     const firstObjectIDs = [5, 25, 45], secondObjectIDs = [100, 200, 300];
//     addCustomRouteResponse("/objects/get_page_object_ids", "POST", { generator: (body, handler) => {
//         const tagIDs = JSON.parse(body).pagination_info.tags_filter;
//         const response = handler(body);
//         if (tagIDs.length === 2) response.body.pagination_info.object_ids = firstObjectIDs;
//         if (tagIDs.length === 1) response.body.pagination_info.object_ids = secondObjectIDs;
//         return response;
//     }});

//     let { container, history } = renderWithWrappers(<App />, {
//         route: `/tags/view?tagIDs=5,10&p=2`
//     });

//     // Wait for valid selected tags to be rendered
//     await waitFor(() => expect(getTagsViewElements(container).selectedTags.tags.length).toEqual(2));

//     // Deselect a tag
//     const item = getTagsViewElements(container).selectedTags.tags[1];
//     fireEvent.click(getInlineItem({ item }).icons[0]);

//     // Check if redirect occured
//     expect(history.entries[history.entries.length - 1].pathname).toEqual("/tags/view");
//     expect(history.entries[history.entries.length - 1].search).toEqual(`?tagIDs=5`);
    
//     await waitFor(() => expect(getTagsViewElements(container).selectedTags.tags.length).toEqual(1));
//     expect(getInlineItem({ item: getTagsViewElements(container).selectedTags.tags[0] }).linkTagID).toEqual(5);

//     // Check if correct objects are rendered
//     await waitFor(() => checkDisplayedTagsViewFeedCardIDs(container, secondObjectIDs));
// });
