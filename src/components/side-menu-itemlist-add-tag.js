import {addTagFetch, setRedirectOnRender } from "../actions/tag";

/*
    Side menu item definition for the add tag page.
*/
const itemList = [
    {
        itemJSX: "Save",
        getIsActive: (state) => { 
            return !state.tagUI.addTagFetch.isFetching &&
                    state.tagUI.currentTag.tag_name.length >= 1 && state.tagUI.currentTag.tag_name.length <= 255; 
        },
        onClick: addTagFetch()
    },

    {
        itemJSX: "Cancel",
        getIsActive: (state) => { return !state.tagUI.addTagFetch.isFetching; },
        onClick: setRedirectOnRender("/tags")
    }
];

export default itemList;