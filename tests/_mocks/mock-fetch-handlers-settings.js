function handleUpdateSettings(body) {
    return { status: 200, body: {}};
}


function handleViewSettings(body) {
    const bodyJSON = JSON.parse(body);

    const defaultSettings = {
        non_admin_registration_allowed: true
    };

    let responseBody;
    if ("view_all" in bodyJSON) responseBody = defaultSettings;
    else {
        responseBody = {};
        for (let name of bodyJSON.setting_names) responseBody[name] = defaultSettings[name];
    }

    return { status: 200, body: { settings: responseBody }};
}


export const settingsHandlersList = new Map([
    ["/settings/update", {"PUT": handleUpdateSettings}],
    ["/settings/view", {"POST": handleViewSettings}]
]);
