import React from "react";
import { useSelector } from "react-redux";
import { Header } from "semantic-ui-react";


/**
 * Object view description.
 */
export const ObjectDescription = ({ objectID, isSubobject = false }) => {
    /*
    TODO
    - hide description is display property is not set;
    - separate hide checks for subobjcets;
    */
    const text = useSelector(state => state.objects[objectID].object_description);


    return text.length > 0 && (
        <div className="objects-view-description">
            <pre>
                {text}
            </pre>
        </div>
    );
};
