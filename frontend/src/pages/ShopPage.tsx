import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { BattleState, ShopResponse } from "../lib/types";

export function ShopPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"pokemon" | "moves">("pokemon");

  const { data: shop, isLoading } = useQuery({
    queryKey: ["shop"],
    queryFn: () => api.get<ShopResponse>("/shop"),
  });

  const { data: state } = useQuery({
    queryKey: ["battleState"],
    queryFn: () => api.get<BattleState>("/battle/state"),
  });

  const invalidateAfterPurchase = () => {
    queryClient.invalidateQueries({ queryKey: ["shop"] });
    queryClient.invalidateQueries({ queryKey: ["mine"] });
    queryClient.invalidateQueries({ queryKey: ["battleState"] });
    queryClient.invalidateQueries({ queryKey: ["battleState", "navbar"] });
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    queryClient.invalidateQueries({ queryKey: ["availableMoves"] });
  };

  const buyCharacter = useMutation({
    mutationFn: (characterId: string) => api.post(`/shop/buy/character/${characterId}`),
    onSuccess: invalidateAfterPurchase,
  });

  const buyMove = useMutation({
    mutationFn: (moveId: string) => api.post(`/shop/buy/move/${moveId}`),
    onSuccess: invalidateAfterPurchase,
  });

  const coins = state?.profile.coins ?? 0;

  return (
    <div>
      <h1>Shop</h1>
      <p className="meta">You have 🪙 {coins} coins.</p>

      <div className="navbar" style={{ background: "transparent", border: "none", padding: "0 0 14px", marginLeft: -4 }}>
        <button className={tab === "pokemon" ? "" : "secondary"} onClick={() => setTab("pokemon")}>
          Pokémon
        </button>
        <button className={tab === "moves" ? "" : "secondary"} onClick={() => setTab("moves")} style={{ marginLeft: 8 }}>
          Moves
        </button>
      </div>

      {isLoading && <p>Loading…</p>}

      {tab === "pokemon" && (
        <div className="shop-grid">
          {(shop?.characters ?? []).map((item) => {
            const sprite = item.character_sprites.find((s) => s.slot === 1) ?? item.character_sprites[0];
            const affordable = coins >= item.coin_cost;
            return (
              <div className="card shop-card" key={item.id}>
                {sprite && <img src={sprite.image_url} alt={item.name} />}
                <div style={{ fontWeight: 700 }}>{item.name}</div>
                <div>
                  {item.types.map((t) => (
                    <span key={t} className="type-chip">
                      {t}
                    </span>
                  ))}
                </div>
                <button
                  disabled={!affordable || buyCharacter.isPending}
                  onClick={() => buyCharacter.mutate(item.id)}
                  style={{ marginTop: 8, width: "100%" }}
                >
                  🪙 {item.coin_cost}
                </button>
              </div>
            );
          })}
          {shop && shop.characters.length === 0 && !isLoading && <p className="meta">You've unlocked every Pokémon!</p>}
        </div>
      )}

      {tab === "moves" && (
        <div className="shop-grid">
          {(shop?.moves ?? []).map((move) => {
            const affordable = coins >= move.coin_cost;
            return (
              <div className="card shop-card" key={move.id}>
                <div style={{ fontWeight: 700 }}>{move.name}</div>
                <span className="type-chip">{move.type}</span>
                <div className="meta" style={{ marginTop: 6 }}>
                  {move.base_damage} dmg · {move.daily_limit}/day
                </div>
                <button
                  disabled={!affordable || buyMove.isPending}
                  onClick={() => buyMove.mutate(move.id)}
                  style={{ marginTop: 8, width: "100%" }}
                >
                  🪙 {move.coin_cost}
                </button>
              </div>
            );
          })}
          {shop && shop.moves.length === 0 && !isLoading && <p className="meta">You've unlocked every move!</p>}
        </div>
      )}
    </div>
  );
}
