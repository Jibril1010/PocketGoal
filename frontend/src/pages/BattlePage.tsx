import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { hpColor, typeColor } from "../lib/typeColors";
import type { AttackResult, BattleState, BossEncounter, LevelProgress, Move } from "../lib/types";

const MIN_LEVELS_SHOWN = 12;
const LOOKAHEAD = 6;

export function BattlePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [justLost, setJustLost] = useState(false);

  const { data: state } = useQuery({
    queryKey: ["battleState"],
    queryFn: () => api.get<BattleState>("/battle/state"),
  });

  const { data: availableMoves } = useQuery({
    queryKey: ["availableMoves"],
    queryFn: () => api.get<Move[]>("/battle/available-moves"),
  });

  const { data: progress } = useQuery({
    queryKey: ["battleProgress"],
    queryFn: () => api.get<LevelProgress[]>("/battle/progress"),
  });

  const { data: encounter } = useQuery({
    queryKey: ["encounter", selectedLevel],
    queryFn: () => api.get<BossEncounter>(`/battle/levels/${selectedLevel}`),
    enabled: selectedLevel !== null,
  });

  const equip = useMutation({
    mutationFn: (vars: { moveId: string; slot: number }) =>
      api.post("/battle/equip", { characterId: state!.mainCharacter!.character_id, moveId: vars.moveId, slot: vars.slot }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["battleState"] }),
  });

  const attack = useMutation({
    mutationFn: (moveId: string) => api.post<AttackResult>("/battle/move", { levelNumber: selectedLevel, moveId }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["encounter", selectedLevel] });
      queryClient.invalidateQueries({ queryKey: ["battleState"] });
      queryClient.invalidateQueries({ queryKey: ["battleState", "navbar"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      if (result.defeated) {
        queryClient.invalidateQueries({ queryKey: ["battleProgress"] });
      }
      if (result.lost) {
        setJustLost(true);
        return;
      }
      setLog((l) =>
        [
          `You dealt ${result.damage} damage${result.stab ? " (STAB!)" : ""}${
            result.defeated ? ` — Boss defeated! +${result.coinsAwarded} coins` : ""
          }`,
          ...(result.bossDamage ? [`Boss hit back for ${result.bossDamage} damage`] : []),
          ...l,
        ].slice(0, 8),
      );
    },
  });

  if (!state) return <p>Loading battle…</p>;

  if (justLost) {
    return (
      <div className="card" style={{ textAlign: "center", padding: 40 }}>
        <h1>You were defeated…</h1>
        <p className="meta">The boss keeps the damage you've already dealt — your character's HP is fully restored for next time.</p>
        <p className="meta">Any moves you used today are still spent.</p>
        <button
          style={{ marginTop: 16 }}
          onClick={() => {
            setJustLost(false);
            setSelectedLevel(null);
            navigate("/");
          }}
        >
          Return to Home
        </button>
      </div>
    );
  }

  const highestDefeated = Math.max(0, ...(progress ?? []).filter((p) => p.status === "defeated").map((p) => p.level_number));
  const frontier = highestDefeated + 1;
  const levelsShown = Math.max(MIN_LEVELS_SHOWN, frontier + LOOKAHEAD);

  const playerSprite = state.mainCharacter
    ? (state.mainCharacter as any).characters?.character_sprites?.find((s: any) => s.slot === 3)
    : null;
  const bossSprite = encounter?.boss_character?.character_sprites.find((s) => s.slot === 1);

  return (
    <div>
      <h1>Battle</h1>

      {!state.mainCharacter && <p className="error-text">No main character found — check the database seed.</p>}

      <h3>Levels</h3>
      <div className="level-grid">
        {Array.from({ length: levelsShown }, (_, i) => i + 1).map((n) => {
          const locked = n > frontier;
          return (
            <button
              key={n}
              className={`level-cell${locked ? " locked" : ""}${selectedLevel === n ? " selected" : ""}`}
              disabled={locked}
              onClick={() => setSelectedLevel(n)}
            >
              {locked ? "🔒" : n}
            </button>
          );
        })}
      </div>

      {encounter && (
        <div className="card">
          <h3>
            Level {encounter.level_number} — {encounter.boss_character?.name ?? "Boss"}{" "}
            {encounter.status === "defeated" && "— Defeated!"}
          </h3>

          <div style={{ display: "flex", justifyContent: "space-around", alignItems: "flex-end", margin: "12px 0" }}>
            <div style={{ textAlign: "center" }}>
              {playerSprite && <img src={playerSprite.image_url} alt="Your character" style={{ width: 96, height: 96, imageRendering: "pixelated" }} />}
              <div className="meta">You</div>
              <div className="hp-bar-track" style={{ width: 140 }}>
                <div
                  className="hp-bar-fill"
                  style={{
                    width: `${(encounter.user_current_health / encounter.user_max_health) * 100}%`,
                    backgroundColor: hpColor(encounter.user_current_health, encounter.user_max_health),
                  }}
                />
              </div>
              <p className="meta">
                {encounter.user_current_health} / {encounter.user_max_health} HP
              </p>
            </div>

            <img
              src="/icons/poke.jpg"
              alt="Return to Home"
              title="Return to Home"
              className="vs-icon"
              onClick={() => navigate("/")}
              role="button"
            />

            <div style={{ textAlign: "center" }}>
              {bossSprite && <img src={bossSprite.image_url} alt={encounter.boss_character?.name} style={{ width: 96, height: 96, imageRendering: "pixelated" }} />}
              <div className="meta">{encounter.boss_character?.name}</div>
              <div className="hp-bar-track" style={{ width: 140 }}>
                <div
                  className="hp-bar-fill"
                  style={{
                    width: `${(encounter.boss_current_health / encounter.boss_max_health) * 100}%`,
                    backgroundColor: hpColor(encounter.boss_current_health, encounter.boss_max_health),
                  }}
                />
              </div>
              <p className="meta">
                {encounter.boss_current_health} / {encounter.boss_max_health} HP
              </p>
            </div>
          </div>
        </div>
      )}

      <h3>Your moves</h3>
      <div className="move-grid">
        {[1, 2, 3, 4].map((slot) => {
          const equipped = state.equippedMoves.find((e) => e.slot === slot);
          if (!equipped) {
            return (
              <select
                key={slot}
                className="move-button"
                defaultValue=""
                onChange={(e) => e.target.value && equip.mutate({ moveId: e.target.value, slot })}
              >
                <option value="">Slot {slot}: equip a move…</option>
                {(availableMoves ?? []).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.type}, {m.base_damage} dmg)
                  </option>
                ))}
              </select>
            );
          }
          const usesLeft = equipped.move.daily_limit - equipped.usesToday;
          const disabled = !encounter || encounter.status === "defeated" || usesLeft <= 0 || attack.isPending;
          return (
            <button
              key={slot}
              className="move-button"
              disabled={disabled}
              onClick={() => attack.mutate(equipped.move.id)}
            >
              <span className="move-type-tab" style={{ background: typeColor(equipped.move.type) }}>
                {equipped.move.type}
              </span>
              <span className="move-name">{equipped.move.name}</span>
              <span className="move-meta">
                <span>{equipped.move.base_damage} DMG</span>
                <span className="move-pp">
                  PP {usesLeft}/{equipped.move.daily_limit}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {(availableMoves ?? []).length === 0 && (
        <p className="meta">You don't own any moves yet — visit the Shop's Moves section.</p>
      )}

      {log.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          {log.map((entry, i) => (
            <div key={i} className="meta">
              {entry}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
