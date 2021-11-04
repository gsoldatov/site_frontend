import React from "react";
import { useSelector } from "react-redux";
import { Header } from "semantic-ui-react";


/**
 * Object view description.
 */
export const ObjectDescription = ({ objectID }) => {
    /*
    TODO
    - hide description is display property is not set;
    */
    const text = useSelector(state => state.objects[objectID].object_description);


    return (
        <div className="objects-view-description">
            <pre>
                {text}
            </pre>
        </div>
    );
};
