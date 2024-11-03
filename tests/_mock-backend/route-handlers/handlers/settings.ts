import { z } from "zod";

import { RouteHandler } from "../route-handler";

import type { MockBackend } from "../../mock-backend";
import type { Settings, SettingsNames } from "../../../_mock-data/modules/settings";

const settingsViewBody = z.object({ view_all: z.boolean() }).or(
    z.object({ setting_names: z.string().array().min(1) })
);


export class SettingsRouteHandlers {
    [index: string]: RouteHandler | MockBackend
    private backend: MockBackend
    view: RouteHandler

    constructor(backend: MockBackend) {
        this.backend = backend;

        this.view = new RouteHandler(backend, {
            route: "/settings/view", method: "POST",
            getResponse: requestContext => {
                const body = settingsViewBody.parse(requestContext.body);

                let settings: Partial<Settings> = this.backend.data.settings();
                if ("setting_names" in body) {
                    // Filter returned settings to exclude not fetched
                    const setting_names = body.setting_names as SettingsNames[];
                    settings = setting_names.reduce((result: Partial<Settings>, settingName): Partial<Settings> => {
                        if (settingName in settings) result[settingName] = settings[settingName];
                        return result;
                    }, {});
                }

                return { status: 200, body: { settings }};
            }
        });
    }
}
