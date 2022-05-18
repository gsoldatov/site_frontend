import React, { useState, useMemo } from "react";
import { Grid, GridColumn } from "semantic-ui-react";

import { OnResizeWrapper } from "./on-resize-wrapper";
import { Navbar } from "./navigation/navbar";
import SideMenu from "./side-menu";

import StyleLayout from "./../../styles/layout.css";


/**
 * Page layout with navigation, side menu and main content (body).
 */
export default ({ sideMenuItems, body, className, useSideMenuPlaceholderWhenStacked = false, fullWidthMainContent = false }) => {
    // Side menu column (hide if it's stacked & no `sideMenuItems` are provided)
    const [isStacked, setIsStacked] = useState(window.innerWidth < 768);
    const onResizeCallback = useMemo(() => gridRef => {
        // const width = parseInt(getComputedStyle(gridRef).width.replace("px", ""));
        // setIsStacked(width < 768);     // 768 = SUIR @media threshold

        setIsStacked(window.innerWidth < 768);   // 768 = SUIR @media threshold
    }, []);
    const showSideMenuColumn = (!isStacked || sideMenuItems) && !fullWidthMainContent;

    // Grid classnames
    const customClassNamePostfix = className ? ` ${className}` : "";
    const stackedClassNamePostfix = isStacked ? " stacked" : "";
    const gridClassName = "layout-grid" + customClassNamePostfix;
    const navigationRowClassName = "layout-grid-navigation-row" + customClassNamePostfix;
    const mainRowClassName = "layout-grid-main-row" + customClassNamePostfix + stackedClassNamePostfix;
    const sideMenuColumnClassName = "layout-grid-side-menu-column" + customClassNamePostfix + stackedClassNamePostfix;
    const mainContentColumnClassName = "layout-grid-main-content-column" + customClassNamePostfix + stackedClassNamePostfix;
    
    // Side menu
    const sideMenuColumn = showSideMenuColumn && (
        <Grid.Column width={2} className={sideMenuColumnClassName}>
            <SideMenu items={sideMenuItems} usePlaceholderWhenStacked={useSideMenuPlaceholderWhenStacked} />
        </Grid.Column>
    );

    // Grid column numbers & widths
    const mainRowColumns = showSideMenuColumn ? 2 : 1;
    const mainColumnWidth = fullWidthMainContent || isStacked ? 16 : 12;

    return (
        <OnResizeWrapper callback={onResizeCallback}>
            <Grid stackable className={gridClassName}>
                <Grid.Row className={navigationRowClassName}>
                    <Navbar />
                </Grid.Row>
                <Grid.Row columns={mainRowColumns} className={mainRowClassName}>
                    {sideMenuColumn}
                    <GridColumn width={mainColumnWidth} className={mainContentColumnClassName}>
                        {body}
                    </GridColumn>
                </Grid.Row>
            </Grid>
        </OnResizeWrapper>
    );
};
