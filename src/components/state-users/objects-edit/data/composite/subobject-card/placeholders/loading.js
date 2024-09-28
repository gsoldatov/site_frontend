import React from "react";
import { Loader } from "semantic-ui-react";


/**
 * Subobject card placeholder displayed when subobject data is being fetched.
 */
export const LoadingPlaceholder = () => {
    return (    // outer <div> is added in <SubobjectCard> component to avoid error caused by passing a component to React DND connector.
        // <div className="composite-subobject-card no-padding">
            <Loader active inline="centered">Loading object...</Loader>
        // </div>
    );
}