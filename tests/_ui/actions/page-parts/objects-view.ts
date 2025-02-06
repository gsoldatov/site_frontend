import moment from "moment";
import { waitFor } from "@testing-library/react";

import { Actions } from "../actions";
import { ObjectsViewCardLayout, CompositeMulticolumnExpandToggleLayout } from "../../layout/page-parts/objects-view";
import { getBackend } from "../../../_mock-backend/mock-backend";


/**
 * UI actions & checks /objects/view/:id object card
 */
export class ObjectsViewCardActions {
    card: HTMLElement | null
    layout: ObjectsViewCardLayout

    constructor(card: HTMLElement | null) {
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
        await waitFor((function(this: ObjectsViewCardActions) {
            this.layout = new ObjectsViewCardLayout(this.card);
            expect(this.layout.placeholders.loading).toBeFalsy();
            expect(this.layout.placeholders.error).toBeFalsy();
        }).bind(this));

        // Wait for markdown renders
        const backend = getBackend();
        const { object_type, show_description } = backend.data.object(this.layout.objectID).attributes;
        const data = backend.data.object(this.layout.objectID).data;
        const show_description_as_link = "show_description_as_link" in data ? data.show_description_as_link : undefined;

        await waitFor((function(this: ObjectsViewCardActions) {
            this.layout = new ObjectsViewCardLayout(this.card);
            if (show_description && !show_description_as_link) expect(this.layout.attributes?.description).toBeTruthy();
            if (object_type === "link" && show_description_as_link) expect(this.layout.data?.link?.description).toBeTruthy();
            if (object_type === "markdown") expect(this.layout.data?.markdown?.markdown).toBeTruthy();
        }).bind(this));

        return this.layout;
    }

    /**
     * Waits for card loading placeholder to disappear and markdown containers to render.
     * If `text` is provided, ensures it's in the error message.
     */
    async waitForError(text: string) {
        // Wait for placeholder to disappear
        await waitFor((function(this: ObjectsViewCardActions) {
            this.layout = new ObjectsViewCardLayout(this.card);
            expect(this.layout.placeholders.loading).toBeFalsy();
            expect(this.layout.placeholders.error).toBeTruthy();
            if (text && !Actions.containsTextInChildren(this.layout.placeholders.error, text)) throw Error(`Failed to find error text '${text}'`);
        }).bind(this));

        return this.layout;
    }

    /************************************************
     *                 Attributes                   *
     ***********************************************/ 

    /**
     * Ensures objectID <div> contains `expectedObjectID` as its text content.
     */
    ensureObjectID(expectedObjectID: number | string) {
        if (this.layout.objectID !== expectedObjectID.toString()) throw Error(`Card object ID '${this.layout.objectID}' does not match expected '${expectedObjectID}'`);
    }

    /**
     * Ensures card timestamp is rendered & contains correct timestamp (matches to the value of `attr` attribute of the object displayed in the card).
     */
    checkTimestamp(attr: "feed_timestamp" | "modified_at") {
        if (!this.layout.attributes?.timestamp) throw Error("Card timestamp not found.");

        const timestamp = getBackend().data.object(this.layout.objectID).attributes[attr];
        const textTimestamp = moment(timestamp).format("lll");

        if (!Actions.hasText(this.layout.attributes.timestamp, textTimestamp))
            throw Error(`Card timestamp '${this.layout.attributes.timestamp.textContent}' does not match expected '${textTimestamp}'.`);
    }

    /**
     * Ensures object name is displayed in card header.
     */
    checkHeaderText() {
        if (!this.layout.attributes?.header.text) throw Error("Header text not found.");
        const { object_name } = getBackend().data.object(this.layout.objectID).attributes;

        if (!Actions.hasText(this.layout.attributes.header.text, object_name))
            throw Error(`Object header text '${this.layout.attributes.header.text.textContent}' does not match expected '${object_name}'.`);
    }

    /**
     * Ensures header text contains a link to the /objects/view page of this object
     */
    checkHeaderTextLink() {
        if (!this.layout.attributes?.header.textLink) throw Error("Header text link not found.");
        if (!(this.layout.attributes.header.textLink instanceof HTMLAnchorElement)) throw Error("Header text link element is not <a> tag.");
        if (!this.layout.attributes.header.textLink.href.includes(`/objects/view/${this.layout.objectID}`)) 
            throw Error(`Expected link URL to include '/objects/view/${this.layout.objectID}', found '${this.layout.attributes.header.textLink.href}'.`);
    }

    /**
     * Ensures link to object's edit page is present in the card & clicks it.
     */
    clickEditObjectButton() {
        if (!this.layout.attributes?.header.editButton) throw Error("Edit object button not found.");
        Actions.click(this.layout.attributes.header.editButton);
    }


    /**
     * Ensures object description is displayed in card header.
     */
    checkDescriptionText() {
        if (!this.layout.attributes?.description) throw Error("Object description not found.");
        const { object_description } = getBackend().data.object(this.layout.objectID).attributes;

        if (!Actions.hasTextInChildren(this.layout.attributes.description, object_description))
            throw Error(`Object header text '${this.layout.attributes.description.textContent}' does not match expected '${object_description}'.`);
    }

    /************************************************
     *                    Tags                      *
     ***********************************************/ 

    /**
     * Ensures object tags are correctly displayed (or not displayed, if object is not tagged).
     */
    checkTags() {
        const backend = getBackend();
        const { current_tag_ids } = backend.data.object(this.layout.objectID).attributes;

        if (current_tag_ids.length === 0) {
            // Object is not tagged case
            if (this.layout.tags?.tagsContainer) throw Error("Found unexpected object tags container.");
        
        } else {
            // Objects is tagged -> check if all tags are displayed in the correct order
            if (!this.layout.tags?.tagsContainer) throw Error("Object tags not found.");
            if(this.layout.tags.tags.length !== current_tag_ids.length) throw Error(`Found ${this.layout.tags.tags.length} tags, expected ${current_tag_ids.length}`);

            for (let i = 0; i < current_tag_ids.length; i++) {
                const { tag_name } = backend.data.tag(current_tag_ids[i]);
                if (!Actions.hasTextInChildren(this.layout.tags.tags[i], tag_name)) throw Error(`Failed to find object tag '${tag_name}' on position {i}`);
            }
        }
    }

    /**
     * Clicks a provided object tag (item of cardLayout.tags.tags)
     */
    clickTag(tag: HTMLElement | null) {
        if (!tag) throw Error("Tag is not an element.");
        const link = tag.querySelector("a");
        if (!link) throw Error("Tag does not contain a link.");
        Actions.click(link);
    }

    /************************************************
     *                    Data                      *
     ***********************************************/ 

    /**
     * Ensures multicolumn subobject cards are displayed in the correct positions.
     */
    checkCompositeMulticolumnSubobjectPositions() {
        const backend = getBackend();
        const { data } = backend.data.object(this.layout.objectID);

        if (!("subobjects" in data)) throw Error(`Composite subobjects not found for objectID '${this.layout.objectID}'.`);
        const { subobjects } = data;
        
        // Check if total number of displayed subobject cards is correct
        const displayedColumns = this.layout.data?.compositeMulticolumn?.columns;
        if (!displayedColumns) throw Error("Composite multicolumn columns not found.")
        const numberOfDisplayedCards = displayedColumns.reduce((result, column) => result + column.length, 0);
        if (subobjects.length !== numberOfDisplayedCards) throw Error(`Expected ${subobjects.length} cards, but found ${numberOfDisplayedCards}.`);

        subobjects.forEach(subobject => {
            const { subobject_id, column, row } = subobject;

            if (displayedColumns.length < column) throw Error(`Column ${column} not found.`);
            if (!displayedColumns[column][row]) throw Error(`Card not found at [${column}][${row}].`);
            const cardLayout = new ObjectsViewCardLayout(displayedColumns[column][row].card);
            if (cardLayout.objectID !== subobject_id.toString()) throw Error(`Expected subobject ID '${subobject_id}' at [${column}][${row}], found '${cardLayout.objectID}'.`);
        })
    }
}


/**
 * UI actions & checks /objects/view/:id composite multicolumn expand toggle.
 */
export class ExpandToggleActions {
    expandToggleContainer: HTMLElement | null
    layout: CompositeMulticolumnExpandToggleLayout

    constructor(expandToggleContainer: HTMLElement | null) {
        this.expandToggleContainer = expandToggleContainer;
        this.layout = new CompositeMulticolumnExpandToggleLayout(this.expandToggleContainer);
    }

    /**
     * Ensures current styles of the expand toggle match its visible state.
     */
    ensureVisible() {
        if(!this.layout.expandToggleContainer) throw Error("Expand toggle container is not an element.")
        if (![...this.layout.expandToggleContainer.classList].includes("expanded")) throw Error("Expand toggle container is not expanded.");
        if (!this.layout.expandToggleText) throw Error("Expand toggle text element not found.");
        if ((this.layout.expandToggleText?.textContent || "").length > 0)   // textContent shouldn't be null, but if it is, consider it empty
            throw Error(`Expected empty expand toggle text, found '${this.layout.expandToggleText.textContent}'.`);
    }

    /**
     * Ensures current styles of the expand toggle match its hidden state.
     */
    ensureHidden() {
        if(!this.layout.expandToggleContainer) throw Error("Expand toggle container is not an element.")
        if ([...this.layout.expandToggleContainer.classList].includes("expanded")) throw Error("Expand toggle container is expanded.");
        
        if (!this.layout.card) throw Error("Subobject card not found.");
        const cardLayout = new ObjectsViewCardLayout(this.layout.card);
        const { object_name } = getBackend().data.object(cardLayout.objectID).attributes;
        if (!Actions.hasText(this.layout.expandToggleText, object_name)) throw Error(`Expected toggle text '${object_name}', found '${this.layout.expandToggleText?.textContent}'.`);
    }

    /**
     * Clicks expand toggle header to change its visibility state.
     */
    clickToggle() {
        if (!this.layout.expandToggle) throw Error("Expand toggle is not an element.");
        Actions.click(this.layout.expandToggle);
    }
}
