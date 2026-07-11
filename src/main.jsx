import React from "react";
import ReactDOM from "react-dom/client";
import AppV2 from "./v2/AppV2";
import { registerServiceWorker } from "./pwa/registerServiceWorker.js";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppV2 />
  </React.StrictMode>
);

registerServiceWorker();
