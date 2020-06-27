/*
    Utility functions for working with state.
*/
export function getTagsPaginationCacheKey(itemsPerPage, sortField, sortOrder, filterText) {
    return `${itemsPerPage}|${sortField}|${sortOrder}|${filterText}`;
}