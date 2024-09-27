import React, { useState, useMemo } from "react";
import { Grid, GridColumn } from "semantic-ui-react";

import { OnResizeWrapper } from "../modules/wrappers/on-resize-wrapper";
import { Navbar } from "../state-users/navbar/navbar";
import SideMenu from "./side-menu";
import { ModalWindow } from "../state-users/modal-window";

import { enumLayoutTypes } from "../../util/enum-layout-types";

import StyleLayout from "./../../styles/modules/layout.css";


/**
 * Page layout with navigation, side menu and main content (body).
 */
// export default ({ sideMenuItems, body, className, useSideMenuPlaceholderWhenStacked = false }) => {
export default ({ sideMenuItems, body, layoutType = enumLayoutTypes.default }) => {
    // Side menu column (hide if it's stacked & no `sideMenuItems` are provided)
    const [isStacked, setIsStacked] = useState(window.innerWidth < 768);
    const onResizeCallback = useMemo(() => gridRef => {
        // const width = parseInt(getComputedStyle(gridRef).width.replace("px", ""));
        // setIsStacked(width < 768);     // 768 = SUIR @media threshold

        setIsStacked(window.innerWidth < 768);   // 768 = SUIR @media threshold
    }, []);

    // Grid classnames
    const layoutTypePostfix = ` ${layoutType}`;
    const stackedClassNamePostfix = isStacked ? " stacked" : "";

    const gridClassName = "layout-grid" + layoutTypePostfix;
    const navigationRowClassName = "layout-grid-navigation-row" + layoutTypePostfix;
    const mainRowClassName = "layout-grid-main-row" + layoutTypePostfix + stackedClassNamePostfix;
    const sideMenuColumnClassName = "layout-grid-side-menu-column" + layoutTypePostfix + stackedClassNamePostfix;
    const mainContentColumnClassName = "layout-grid-main-content-column" + layoutTypePostfix + stackedClassNamePostfix;
    
    // Side menu
    const usePlaceholderWhenStacked = layoutType === enumLayoutTypes.unlimitedWidth && isStacked;   // Stacked side menu with unlimited width layout uses 'fixed` postion and requires a placeholder to not overflow main content

    const sideMenuColumn = sideMenuItems && (
        <Grid.Column width={2} className={sideMenuColumnClassName}>
            <SideMenu items={sideMenuItems} usePlaceholderWhenStacked={usePlaceholderWhenStacked} />
        </Grid.Column>
    );

    // Grid column numbers & widths
    const mainRowColumns = sideMenuColumn ? 2 : 1;
    const mainColumnWidth = sideMenuColumn ? 12 : 16;

    return (
        <OnResizeWrapper callback={onResizeCallback}>
            <>
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
                <div className="modal-container">
                    <ModalWindow />
                </div>
            </>
        </OnResizeWrapper>
    );
};
