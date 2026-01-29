import {Navigate, Route, Routes} from "react-router-dom";
import {PrivateRoute} from "../App";

import React from "react";
import Login from "./Login";
import Register from "./Register";
import ForgotPassword from "./ForgotPassword";
import {URL_AUTH_LOGIN} from "../utils/urls";

export default function Auth() {
    return (
        <>
        <Routes>
            {/* when user goes to /workspace, redirect to /workspace/dashboard */}
            <Route index element={<Navigate to={URL_AUTH_LOGIN} replace />} />

            {/* child routes are relative to /workspace/ */}
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register/>} />
            <Route path="forgotten" element={<ForgotPassword/>} />
        </Routes>
        </>
    )
}