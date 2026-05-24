// This file runs Stockfish as a proper Web Worker
// It acts as a bridge between the main thread and Stockfish

importScripts("/stockfish.js");

// Forward messages from main thread to Stockfish
self.onmessage = function (e) {
  postMessage(e.data);
};