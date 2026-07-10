
import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import MainLayout from "./components/Layout/MainLayout";

import Home from "./pages/Home";
import Historical from "./pages/Historical";
import Distribution from "./pages/Distribution";
import Simulator from "./pages/Simulator";
import ProbabilisticModel from "./pages/ProbabilisticModel";
import Backtesting from "./pages/Backtesting";
import Conclusions from "./pages/Conclusions";

const AppV2Page = lazy(() => import("./pages/AppV2Page"));

export default function App() {
  return (
    <Routes>
      <Route path="/v2" element={<Suspense fallback={<p>Cargando la versión 2…</p>}><AppV2Page /></Suspense>} />
      <Route path="*" element={
        <MainLayout>
          <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/historical" element={<Historical />} />
        <Route path="/distribution" element={<Distribution />} />
        <Route path="/simulator" element={<Simulator />} />
        <Route path="/model" element={<ProbabilisticModel />} />
        <Route path="/backtesting" element={<Backtesting />} />
        <Route path="/conclusions" element={<Conclusions />} />
          </Routes>
        </MainLayout>
      } />
    </Routes>
  );
}
