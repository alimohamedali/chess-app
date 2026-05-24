import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://xnqdkqosssgzasbdzhzm.supabase.co";
const supabaseKey = "sb_publishable_0BpVns8iwgqSf8qlKb3ZEg_Bgkiufpq";

export const supabase = createClient(supabaseUrl, supabaseKey);

export const GameService = {
  async createGame(playerId, colorChoice = "w") {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();

    // لو Random نختار عشوائي
    const actualColor = colorChoice === "r"
      ? (Math.random() > 0.5 ? "w" : "b")
      : colorChoice;

    const gameData = {
      id,
      fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      turn: "w",
      status: "waiting",
      white_player: actualColor === "w" ? playerId : null,
      black_player: actualColor === "b" ? playerId : null,
    };

    const { data, error } = await supabase
      .from("games")
      .insert(gameData)
      .select()
      .single();

    if (error) throw error;
    return { ...data, myColor: actualColor };
  },

  async joinGame(gameId, playerId) {
    const { data, error } = await supabase
      .from("games")
      .select("*")
      .eq("id", gameId)
      .single();

    if (error || !data) throw new Error("Game not found");
    if (data.status !== "waiting") throw new Error("Game already started");

    // لو White فاضي انضم كـ White، لو لأ انضم كـ Black
    const myColor = !data.white_player ? "w" : "b";

    const updateData = {
      status: "playing",
      white_player: myColor === "w" ? playerId : data.white_player,
      black_player: myColor === "b" ? playerId : data.black_player,
    };

    await supabase.from("games").update(updateData).eq("id", gameId);
    return { ...data, myColor };
  },

  async updateGame(gameId, fen, turn) {
    const { error } = await supabase.from("games").update({
      fen, turn, status: "playing",
    }).eq("id", gameId);
    if (error) throw error;
  },

  subscribeToGame(gameId, callback) {
    return supabase
      .channel(`game:${gameId}:${Date.now()}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "games",
        filter: `id=eq.${gameId}`,
      }, (payload) => callback(payload.new))
      .subscribe();
  },

  unsubscribe(channel) {
    if (channel) supabase.removeChannel(channel);
  },
};