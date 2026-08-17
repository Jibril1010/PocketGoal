import { NavLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { supabase } from "../lib/supabase";
import type { BattleState } from "../lib/types";

export function NavBar() {
  const { data: profile } = useQuery({
    queryKey: ["battleState", "navbar"],
    queryFn: () => api.get<BattleState>("/battle/state").then((s) => s.profile),
    retry: false,
  });

  return (
    <nav className="navbar">
      <span className="brand">Pocket Goals</span>
      <NavLink to="/" end>
        Home
      </NavLink>
      <NavLink to="/goals">Goals</NavLink>
      <NavLink to="/battle">Battle</NavLink>
      <NavLink to="/shop">Shop</NavLink>
      <NavLink to="/profile">Profile</NavLink>
      <span className="spacer" />
      {profile && (
        <>
          <span className="stat-pill">Lv {profile.level}</span>
          <span className="stat-pill">🪙 {profile.coins}</span>
        </>
      )}
      <button className="secondary" onClick={() => supabase.auth.signOut()}>
        Sign out
      </button>
    </nav>
  );
}
