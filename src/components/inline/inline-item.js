import React, { memo, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "semantic-ui-react";


/**
 * Basic inline item component. Displays an inline block with provided `text`, which optionally link to provided `URL`.
 * Item can be assigned with additional CSS `classname`.
 * 
 * Can also display a set of clickable icons, specified in `icons` array. 
 * Each array item should be an object with the following props:
 * - icon `name`;
 * - icon `color`;
 * - icon `title`;
 * - icon `onClick` handler.
 */
export const InlineItem = memo(({ text, URL, className, icons }) => {
    const _className = "inline-item" + (className ? ` ${className}` : "");

    // Text span
    let textSpan = <span className="inline-text" title={text}>{text}</span>
    if (URL) textSpan = <Link className="inline-text-link" to={URL}>{textSpan}</Link>;

    // Icons
    const _icons = icons && icons.map((icon, k) => {
        const { name, color, title, onClick } = icon;
        return (
            // Additional <span> tag is required to avoid propagating text decoration on the icon
            <span key={k} title={title}>
                <Icon size="small" className="inline-item-icon" name={name} color={color} onClick={onClick} />
            </span>
        )
    });

    // Result
    return (
        <span className={_className}>
            {textSpan}
            {_icons}
        </span>
    );
});

// /**
//  * Basic inline item component. Should be wrapped in a (if possible, memoized) component which passes list-specific props to it.
//  */
// export const InlineItem = ({ text, itemClassName, onClick, itemLink }) => {
//     const _itemClassName = itemClassName || "inline-item";

//     const [isHovered, setIsHovered] = useState(false);
//     const onHoverLink = isHovered && itemLink && (
//         <Link to={itemLink}>
//             <Icon size="small" className="inline-item-icon" name="chain" color="black" />
//         </Link>
//     );

//     return (
//         <span className={_itemClassName} onMouseOver={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
//             <span className="inline-text" onClick={onClick} title={text}>{text}</span>
//             {onHoverLink}
//         </span>
//     );
// };
