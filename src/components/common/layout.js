import React, { useEffect } from "react";
import { Grid, GridColumn } from "semantic-ui-react";
import { useSelector, useDispatch } from "react-redux";
import { useHistory } from "react-router-dom";

import Navigation from "./navigation";
import SideMenu from "./side-menu";

import { setRedirectOnRender } from "../../actions/common";


/**
 * Page layout with navigation, side menu and main content (body).
 */
export default ({ sideMenuItems, body }) => {
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

    return (
        <Grid celled>
            <Grid.Row>
                <Navigation />
            </Grid.Row>
            <Grid.Row columns={2}>
                <Grid.Column width={2} >
                    <SideMenu items={sideMenuItems} />
                </Grid.Column>
                <GridColumn width={12}>
                    {body}
                </GridColumn>
            </Grid.Row>
        </Grid>
    );
};
