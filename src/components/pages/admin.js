import React, { useMemo } from "react";
import { Tab } from "semantic-ui-react";

import { Layout } from "../modules/layout/layout";
import { SettingsTabPane } from "../page-parts/admin";

import { enumLayoutTypes } from "../../util/enums/enum-layout-types";


/**
 * Admin page component.
 */
export const AdminPage = () => {
    const tabPanes = useMemo(() => [
        {
            menuItem: "Settings",
            render: () => 
                <Tab.Pane>
                    <SettingsTabPane />
                </Tab.Pane>
        }
    ]);
    
    const body = (
        <Tab className="admin-page-tabs-container" panes={tabPanes}>
            {tabPanes}
        </Tab>
    );
    return <Layout body={body} layoutType={enumLayoutTypes.shortWidth} />;
};
