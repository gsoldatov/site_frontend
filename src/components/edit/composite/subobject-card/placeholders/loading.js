import React from "react";
import { Loader } from "semantic-ui-react";


/*
    Subobject card placeholder displayed when subobject data is being fetched.
*/
export const LoadingPlaceholder = () => {
    return (
        <div className="composite-subobject-card no-padding">
            <Loader active inline="centered">Loading object...</Loader>
        </div>
    );
}