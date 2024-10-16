import moment from "moment";
import { waitFor } from "@testing-library/react";

import { Actions } from "../actions";
import { ObjectsViewCardLayout, CompositeMulticolumnExpandToggleLayout } from "../../layout/page-parts/objects-view";


/**
 * UI actions & checks /objects/view/:id object card
 */
export class ObjectsViewCardActions {
    constructor(card) {
        this.card = card;
        this.layout = new ObjectsViewCardLayout(card);
    }

    /************************************************
     *                Placeholders                  *
     ***********************************************/ 

    /**
     * Waits for card loading placeholder to disappear and markdown containers to render.
     */
    async waitForLoad() {
        // Wait for placeholder to disappear
        await waitFor((function() {
            this.layout = new ObjectsViewCardLayout(this.card);
            expect(this.layout.placeholders.loading).toBeFalsy();
            expect(this.layout.placeholders.error).toBeFalsy();
        }).bind(this));

        // Wait for markdown renders
        const { object_type, show_description } = global.backend.data.object(this.layout.objectID).attributes;
        const { show_description_as_link } = global.backend.data.object(this.layout.objectID).data;

        await waitFor((function() {
            this.layout = new ObjectsViewCardLayout(this.card);
            if (show_description && !show_description_as_link) expect(this.layout.attributes.description).toBeTruthy();
            if (object_type === "link" && show_description_as_link) expect(this.layout.data.link.description).toBeTruthy();
            if (object_type === "markdown") expect(this.layout.data.markdown.markdown).toBeTruthy();
        }).bind(this));

        return this.layout;
    }

    /**
     * Waits for card loading placeholder to disappear and markdown containers to render.
     * If `text` is provided, ensures it's in the error message.
     */
    async waitForError(text) {
        // Wait for placeholder to disappear
        await waitFor((function() {
            this.layout = new ObjectsViewCardLayout(this.card);
            expect(this.layout.placeholders.loading).toBeFalsy();
            expect(this.layout.placeholders.error).toBeTruthy();
            if (text && !Actions.containsTextInChildren(this.layout.placeholders.error, text)) fail(`Failed to find error text '${text}'`);
        }).bind(this));

        return this.layout;
    }

    /************************************************
     *                 Attributes                   *
     ***********************************************/ 

    /**
     * Ensures objectID <div> contains `expectedObjectID` as its text content.
     */
    ensureObjectID(expectedObjectID) {
        if (this.layout.objectID !== expectedObjectID.toString()) fail(`Card object ID '${this.layout.objectID}' does not match expected '${expectedObjectID}'`);
    }

    /**
     * Ensures card timestamp is rendered & contains correct timestamp (matches to the value of `attr` attribute of the object displayed in the card).
     */
    checkTimestamp(attr) {
        if (!this.layout.attributes.timestamp) fail("Card timestamp not found.");

        const timestamp = global.backend.data.object(this.layout.objectID).attributes[attr];
        const textTimestamp = moment(timestamp).format("lll");

        if (!Actions.hasText(this.layout.attributes.timestamp, textTimestamp))
            fail(`Card timestamp '${this.layout.attributes.timestamp.textContent}' does not match expected '${textTimestamp}'.`);
    }

    /**
     * Ensures object name is displayed in card header.
     */
    checkHeaderText() {
        if (!this.layout.attributes.header.text) fail("Header text not found.");
        const { object_name } = global.backend.data.object(this.layout.objectID).attributes;

        if (!Actions.hasText(this.layout.attributes.header.text, object_name))
            fail(`Object header text '${this.layout.attributes.header.text.textContent}' does not match expected '${object_name}'.`);
    }

    /**
     * Ensures link to object's edit page is present in the card & clicks it.
     */
    clickEditObjectButton() {
        if (!this.layout.attributes.header.editButton) fail("Edit object button not found.");
        Actions.click(this.layout.attributes.header.editButton);
    }


    /**
     * Ensures object description is displayed in card header.
     */
    checkDescriptionText() {
        if (!this.layout.attributes.description) fail("Object description not found.");
        const { object_description } = global.backend.data.object(this.layout.objectID).attributes;

        if (!Actions.hasTextInChildren(this.layout.attributes.description, object_description))
            fail(`Object header text '${this.layout.attributes.description.textContent}' does not match expected '${object_description}'.`);
    }

    /************************************************
     *                    Tags                      *
     ***********************************************/ 

    /**
     * Ensures object tags are correctly displayed (or not displayed, if object is not tagged).
     */
    checkTags() {
        const { current_tag_ids } = global.backend.data.object(this.layout.objectID).attributes;

        if (current_tag_ids.length === 0) {
            // Object is not tagged case
            if (this.layout.tags.tagsContainer) fail("Found unexpected object tags container.");
        
        } else {
            // Objects is tagged -> check if all tags are displayed in the correct order
            if (!this.layout.tags.tagsContainer) fail("Object tags not found.");
            if(this.layout.tags.tags.length !== current_tag_ids.length) fail(`Found ${this.layout.tags.tags.length} tags, expected ${current_tag_ids.length}`);

            for (let i = 0; i < current_tag_ids.length; i++) {
                const { tag_name } = global.backend.data.tag(current_tag_ids[i]);
                if (!Actions.hasTextInChildren(this.layout.tags.tags[i], tag_name)) fail(`Failed to find object tag '${tag_name}' on position {i}`);
            }
        }
    }

    /**
     * Clicks a provided object tag (item of cardLayout.tags.tags)
     */
    clickTag(tag) {
        if (!tag) fail("Tag is not a node.");
        const link = tag.querySelector("a");
        if (!link) if (!tag) fail("Tag does not contain a link.");
        Actions.click(link);
    }

    /************************************************
     *                    Data                      *
     ***********************************************/ 

    /**
     * Ensures multicolumn subobject cards are displayed in the correct positions.
     */
    checkCompositeMulticolumnSubobjectPositions() {
        const { subobjects } = global.backend.data.object(this.layout.objectID).data;
        
        // Check if total number of displayed subobject cards is correct
        const displayedColumns = this.layout.data.compositeMulticolumn.columns;
        const numberOfDisplayedCards = displayedColumns.reduce((result, column) => result + column.length, 0);
        if (subobjects.length !== numberOfDisplayedCards) fail(`Expected ${subobjects.length} cards, but found ${numberOfDisplayedCards}.`);

        subobjects.forEach(subobject => {
            const { object_id, column, row } = subobject;

            if (displayedColumns.length < column) fail(`Column ${column} not found.`);
            if (!displayedColumns[column][row]) fail(`Card not found at [${column}][${row}].`);
            const cardLayout = new ObjectsViewCardLayout(displayedColumns[column][row].card);
            if (cardLayout.objectID !== object_id.toString()) fail(`Expected subobject ID '${object_id}' at [${column}][${row}], found '${cardLayout.objectID}'.`);
        })
    }
}


/**
 * UI actions & checks /objects/view/:id composite multicolumn expand toggle.
 */
export class ExpandToggleActions {
    constructor(expandToggleContainer) {
        this.expandToggleContainer = expandToggleContainer;
        this.layout = new CompositeMulticolumnExpandToggleLayout(this.expandToggleContainer);
    }

    /**
     * Ensures current styles of the expand toggle match its visible state.
     */
    ensureVisible() {
        if (![...this.layout.expandToggleContainer.classList].includes("expanded")) fail("Expand toggle container is not expanded.");
        if (!this.layout.expandToggleText) fail("Expand toggle text element not found.");
        if (this.layout.expandToggleText.textContent.length > 0) fail(`Expected empty expand toggle text, found '${this.layout.expandToggleText.textContent}'.`);
    }

    /**
     * Ensures current styles of the expand toggle match its hidden state.
     */
    ensureHidden() {
        if ([...this.layout.expandToggleContainer.classList].includes("expanded")) fail("Expand toggle container is expanded.");
        
        if (!this.layout.card) fail("Subobject card not found.");
        const cardLayout = new ObjectsViewCardLayout(this.layout.card);
        const { object_name } = global.backend.data.object(cardLayout.objectID).attributes;
        if (!Actions.hasText(this.layout.expandToggleText, object_name)) fail(`Expected toggle text '${object_name}', found '${this.layout.expandToggleText.textContent}'.`);
    }

    /**
     * Clicks expand toggle header to change its visibility state.
     */
    clickToggle() {
        Actions.click(this.layout.expandToggle);
    }
}
    