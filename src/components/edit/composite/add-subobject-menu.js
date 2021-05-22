import React from "react";
import { Button } from "semantic-ui-react";


/*
    Menu for adding new subobjects to a composite object.
*/
export const AddSubobjectMenu = ({ row, column, updateCallback }) => {
    const onClick = () => updateCallback({ compositeUpdate: { command: "addNew", row, column }});
    
    return (
        <div className="composite-subobject-add-menu-container">
            <Button onClick={onClick}>
                Add a New Subobject
            </Button>
        </div>
    );
};
