import { editTagOnSaveFetch, setRedirectOnRender } from "../actions/tag";
import { isFetchingTag } from "../store/state-check-functions";

/*
    Side menu item definition for the edit tag page.
*/
const itemList = [
    {
        itemJSX: "Save",
        getIsActive: (state) => { 
            return !isFetchingTag(state) &&
                    state.tagUI.currentTag.tag_name.length >= 1 && state.tagUI.currentTag.tag_name.length <= 255; 
        },
        onClick: editTagOnSaveFetch()
        // onClick: () => console.log("Clicked save button")
    },

    {
        itemJSX: "Cancel",
        getIsActive: (state) => { return !isFetchingTag(state); },
        onClick: setRedirectOnRender("/tags")
    }
];

export default itemList;