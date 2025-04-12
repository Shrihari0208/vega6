import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SearchPage from "./pages/SearchPage";
import CaptionPage from "./pages/CaptionPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="/caption" element={<CaptionPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
