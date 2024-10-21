import React, { useContext } from "react";
import { Grid, GridColumn } from "semantic-ui-react";

import { WindowWidthContext } from "../wrappers/window-width-provider";
import { Navbar } from "../../state-users/navbar/navbar";
import { ModalWindow } from "../../state-users/modal-window";

import { enumLayoutTypes } from "../../../util/enums/enum-layout-types";

import StyleLayout from "../../../styles/modules/layout.css";


/**
 * Page layout with navigation, side menu and main content (body).
 */
export const Layout = ({ sideMenu, body, layoutType = enumLayoutTypes.default }) => {
    const isStacked = useContext(WindowWidthContext) === 0;

    // Grid column numbers & widths
    const mainRowColumns = sideMenu ? 2 : 1;
    const mainColumnWidth = sideMenu ? 12 : 16;

    // Grid classnames
    const layoutTypePostfix = ` ${layoutType}`;
    const stackedClassNamePostfix = isStacked ? " stacked" : "";

    const gridClassName = "layout-grid" + layoutTypePostfix;
    const navigationRowClassName = "layout-grid-navigation-row" + layoutTypePostfix;
    const mainRowClassName = "layout-grid-main-row" + layoutTypePostfix + stackedClassNamePostfix;
    const sideMenuColumnClassName = "layout-grid-side-menu-column" + layoutTypePostfix + stackedClassNamePostfix;
    const mainContentColumnClassName = "layout-grid-main-content-column" + layoutTypePostfix + stackedClassNamePostfix;

    // Navbar props
    const usePlaceholder = layoutType === enumLayoutTypes.unlimitedWidth;
    
    // Side menu
    const sideMenuColumn = sideMenu && (
        <Grid.Column width={2} className={sideMenuColumnClassName}>
            {sideMenu}
        </Grid.Column>
    );

    return (
        <>
            <Grid stackable className={gridClassName}>
                <Grid.Row className={navigationRowClassName}>
                    <Navbar usePlaceholder={usePlaceholder} />
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
    );
};
