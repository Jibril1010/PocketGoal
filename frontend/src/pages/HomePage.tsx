import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { EquippedMove, Move, OwnedCharacter, Profile } from "../lib/types";
import { useDraggableSprite } from "../hooks/useDraggableSprite";
import { PokemonSelect } from "../components/PokemonSelect";

function frontSprite(owned: OwnedCharacter): string | undefined {
  return (owned.characters.character_sprites.find((s) => s.slot === 1) ?? owned.characters.character_sprites[0])
    ?.image_url;
}

function SpriteItem({
  owned,
  containerRef,
}: {
  owned: OwnedCharacter;
  containerRef: React.RefObject<HTMLElement>;
}) {
  const queryClient = useQueryClient();
  const savePosition = useMutation({
    mutationFn: (pos: { x: number; y: number }) =>
      api.post("/homescreen/position", { userCharacterId: owned.id, posX: pos.x, posY: pos.y }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mine"] }),
  });

  const { pos, dragging, onPointerDown } = useDraggableSprite(
    containerRef,
    { x: owned.pos_x, y: owned.pos_y },
    (finalPos) => savePosition.mutate(finalPos),
  );

  const sprite = owned.characters.character_sprites.find((s) => s.slot === 1) ?? owned.characters.character_sprites[0];

  return (
    <div
      className={`homescreen-sprite${dragging ? " dragging" : ""}`}
      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
      onPointerDown={onPointerDown}
    >
      {sprite && <img src={sprite.image_url} alt={owned.characters.name} draggable={false} />}
      <span className="label">
        {owned.is_main ? "★ " : ""}
        {owned.characters.name}
      </span>
    </div>
  );
}

function BattleSetupCard({ owned }: { owned: OwnedCharacter[] }) {
  const queryClient = useQueryClient();
  const main = owned.find((o) => o.is_main);

  const setMain = useMutation({
    mutationFn: (userCharacterId: string) => api.post("/characters/main", { userCharacterId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mine"] });
      queryClient.invalidateQueries({ queryKey: ["battleState"] });
      queryClient.invalidateQueries({ queryKey: ["battleState", "navbar"] });
      queryClient.invalidateQueries({ queryKey: ["moveset", main?.characters.id] });
    },
  });

  const { data: availableMoves } = useQuery({
    queryKey: ["availableMoves"],
    queryFn: () => api.get<Move[]>("/battle/available-moves"),
  });

  const { data: moveset } = useQuery({
    queryKey: ["moveset", main?.characters.id],
    queryFn: () => api.get<EquippedMove[]>(`/battle/moveset/${main!.characters.id}`),
    enabled: !!main,
  });

  const equip = useMutation({
    mutationFn: (vars: { moveId: string; slot: number }) =>
      api.post("/battle/equip", { characterId: main!.characters.id, moveId: vars.moveId, slot: vars.slot }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["moveset", main?.characters.id] }),
  });

  return (
    <div className="card">
      <h3>Battle Setup</h3>
      <p className="meta">Choose which Pokémon fights for you, and its move loadout — each Pokémon remembers its own.</p>

      <div style={{ marginBottom: 14 }}>
        <PokemonSelect
          value={main?.id ?? ""}
          onChange={(id) => setMain.mutate(id)}
          disabled={setMain.isPending}
          options={owned.map((o) => ({
            id: o.id,
            name: o.characters.name,
            spriteUrl: frontSprite(o),
            badge: o.is_main ? "Active" : undefined,
          }))}
        />
      </div>

      {main && (
        <div className="move-grid">
          {[1, 2, 3, 4].map((slot) => {
            const equipped = moveset?.find((m) => m.slot === slot);
            return (
              <select
                key={slot}
                className="move-button"
                value={equipped?.move.id ?? ""}
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
          })}
        </div>
      )}
    </div>
  );
}

function ManageBoardCard({ owned }: { owned: OwnedCharacter[] }) {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState(owned[0]?.id ?? "");
  const selected = owned.find((o) => o.id === selectedId) ?? owned[0];

  const toggle = useMutation({
    mutationFn: (vars: { id: string; onHomescreen: boolean }) =>
      api.post("/homescreen/toggle", { userCharacterId: vars.id, onHomescreen: vars.onHomescreen }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mine"] }),
  });

  if (!selected) return null;

  return (
    <div className="card">
      <h3>Manage board</h3>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <PokemonSelect
            value={selectedId}
            onChange={setSelectedId}
            options={owned.map((o) => ({
              id: o.id,
              name: o.characters.name,
              spriteUrl: frontSprite(o),
              badge: o.is_on_homescreen ? "On board" : "Off board",
            }))}
          />
        </div>
        <button
          className={selected.is_on_homescreen ? "secondary" : ""}
          onClick={() => toggle.mutate({ id: selected.id, onHomescreen: !selected.is_on_homescreen })}
          disabled={toggle.isPending}
        >
          {selected.is_on_homescreen ? "Remove from board" : "Add to board"}
        </button>
      </div>
    </div>
  );
}

export function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: owned, isLoading } = useQuery({
    queryKey: ["mine"],
    queryFn: () => api.get<OwnedCharacter[]>("/characters/mine"),
  });

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => api.get<Profile>("/profile"),
  });

  if (isLoading) return <p>Loading home screen…</p>;

  const visible = (owned ?? []).filter((o) => o.is_on_homescreen);

  return (
    <div>
      <h1>Home</h1>
      <p style={{ color: "#9a9cc0" }}>Drag your sprites anywhere on the board.</p>
      <div
        className="homescreen-canvas"
        ref={containerRef}
        style={
          profile?.background_url
            ? { backgroundImage: `url(${profile.background_url})`, backgroundSize: "cover", backgroundPosition: "center" }
            : undefined
        }
      >
        {visible.map((o) => (
          <SpriteItem key={o.id} owned={o} containerRef={containerRef} />
        ))}
      </div>

      {owned && owned.length > 0 && <BattleSetupCard owned={owned} />}
      {owned && owned.length > 0 && <ManageBoardCard owned={owned} />}
    </div>
  );
}
