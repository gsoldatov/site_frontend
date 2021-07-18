/**
 * Mock getComputedStyle function for pagination tests.
 */
export const paginationGetComputedStyle = element => ({
    width: "1920px",     // return fullscreen width to properly apply fullscreen styling to pagination
    
    lineHeight: "28px"   // property is required to avoid errors in field itemlist's expand/collapse toggle display condition calculation 
});
