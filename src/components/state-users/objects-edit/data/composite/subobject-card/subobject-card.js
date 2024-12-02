import React from "react";
import { DragSource, DropTarget } from "react-dnd";

import { Heading } from "./heading";
import { CardMenu } from "./card-menu";
import { CardGeneralTab } from "./general-tab";
import { CardDataTab } from "./data-tab";
import { CardDisplayTab } from "./display-tab";
import { CardPlaceholder } from "./placeholders/error";
import { LoadingPlaceholder } from "./placeholders/loading";
import { DeletedPlaceholder } from "./placeholders/deleted";
import { ResetSubobjectDialog } from "./dialogs/reset-subobject-dialog";
import { CardCollapseArea } from "./card-collapse-area";
import { OnResizeWrapper } from "../../../../../modules/wrappers/on-resize-wrapper";


/**
 * Composite subobject card component.
 */
class SubobjectCard extends React.PureComponent {
    constructor(props) {
        super(props);

        this.setIsResetDialogDisplayed = this.setIsResetDialogDisplayed.bind(this);
        this.setIsMouseOverDraggable = this.setIsMouseOverDraggable.bind(this);
        this.onResizeCallback = this.onResizeCallback.bind(this);

        this.headingRef = React.createRef();
        
        this.state = {
            isResetDialogDisplayed: false,
            isCollapseAreaDisplayed: false,
            isMouseOverDraggable: false     // component can be dragged by its heading (except for expand/collapse toggle)
        };
    }

    setIsResetDialogDisplayed(isResetDialogDisplayed) { this.setState({ isResetDialogDisplayed }); }
    setIsMouseOverDraggable(isMouseOverDraggable) { this.setState({ isMouseOverDraggable }); }

    // Toggle collapse area display, if component's height is big enough
    onResizeCallback(cardRef) {
        const height = parseInt(getComputedStyle(cardRef).height.replace("px", ""));
        const isCollapseAreaDisplayed = height >= 1000;
        this.setState({ isCollapseAreaDisplayed });
    }

    render() {
        const { objectID, subobjectID, updateCallback, selectedTab, isExpanded, isSubobjectEdited, fetchError, isSubobjectDeleted } = this.props;
        const { isResetDialogDisplayed, isCollapseAreaDisplayed } = this.state;
        const { connectDragSource, connectDropTarget, isDragging, isDraggedOver } = this.props;
        let result, isDraggable = false;
        
        // Render fetch error message, when object could not be fetched
        if (!isSubobjectEdited && fetchError.length > 0) {
            let cardClassName = "composite-subobject-card no-padding is-draggable";
            if (isDraggedOver) cardClassName += " is-dragged-over";
            if (isDragging) cardClassName += " is-dragged";
            
            result = (  // wrapper is required to avoid error when passing a component to React DND connector
                <div className={cardClassName}>
                    <CardPlaceholder fetchError={fetchError} isSubobjectDeleted={isSubobjectDeleted} subobjectID={subobjectID} updateCallback={updateCallback} />
                </div>
            );
            isDraggable = true;
        }

        // Render placeholder if object is not added into state.editedObjects
        else if (!isSubobjectEdited) {
            let cardClassName = "composite-subobject-card no-padding";
            if (isDraggedOver) cardClassName += " is-dragged-over";
            // if (isDragging) cardClassName += " is-dragged";  // loading card is not draggable

            result = (  // wrapper is required to avoid error when passing a component to React DND connector
                <div className={cardClassName}>
                    <LoadingPlaceholder />
                </div>
            );
        }

        // Render object card
        else {
            // Heading & menu
            const heading = <Heading objectID={objectID} subobjectID={subobjectID} updateCallback={updateCallback} 
                setIsMouseOverDraggable={this.setIsMouseOverDraggable} ref={this.headingRef}/>;
            const menu = isExpanded && <CardMenu objectID={objectID} subobjectID={subobjectID} updateCallback={updateCallback} 
                isResetDialogDisplayed={isResetDialogDisplayed} setIsResetDialogDisplayed={this.setIsResetDialogDisplayed} />;

            // Card body
            const body = 
                isResetDialogDisplayed ? <ResetSubobjectDialog objectID={objectID} subobjectID={subobjectID} updateCallback={updateCallback} 
                                            setIsResetDialogDisplayed={this.setIsResetDialogDisplayed} />
                : isExpanded ? 
                (
                    isSubobjectDeleted ? <DeletedPlaceholder />
                    : selectedTab === 0 ? <CardGeneralTab subobjectID={subobjectID} />
                    : selectedTab === 1 ? <CardDataTab subobjectID={subobjectID} />
                    : selectedTab === 2 ? <CardDisplayTab objectID={objectID} subobjectID={subobjectID} />
                    : null
                )
                : null;
            
            // Collapse area
            const collapseArea = isExpanded && isCollapseAreaDisplayed && (
                <CardCollapseArea updateCallback={updateCallback} subobjectID={subobjectID} ref={this.headingRef} />
            );
            
            // CSS card classname
            let cardClassName = isExpanded ? "composite-subobject-card expanded" : "composite-subobject-card";
            if (isDraggedOver) cardClassName += " is-dragged-over";
            if (isDragging) cardClassName += " is-dragged";

            result = (
                <div className={cardClassName} id={subobjectID}>
                    {heading}
                    {menu}
                    {body}
                    {collapseArea}
                </div>
            );
        }

        // Disable dragging if not hovering over component's heading (except for expand/collapse toggle)
        result = connectDropTarget(result);
        if (this.state.isMouseOverDraggable || isDraggable) result = connectDragSource(result);
        
        // Add on resize event handling (NOTE: placing wrapper before DnD connectors requires an additional <div> element above wrapper)
        return (
            <OnResizeWrapper callback={this.onResizeCallback}>
                {result}
            </OnResizeWrapper>
        );
    }
}


// Drag & drop specifications, collecting functions and wrapping
const dragSourceSpec = {
    beginDrag: props => {
        return { objectID: props.objectID, subobjectID: props.subobjectID };
    },
    endDrag: (props, monitor, component) => {
        if (!monitor.didDrop()) return;
        
        const { subobjectID, newColumn, newRow, isDroppedToTheLeft, isDroppedToTheRight } = monitor.getDropResult();
        props.updateCallback({ compositeUpdate: { command: "updatePositionsOnDrop", subobjectID: props.subobjectID, dropTargetSubobjectID: subobjectID,
            newColumn, newRow, isDroppedToTheLeft, isDroppedToTheRight }});
    },
    canDrag: props => props.canDrag
};

const dragSourceCollect = (connect, monitor) => ({
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging()
});

const dropTargetSpec = {
    drop: props => ({ objectID: props.objectID, subobjectID: props.subobjectID }),
    canDrop: (props, monitor) => props.objectID === monitor.getItem().objectID
};

const dropTargetCollect = (connect, monitor) => ({
    connectDropTarget: connect.dropTarget(),
    isDraggedOver: monitor.canDrop() && monitor.isOver()
});

export const DraggableSubobjectCard = DropTarget("composite subobject", dropTargetSpec, dropTargetCollect)(DragSource("composite subobject", dragSourceSpec, dragSourceCollect)(SubobjectCard));
