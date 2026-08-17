import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useAuth } from "./lib/AuthContext";
import { MusicProvider, useMusic } from "./lib/MusicContext";
import { NavBar } from "./components/NavBar";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { HomePage } from "./pages/HomePage";
import { GoalsPage } from "./pages/GoalsPage";
import { BattlePage } from "./pages/BattlePage";
import { ShopPage } from "./pages/ShopPage";
import { ProfilePage } from "./pages/ProfilePage";

function GesturePill() {
  const { needsGesture, resumeAfterGesture, currentSong } = useMusic();
  if (!needsGesture || !currentSong) return null;
  return (
    <button
      onClick={resumeAfterGesture}
      style={{
        position: "fixed",
        bottom: 16,
        right: 16,
        zIndex: 50,
        borderRadius: 999,
        padding: "10px 16px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
      }}
    >
      🔊 Tap to play music
    </button>
  );
}

// Mounted once per authenticated session (not per page), so the music
// player and nav bar survive navigation instead of remounting.
function ProtectedLayout() {
  const { session, loading } = useAuth();

  if (loading) return <div className="app-shell">Loading…</div>;
  if (!session) return <Navigate to="/login" replace />;

  return (
    <MusicProvider>
      <div className="app-shell">
        <NavBar />
        <main>
          <Outlet />
        </main>
        <GesturePill />
      </div>
    </MusicProvider>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/battle" element={<BattlePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  );
}
