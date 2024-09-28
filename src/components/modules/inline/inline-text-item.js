import React from "react";
import { useSelector } from "react-redux";


/**
 * Inline item component, which displayed emphacised text.
 */
export const InlineTextItem = ({ text }) => {
    return (
        <span className="inline-text-item">{text}</span>
    );
};
