import { UPDATE_OBJECTS_DATA } from "../actions/data-objects";
import { deepMerge } from "../util/copy";


const updateObjectsData = (state, action) => {
    const { objectData } = action;
    let newLinks = {}, newMarkdown = {}, newTDL = {}, newComposite = {};

    objectData.forEach(data => {
        const { object_id, object_type, object_data } = data;
        if (object_type === "link") newLinks[object_id] = deepMerge(state.links[object_id], object_data);
        else if (object_type === "markdown") newMarkdown[object_id] = deepMerge(state.markdown[object_id], object_data);
        else if (object_type === "to_do_list") newTDL[object_id] = deepMerge(state.toDoLists[object_id], object_data);
        else if (object_type === "composite") newComposite[object_id] = deepMerge(state.composite[object_id], object_data);
        else throw Error("Not implemented");
    });

    return {
        ...state,
        links: { ...state.links, ...newLinks },
        markdown: { ...state.markdown, ...newMarkdown },
        toDoLists: { ...state.toDoLists, ...newTDL },
        composite: { ...state.composite, ...newComposite }
    };
};


const root = {
    UPDATE_OBJECTS_DATA: updateObjectsData
};

export default root;
