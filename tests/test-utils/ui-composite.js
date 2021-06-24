import { fireEvent } from "@testing-library/react";
import { getByText, queryByPlaceholderText, queryByRole, queryByText, queryByTitle, waitFor } from "@testing-library/dom";
import { getObjectTypeSelectingElements } from "./ui-object";


expect.extend({
    /**
    * Checks if a two-dimensional list of subobject cards has expected number of cards.
    */
    toHaveExpectedNumberOfCardsInColumns(cards, expectedNumbersOfCards) {
        if (cards.length !== expectedNumbersOfCards.length)
            return { pass: false, message: () => `Card grid contains an unexpected number of columns: expected ${expectedNumbersOfCards.length}, received ${cards.length}.` };
        else
            for (let i = 0; i < expectedNumbersOfCards.length; i++)
                if (cards[i].length !== expectedNumbersOfCards[i])
                    return { 
                        pass: false, 
                        message: () => `Card grid contains an incorrect number of subobjects in column ${i}: expected ${expectedNumbersOfCards[i]}, received ${cards[i].length}.`
                    };

        return { pass: true, msg: `Expected card grid not to contain the following number of cards in its columns: ${JSON.stringify(expectedNumbersOfCards)}` };
    }
});


/**
 * Adds a new subobject via add subobject menu.
 */
export const addANewSubobject = container => {
    const { addNewButton } = getAddSubobjectMenu(container);
    fireEvent.click(addNewButton);
};


/**
 * Adds an existing subobject with provided `objectName`. `store` is required to monitor state updates.
 * 
 * If `waitForObjectLoad` is true, waits for the data of the new subobject to appear in state.editedObjects.
 */
export const addAnExistingSubobject = async (container, objectName, store, { waitForObjectLoad } = {}) => {
    const currentObjectID = store.getState().objectUI.currentObjectID;
    const existingSubobjectIDs = Object.keys(store.getState().editedObjects[currentObjectID].composite.subobjects);
    const { addSubobjectMenuContainer, addExistingButton } = getAddSubobjectMenu(container);
    fireEvent.click(addExistingButton);
    
    // Enter object name and await seach results
    const { dropdownInput } = getAddSubobjectMenuDropdown(addSubobjectMenuContainer);
    const oldMatchingIDs = store.getState().objectUI.addCompositeSubobjectMenu.matchingIDs;
    fireEvent.change(dropdownInput, { target: { value: objectName } });
    await waitFor(() => expect(oldMatchingIDs).not.toBe(store.getState().objectUI.addCompositeSubobjectMenu.matchingIDs));  // matching IDs are updated
    const objectID = store.getState().objectUI.addCompositeSubobjectMenu.matchingIDs[0];
    await waitFor(() => expect(store.getState().objects).toHaveProperty(objectID.toString()));     // found object attributes are fetched

    // Select found object
    const { dropdownOptionsContainer } = getAddSubobjectMenuDropdown(addSubobjectMenuContainer);
    const dropdownOption = getByText(dropdownOptionsContainer, objectName).parentNode;
    fireEvent.click(dropdownOption);
    
    // Wait for the object to load into state if set to
    if (waitForObjectLoad) {
        const newSubobjectIDs = Object.keys(store.getState().editedObjects[currentObjectID].composite.subobjects);
        expect(newSubobjectIDs.length).toEqual(existingSubobjectIDs.length + 1);

        const existingSubobjectsSet = new Set(existingSubobjectIDs);
        const newIDs = newSubobjectIDs.filter(id => !existingSubobjectsSet.has(id));
        await waitFor(() => expect(store.getState().editedObjects).toHaveProperty(newIDs[0]));
    }
};


/**
 * Returns composite object's add subobjects menu and buttons.
 */
 export const getAddSubobjectMenu = container => {
    const addSubobjectMenuContainer = container.querySelector(".composite-subobject-card.add-menu");
    expect(addSubobjectMenuContainer).toBeTruthy();
    const addNewButton = getByText(addSubobjectMenuContainer, "Add New");
    const addExistingButton = getByText(addSubobjectMenuContainer, "Add Existing");
    return { addSubobjectMenuContainer, addNewButton, addExistingButton };
};


/**
 * Returns dropdown input and displayed dropdown options container from `menuContainer` (if "Add Existing" button of this menu was clicked before).
 */
export const getAddSubobjectMenuDropdown = menuContainer => {
    const inputContainer = menuContainer.querySelector(".composite-object-add-menu-dropdown");
    if (!inputContainer) return {};
    
    return { 
        dropdownInput: inputContainer.querySelector("input"), 
        dropdownOptionsContainer: queryByRole(inputContainer, "listbox")
    };
};


/**
 * Returns all subobject cards in the `container`. 
 * Each grid column is placed into its own list.
 * 
 * If a list of integers `expectedNumbersOfCards` is passed as a prop of the second argument, asserts that number of cards in each column matches expected value.
 * 
 * If `countAddMenusAsCards` is set to true, treats add subobject menus as cards.
 */
export const getSubobjectCards = (container, { expectedNumbersOfCards, countAddMenusAsCards } = {}) => {
    const subobjectGrid = container.querySelector(".composite-subobject-grid");
    expect(subobjectGrid).toBeTruthy();
    const cards = [];
    subobjectGrid.querySelectorAll(".composite-subobject-grid-column").forEach(column => {
        const columnCards = [];
        if (countAddMenusAsCards) {
            column.querySelectorAll(".composite-subobject-card").forEach(card => { columnCards.push(card); });
        } else {
            column.querySelectorAll(".composite-subobject-card").forEach(card => {
                if (!card.classList.contains("add-menu")) columnCards.push(card); });
        }
        cards.push(columnCards);
    });

    if (expectedNumbersOfCards) expect(cards).toHaveExpectedNumberOfCardsInColumns(expectedNumbersOfCards);

    return cards;
};


/**
 * Returns subobject attribute elements and controls from subobject card `card`.
 */
export const getSubobjectCardAttributeElements = card => {
    const { linkButton, markdownButton, TDLButton, compositeButton } = getObjectTypeSelectingElements(card);

    const timeStampsContainer = card.querySelector(".created-modified-timestamps-container");

    const subobjectNameInput = queryByPlaceholderText(card, "Object name");
    const subobjectDescriptionInput = queryByPlaceholderText(card, "Object description");
    
    return { linkButton, markdownButton, TDLButton, compositeButton, timeStampsContainer, subobjectNameInput, subobjectDescriptionInput };
};


/**
 * Returns tab switching buttons of a `card`.
 */
export const getSubobjectCardTabSelectionButtons = card => {
    const cardMenu = card.querySelector(".composite-subobject-card-menu");
    if (!cardMenu) return {};

    return {
        subobjectGeneralTabButton: queryByText(cardMenu, "General"),
        subobjectDataTabButton: queryByText(cardMenu, "Data")
    };
};


/**
 * Gets attribute tab button from card menu and clicks it.
 */
export const clickSubobjectCardAttributeTabButton = card => {
    const { subobjectGeneralTabButton } = getSubobjectCardTabSelectionButtons(card);
    if (subobjectGeneralTabButton) fireEvent.click(subobjectGeneralTabButton);
};


/**
 * Gets attribute tab button from card menu and clicks it.
 */
export const clickSubobjectCardDataTabButton = card => {
    const { subobjectDataTabButton } = getSubobjectCardTabSelectionButtons(card);
    if (subobjectDataTabButton) fireEvent.click(subobjectDataTabButton);
};


/**
 * Returns menu buttons of a `card`.
 */
export const getSubobjectCardMenuButtons = card => {
    const cardMenu = card.querySelector(".composite-subobject-card-menu");
    if (!cardMenu) return {};

    return {
        viewObjectPageButton: queryByTitle(cardMenu, "Open edit page of this object"),
        resetButton: queryByTitle(cardMenu, "Reset object"),
        deleteButton: queryByTitle(cardMenu, "Delete subobject"),
        fullDeleteButton: queryByTitle(cardMenu, "Fully delete subobject"),
        restoreButton: queryByTitle(cardMenu, "Restore deleted subobject")
    };
};


/**
 * Returns all indicators displayed in the subobject `card` heading.
 */
export const getSubobjectCardIndicators = card => {
    const heading = card.querySelector(".composite-subobjct-card-heading");
    if (!heading) return {};
    const headingRight = heading.querySelector(".composite-subobject-card-heading-right");
    return {
        isNewSubobject: queryByTitle(headingRight, "Subobject is new and will be created when main object is saved"),
        
        validationError: queryByTitle(headingRight, "Subobject is not valid:", { exact: false }),
        isComposite: queryByTitle(headingRight, "Subobject is composite. All changes made to it must be saved from its page."),
        
        isExistingSubobjectWithModifiedAttributes: queryByTitle(headingRight, "Subobject attributes were modified"),
        isExistingSubobjectWithModifiedTags: queryByTitle(headingRight, "Subobject tags were modified"),
        isExistingSubobjectWithModifiedData: queryByTitle(headingRight, "Subobject data was modified"),
        isExistingSubobjectWithModifiedParameters: queryByTitle(headingRight, "Subobject parameters were modified"),

        isDeleted: queryByTitle(headingRight, "Subobject is marked for deletion"),
        isFullyDeleted: queryByTitle(headingRight, "Subobject is marked for full deletion"),
    };
};
