import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { FocusTimer } from "../components/FocusTimer";
import type { Goal } from "../lib/types";

export function GoalsPage() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isDaily, setIsDaily] = useState(false);

  const { data: goals, isLoading } = useQuery({
    queryKey: ["goals"],
    queryFn: () => api.get<Goal[]>("/goals"),
  });

  const createGoal = useMutation({
    mutationFn: () => api.post<Goal>("/goals", { title, description, isDaily }),
    onSuccess: () => {
      setTitle("");
      setDescription("");
      setIsDaily(false);
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });

  const completeGoal = useMutation({
    mutationFn: (id: string) => api.post(`/goals/${id}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["battleState", "navbar"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["battleState"] });
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    createGoal.mutate();
  }

  const daily = (goals ?? []).filter((g) => g.is_daily);
  const active = (goals ?? []).filter((g) => !g.is_daily && g.status === "active");
  const completed = (goals ?? []).filter((g) => !g.is_daily && g.status === "completed");

  return (
    <div>
      <h1>Goals</h1>

      <FocusTimer />

      <form className="card" onSubmit={handleSubmit}>
        <h3>New goal</h3>
        <input placeholder="Goal title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <textarea
          placeholder="Description (optional) — helps the AI judge difficulty"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, fontSize: "0.9rem" }}>
          <input
            type="checkbox"
            style={{ width: "auto", marginBottom: 0 }}
            checked={isDaily}
            onChange={(e) => setIsDaily(e.target.checked)}
          />
          Repeat daily (resets each day, pays a flat +10 coin bonus on top of EXP)
        </label>
        <button type="submit" disabled={createGoal.isPending}>
          {createGoal.isPending ? "Scoring difficulty…" : "Add goal"}
        </button>
        {createGoal.isError && <p className="error-text">{(createGoal.error as Error).message}</p>}
      </form>

      <h3>Daily</h3>
      {daily.length === 0 && !isLoading && <p style={{ color: "#9a9cc0" }}>No daily goals yet.</p>}
      {daily.map((goal) => (
        <div className="card goal-row" key={goal.id}>
          <div>
            <div className="title">{goal.title}</div>
            {goal.description && <div className="meta">{goal.description}</div>}
            <div className="meta">
              {goal.difficulty_tier && <span className={`badge ${goal.difficulty_tier}`}>{goal.difficulty_tier}</span>}{" "}
              +{goal.exp_reward} EXP · +10 coins
            </div>
          </div>
          <button onClick={() => completeGoal.mutate(goal.id)} disabled={completeGoal.isPending || goal.completed_today}>
            {goal.completed_today ? "✓ Done today" : "Complete"}
          </button>
        </div>
      ))}

      <h3>Active</h3>
      {isLoading && <p>Loading…</p>}
      {active.length === 0 && !isLoading && <p style={{ color: "#9a9cc0" }}>No active goals yet.</p>}
      {active.map((goal) => (
        <div className="card goal-row" key={goal.id}>
          <div>
            <div className="title">{goal.title}</div>
            {goal.description && <div className="meta">{goal.description}</div>}
            <div className="meta">
              {goal.difficulty_tier && <span className={`badge ${goal.difficulty_tier}`}>{goal.difficulty_tier}</span>}{" "}
              +{goal.exp_reward} EXP
            </div>
          </div>
          <button onClick={() => completeGoal.mutate(goal.id)} disabled={completeGoal.isPending}>
            Complete
          </button>
        </div>
      ))}

      {completed.length > 0 && (
        <>
          <h3>Completed</h3>
          {completed.map((goal) => (
            <div className="card goal-row" key={goal.id} style={{ opacity: 0.6 }}>
              <div>
                <div className="title">{goal.title}</div>
                <div className="meta">
                  {goal.difficulty_tier && <span className={`badge ${goal.difficulty_tier}`}>{goal.difficulty_tier}</span>}{" "}
                  +{goal.exp_reward} EXP
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
