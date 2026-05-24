import { createClient } from "@supabase/supabase-js";
import { generateGameId } from "../utils/helpers";

const supabaseUrl = "https://xnqdkqosssgzasbdzhzm.supabase.co";
const supabaseKey = "sb_publishable_0BpVns8iwgqSf8qlKb3ZEg_Bgkiufpq";

export const supabase = createClient(supabaseUrl, supabaseKey);

export const GameService = {
  async createGame(playerId, colorChoice = "w") {
    const id = generateGameId();
    const actualColor = colorChoice === "r"
      ? (Math.random() > 0.5 ? "w" : "b")
      : colorChoice;

    const { data, error } = await supabase.from("games").insert({
      id,
      fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      turn: "w",
      status: "waiting",
      white_player: actualColor === "w" ? playerId : null,
      black_player: actualColor === "b" ? playerId : null,
    }).select().single();

    if (error) throw error;
    return { ...data, myColor: actualColor };
  },

  async joinGame(gameId, playerId) {
    const { data, error } = await supabase
      .from("games").select("*").eq("id", gameId).single();

    if (error || !data) throw new Error("Game not found");
    if (data.status === "finished") throw new Error("Game already finished");

    const myColor = !data.white_player ? "w" : "b";
    await supabase.from("games").update({
      status: "playing",
      white_player: myColor === "w" ? playerId : data.white_player,
      black_player: myColor === "b" ? playerId : data.black_player,
    }).eq("id", gameId);

    return { ...data, myColor };
  },

  async rejoinGame(gameId, playerId) {
    const { data, error } = await supabase
      .from("games").select("*").eq("id", gameId).single();

    if (error || !data) throw new Error("Game not found");

    let myColor = null;
    if (data.white_player === playerId) myColor = "w";
    else if (data.black_player === playerId) myColor = "b";
    else throw new Error("You are not part of this game");

    return { ...data, myColor };
  },

  async updateGame(gameId, fen, turn) {
    const { error } = await supabase.from("games").update({
      fen, turn, status: "playing",
    }).eq("id", gameId);
    if (error) throw error;
  },

  async finishGame(gameId) {
    await supabase.from("games").update({ status: "finished" }).eq("id", gameId);
  },

  subscribeToGame(gameId, callback) {
    const channelName = `game-${gameId}-${Date.now()}`;
    return supabase.channel(channelName)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "games",
        filter: `id=eq.${gameId}`,
      }, (payload) => callback(payload.new))
      .subscribe();
  },

  unsubscribe(channel) {
    if (channel) {
      supabase.removeChannel(channel).catch(() => {});
    }
  },
};