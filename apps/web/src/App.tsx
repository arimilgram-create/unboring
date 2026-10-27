import { useEffect, useState } from "react";
import UploadPage from "./pages/UploadPage";
import ProjectPage from "./pages/ProjectPage";
import GalleryPage from "./pages/GalleryPage";

// Tiny hash router: "#/" = upload, "#/p/<id>" = a project (processing or editor).
function useRoute() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const on = () => setHash(window.location.hash);
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  const m = hash.match(/^#\/p\/([a-f0-9]{12})$/);
  if (m) return { page: "project" as const, id: m[1] };
  return hash === "#/templates" ? { page: "templates" as const } : { page: "upload" as const };
}

export default function App() {
  const route = useRoute();
  return (
    <div className="app">
      <header className="topbar">
        <a href="#/" className="logo">
          Un<span>Boring</span>
        </a>
        <span className="tag">Day 3 build</span>
        <a href="#/templates" className="navlink">Templates</a>
      </header>
      {route.page === "project" ? <ProjectPage id={route.id} /> : route.page === "templates" ? <GalleryPage /> : <UploadPage />}
    </div>
  );
}
