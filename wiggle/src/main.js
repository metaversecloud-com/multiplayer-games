"use strict";

import path from "path";
import express from "express";
import socketIO from "socket.io";
import { Lib } from "@rtsdk/lance-topia";
import WiggleServerEngine from "./server/WiggleServerEngine";
import WiggleGameEngine from "./common/WiggleGameEngine";

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, "../dist/index.html");
// const INDEX = path.join(__dirname, "../dist/index.ejs");

// define routes and socket
const server = express();
// server.set("view engine", "ejs");
server.get("/", function (req, res) {
  res.sendFile(INDEX);
  // res.render(INDEX, {
  //   ANALYTICS_GA: process.env.ANALYTICS_GA,
  // });
});
server.use("/", express.static(path.join(__dirname, "../dist/")));
let requestHandler = server.listen(PORT, () => console.log(`Listening on ${PORT}`));
const io = socketIO(requestHandler);

// Game Instances
// const gameEngine = new WiggleGameEngine({ traceLevel: 1 });
const gameEngine = new WiggleGameEngine({ traceLevel: Lib.Trace.TRACE_ALL });
const serverEngine = new WiggleServerEngine(io, gameEngine, {
  debug: {},
  updateRate: 2,
  fullSyncRate: 12,
  timeoutInterval: 600,
});

// start the game
serverEngine.start();
