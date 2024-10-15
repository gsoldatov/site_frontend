import { RouteHandler } from "../route-handler";


export class SettingsRouteHandlers {
    constructor(backend) {
        this.backend = backend;

        this.view = new RouteHandler(backend, {
            route: "/settings/view", method: "POST",
            getResponse: requestContext => {
                const { view_all, setting_names } = requestContext.body;

                let settings = this.backend.data.settings();
                if (setting_names) {
                    // Filter returned settings to exclude not fetched
                    settings = Object.keys(setting_names).reduce((result, settingName) => {
                        result[settingName] = settings[settingName]
                        return result;
                    }, {});
                }

                return { status: 200, body: { settings }};
            }
        });
    }
}
