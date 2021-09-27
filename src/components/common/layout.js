import React, { useState, useEffect, useMemo } from "react";
import { Grid, GridColumn } from "semantic-ui-react";
import { useSelector, useDispatch } from "react-redux";
import { useHistory } from "react-router-dom";

import { OnResizeWrapper } from "./on-resize-wrapper";
import Navigation from "./navigation";
import SideMenu from "./side-menu";

import { setRedirectOnRender } from "../../actions/common";


/**
 * Page layout with navigation, side menu and main content (body).
 */
export default ({ sideMenuItems, body, className, navigationBarItemOnClickcallback }) => {
    const dispatch = useDispatch();
    const redirectOnRender = useSelector(state => state.redirectOnRender);
    const history = useHistory();

    // Redirect if path is specified in state
    useEffect(() => {
        if (redirectOnRender) {
            history.push(redirectOnRender);
            dispatch(setRedirectOnRender(""));
        }
    }, [redirectOnRender]);

    // Side menu column (hide if it's stacked & no `sideMenuItems` are provided)
    const [isStacked, setIsStacked] = useState(window.innerWidth < 768);
    const onResizeCallback = useMemo(() => computedStyle => {
        const width = parseInt(computedStyle.width.replace("px", ""));
        setIsStacked(width < 768);     // 768 = SUIR @media threshold
    });
    const showSideMenuColumn = !isStacked || sideMenuItems;
    
    // Side menu column classname (add an additional classname if side menu is stacked)
    let sideMenuColumnClassName = isStacked ? "stacked-side-menu-column" : "";
    sideMenuColumnClassName += className 
        ? (sideMenuColumnClassName.length > 0 ? " " : "") + className
        : "";
    const sideMenuColumn = showSideMenuColumn && (
        <Grid.Column width={2} className={sideMenuColumnClassName}>
            <SideMenu items={sideMenuItems} />
        </Grid.Column>
    );
    const mainRowColumns = showSideMenuColumn ? 2 : 1;
    const mainColumnWidth = isStacked ? 16 : 12;

    return (
        <OnResizeWrapper callback={onResizeCallback}>
            <Grid stackable celled className={className}>
                <Grid.Row className={className}>
                    <Navigation itemOnClickCallback={navigationBarItemOnClickcallback} />
                </Grid.Row>
                <Grid.Row columns={mainRowColumns} className={className}>
                    {sideMenuColumn}
                    <GridColumn width={mainColumnWidth} className={className}>
                        {body}
                    </GridColumn>
                </Grid.Row>
            </Grid>
        </OnResizeWrapper>
    );
};
