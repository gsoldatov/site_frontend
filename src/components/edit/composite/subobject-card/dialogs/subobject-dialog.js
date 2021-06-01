import React from "react";
import { Button, Header } from "semantic-ui-react";


/* 
    Basic dialog component displayed instead of subobject card tabs.
*/
export const SubobjectDialog = ({ header, yesCallback, noCallback }) => {

    return (
        <div className="subobject-card-dialog-container">
            <Header as="h5" textAlign="center" className="subobject-card-dialog-header">{header}</Header>
            <div className="subobject-card-dialog-button-container">
                <Button className="subobject-card-dialog-button" color="blue" onClick={yesCallback}>Yes</Button>
                <Button className="subobject-card-dialog-button" onClick={noCallback}>No</Button>
            </div>
        </div>
    );
};
