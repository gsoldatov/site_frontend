import React from "react";
import { Loader } from "semantic-ui-react";


/*
    Subobject card placeholder displayed when subobject data is being fetched.
*/
export const LoadingPlaceholder = () => {
    return (
        <div className="composite-subobject-card no-padding">
            <div className="composite-subobject-placeholder-container">
                <Loader active inline="centered">Loading object...</Loader>
            </div>
        </div>
    );
}