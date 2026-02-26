import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/globals.css";
import "leaflet/dist/leaflet.css";
import { Workbox } from "workbox-window";

if ("serviceWorker" in navigator) {
    const wb = new Workbox("/sw.js");
    wb.register();
}
ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>

            <App />

    </React.StrictMode>
);
