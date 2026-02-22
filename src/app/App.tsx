import { Navigate, Route, Routes } from "react-router-dom";

import { LevelPage } from "@/pages/LevelPage";
import { ModeSelectPage } from "@/pages/ModeSelectPage";
import { PlayPage } from "@/pages/PlayPage";
import { ResultsPage } from "@/pages/ResultsPage";
import { SummaryPage } from "@/pages/SummaryPage";

export function App(): JSX.Element {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-bg-app px-screenX pb-8 pt-4">
      <Routes>
        <Route element={<ModeSelectPage />} path="/modes" />
        <Route element={<PlayPage />} path="/play/:modeId" />
        <Route element={<SummaryPage />} path="/summary" />
        <Route element={<ResultsPage />} path="/results" />
        <Route element={<LevelPage />} path="/level" />
        <Route element={<Navigate replace to="/modes" />} path="*" />
      </Routes>
    </div>
  );
}
