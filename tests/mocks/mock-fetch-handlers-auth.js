import { getMockLoginResponse } from "./data-auth";


function handleGetRegistrationStatus(body) {
    return { status: 200, body: { registration_allowed: true }};
}


function handleRegister(body) {
    return { status: 200 };
}


function handleLogin(body) {
    return { status: 200, body: getMockLoginResponse() };
}


function handleLogout(body) {
    return { status: 200 };
}


export const authHandlersList = new Map([
    ["/auth/get_registration_status", {"GET": handleGetRegistrationStatus}],
    ["/auth/register", {"POST": handleRegister}],
    ["/auth/login", {"POST": handleLogin}],
    ["/auth/logout", {"POST": handleLogout}]
]);
