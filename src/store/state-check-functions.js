/*
    Utility functions for checking current state
*/

/* ********************************************************** */
/*                          TAG PAGE                          */
/* ********************************************************** */
/* Returns true if any of tag page fetches are being performed. */
export function isFetchingTag(state) {
    return state.tagUI.tagOnLoadFetch.isFetching || state.tagUI.tagOnSaveFetch.isFetching;
};

/* Returns true if any of tag page fetches are being performed or a confirmation dialog is being displayed. */
export function isFetchinOrShowingDialogTag(state) {
    return isFetchingTag(state) || state.tagUI.showDeleteDialog;
}

/* Returns true if currentTag's tag_name is already taken by another tag, which is present in the local storage. */
export function checkIfCurrentTagNameExists(state) {
    let tags = state.tags;
    let currentTagNameLowered = state.tagUI.currentTag.tag_name.toLowerCase();

    for (let i in tags) {
        if (currentTagNameLowered === tags[i].tag_name.toLowerCase() && state.tagUI.currentTag.tag_id !== tags[i].tag_id) {
            return true;
        }
    }

    return false;
};


/* *********************************************************** */
/*                          TAGS PAGE                          */
/* *********************************************************** */
/* Returns true if any of tags page fetches are being performed. */
export function isFetchingTags(state) {
    return state.tagsUI.fetch.isFetching
};

/* Returns true if any of tags page fetches are being performed or a confirmation dialog is being displayed. */
export function isFetchinOrShowingDialogTags(state) {
    return isFetchingTags(state) || state.tagsUI.showDeleteDialog;
}


/* ********************************************************** */
/*                        OBJECT PAGE                         */
/* ********************************************************** */
/* Returns true if any of object page fetches are being performed. */
export function isFetchingObject(state) {
    return state.objectUI.objectOnLoadFetch.isFetching || state.objectUI.objectOnSaveFetch.isFetching;
};

/* Returns true if any of object page fetches are being performed or a confirmation dialog is being displayed. */
export function isFetchinOrShowingDialogObject(state) {
    return isFetchingObject(state) || state.objectUI.showDeleteDialog;
}

/* Returns true if currentObject's object_name is already taken by another object, which is present in the local storage. */
export function checkIfCurrentObjectNameExists(state) {
    let objects = state.objects;
    let currentObjectNameLowered = state.objectUI.currentObject.object_name.toLowerCase();

    for (let i in objects) {
        if (currentObjectNameLowered === objects[i].object_name.toLowerCase() && state.objectUI.currentObject.object_id !== objects[i].object_id) {
            return true;
        }
    }

    return false;
};

/* Returns true is current object's data is valid or throws an Error if not */
export function validateCurrentObject(state) {
    const obj = state.objectUI.currentObject;
    
    if (obj.object_name.length === 0) throw Error("Object name is required.");
    if (checkIfCurrentObjectNameExists(state)) throw Error("Object name already exists.");

    switch (obj.object_type) {
        case "link":
            if(obj.link.length === 0) throw Error("Link value is required.");
            break;
        case "markdown":
            if(obj.markdown.raw_text.length === 0) throw Error("Markdown text is required.");
            break;
        default:
            break;
    }

    return true;
};


/* *********************************************************** */
/*                        OBJECTS PAGE                         */
/* *********************************************************** */
/* Returns true if object page fetch is being performed. */
export function isFetchingObjects(state) {
    return state.objectsUI.fetch.isFetching
};

/* Returns true if object page fetch is being performed or a confirmation dialog is being displayed. */
export function isFetchinOrShowingDialogObjects(state) {
    return isFetchingObjects(state) || state.objectsUI.showDeleteDialog;
}

/* Returns true if there are currently added or removed tags in objectsUI state */
export function isObjectsTagsEditActive(state) {
    return state.objectsUI.addedTags.length > 0 || state.objectsUI.removedTagIDs.length > 0;
}
