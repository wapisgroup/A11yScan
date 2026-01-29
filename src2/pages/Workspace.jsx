// src/pages/Workspace.jsx
import React from "react";
import { Link, Routes, Route, Navigate } from "react-router-dom";
import Nav from "../components/Nav";
import Dashboard from "./Dashboard";
import Projects from "./Projects";
import Reports from "./Reports";
import ReportView from "./ReportView";
import Profile from "./Profile";
import Login from "./Login";
import Register from "./Register";
import ForgotPassword from "./ForgotPassword";
import {PrivateRoute} from "../App";
import ProjectDetail from "./ProjectDetail";
import ProjectSitemap from "./ProjectSitemap";
import PageReport from "./PageReport";
import PageViewer from "./PageViewer";
import {URL_APP_DASHBOARD, URL_APP_PROJECTS, URL_APP_REPORTS} from "../utils/urls";

export default function Workspace() {
  return (
      <div className="min-h-screen">
        <Nav />
        <div className="min-h-screen grid grid-cols-[2rem_200px_auto] ">
          <div className="lines"></div>
          <div className="p-6">
            <nav className="flex flex-col gap-8">
              <ul>
                {/* use relative links (no leading slash) so they resolve under /workspace */}
                <li>
                  <Link to={URL_APP_DASHBOARD} className="left-navigation-link">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link to={URL_APP_PROJECTS} className="left-navigation-link">
                    Projects
                  </Link>
                </li>
                <li>
                  <Link to={URL_APP_REPORTS} className="left-navigation-link">
                    Reports
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          <div className="grid grid-cols-[1rem_1fr_2rem] gap-x-2">
            <div className="lines"></div>

            <main className="px-6 pt-6">
              <Routes>
                {/* when user goes to /workspace, redirect to /workspace/dashboard */}
                <Route index element={<Navigate to="dashboard" replace />} />

                {/* child routes are relative to /workspace/ */}
                <Route path="dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="projects" element={<PrivateRoute><Projects /></PrivateRoute>} />
                <Route path="projects/:projectId" element={<PrivateRoute><ProjectDetail /></PrivateRoute>} />
                <Route path="projects/:projectId/page-report/:pageId" element={<PrivateRoute><PageReport /></PrivateRoute>} />
                <Route path="projects/:projectId/page-view/:scanId" element={<PrivateRoute><PageViewer /></PrivateRoute>} />
                <Route path="sitemap/:projectId" element={<PrivateRoute><ProjectSitemap /></PrivateRoute>} />
                <Route path="reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
                <Route path="reports/:id" element={<PrivateRoute><ReportView /></PrivateRoute>} />
                <Route path="profile" element={<PrivateRoute><Profile /></PrivateRoute>} />

                {/* fallback inside workspace */}
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </main>
            <div className="lines"></div>
          </div>
        </div>
      </div>
  );
}