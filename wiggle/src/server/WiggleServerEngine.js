"use strict";

import { ServerEngine } from "@rtsdk/lance-topia";
import { debounce } from "throttle-debounce";
import url from "url";
import Wiggle from "../common/Wiggle";
import Food from "../common/Food";
import { VisitorInfo, Stats } from "../rtsdk";
import { updateInAppLeaderboard } from "../rtsdk/leaderboard";
const nameGenerator = require("./NameGenerator");

export default class WiggleServerEngine extends ServerEngine {
  constructor(io, gameEngine, inputOptions) {
    super(io, gameEngine, inputOptions);
    this.gameEngine.on("postStep", this.stepLogic.bind(this));
    // this.scoreData = {};
    // this.aiTracker = {}; // Add AI when person is first to enter room.  Remove when last to leave.
    // this.foodTracker = {}; // Add food when person is first to enter room.  Remove when last to leave.
    // this.roomTracker = {}; // Used to generate room the first time someone comes into it.
    this.roomPopulation = {};
    this.leaderboardAllTimeByRoom = {};
    // this.debounceLeaderboard = debounce(
    //   500,
    //   (leaderboardArray, req, username) => {
    //     console.log(`${username} updating leaderboard`, leaderboardArray);
    //     updateInAppLeaderboard({ leaderboardArray, req });
    //     // Leaderboard.update({ leaderboardArray, req });
    //   },
    //   { atBegin: true },
    // );
  }

  // create food and AI robots
  start() {
    super.start();
    // this.generateRoom();
  }

  addAI(roomName) {
    let newAI = new Wiggle(this.gameEngine, null, {
      position: this.gameEngine.randPos(),
    });
    newAI.AI = true;
    newAI.direction = 0;
    newAI.turnDirection = 1;
    newAI.bodyLength = this.gameEngine.startBodyLength;
    newAI.playerId = 0;
    newAI.score = 0;
    newAI.foodEaten = 0;
    newAI.name = nameGenerator("general") + "Bot";
    newAI.roomName = roomName;
    this.gameEngine.addObjectToWorld(newAI);
    this.assignObjectToRoom(newAI, roomName);
  }

  addFood(roomName) {
    let newF = new Food(this.gameEngine, null, {
      position: this.gameEngine.randPos(),
    });
    newF.roomName = roomName;
    this.gameEngine.addObjectToWorld(newF);
    this.assignObjectToRoom(newF, roomName);
  }

  generateRoom(roomName) {
    // console.log("Generating room", roomName);
    for (let f = 0; f < this.gameEngine.foodCount; f++) this.addFood(roomName);
    for (let ai = 0; ai < this.gameEngine.aiCount; ai++) this.addAI(roomName);
  }

  destroyRoom(roomName) {
    // console.log("Destroying room");
    let wiggles = this.gameEngine.world.queryObjects({ instanceType: Wiggle });
    let foodObjects = this.gameEngine.world.queryObjects({
      instanceType: Food,
    });

    for (let w of wiggles) {
      if (w.roomName === roomName) {
        if (!(w.id in this.gameEngine.world.objects)) return;
        this.gameEngine.removeObjectFromWorld(w.id);
      }
    }

    for (let f of foodObjects) {
      if (f.roomName === roomName) {
        if (!(f.id in this.gameEngine.world.objects)) return;
        this.gameEngine.removeObjectFromWorld(f.id);
      }
    }
    delete this.rooms[roomName];
  }

  onPlayerConnected(socket) {
    super.onPlayerConnected(socket);
    this.joinRoom(socket);
  }

  async joinRoom(socket) {
    const URL = socket.handshake.headers.referer;
    const parts = url.parse(URL, true);
    const query = parts.query;
    // const { assetId, urlSlug } = query;
    const req = { body: query }; // Used for interactive assets

    socket.on("requestLeaderboard", async (roomName) => {
      if (!this.leaderboardAllTimeByRoom[roomName]) {
        const leaderboardArray = await this.getLeaderboardArray(roomName);
        this.leaderboardAllTimeByRoom[roomName] = await updateInAppLeaderboard({ leaderboardArray, req });
      }

      return socket.emit("leaderboardUpdated", this.leaderboardAllTimeByRoom[roomName]);
    });

    // const gameStatus = this.gameStatus();
    // const rooms = this.rooms;
    // console.log("Game Status", gameStatus);
    // console.log("Rooms", rooms);

    // Only update leaderboard once every 5 seconds.

    const { isAdmin, roomName, username, profileId } = await VisitorInfo.getRoomAndUsername({ query });
    if (!roomName) {
      socket.emit("notinroom");
      return;
    }
    if (!this.rooms || !this.rooms[roomName]) {
      super.createRoom(roomName);
      this.generateRoom(roomName);
    }

    this.roomPopulation[roomName] = this.roomPopulation[roomName] || 0;
    this.roomPopulation[roomName]++;

    super.assignPlayerToRoom(socket.playerId, roomName);

    await VisitorInfo.updateLastVisited({ query }); // Have to do this first to make sure a data object exists on the User

    // if (isAdmin) {
    //   // TODO: Check if leaderboard or stats board is already shown and only show the appropriate
    //   socket.emit("isadmin"); // Shows admin controls on landing page
    //   socket.on("showLeaderboard", () => Leaderboard.show({ assetId, req, urlSlug }));
    //   socket.on("hideLeaderboard", () => Leaderboard.hide({ req }));

    //   socket.on("showStatsBoard", async () => {
    //     await StatsBoard.show({ assetId, req, urlSlug });
    //     setTimeout(() => this.updateStats(roomName, req), 3000);
    //   });
    //   socket.on("hideStatsBoard", () => StatsBoard.hide({ req }));
    //   // socket.on("resetLeaderboard", resetLeaderboard); // Used to reset high score.
    // }
    // this.scoreData[roomName] = this.scoreData[roomName] || {};

    if (username === -1) {
      socket.emit("error");
      return;
    }

    if (username) {
      // socket.on("updateLeaderboard", (leaderboardArray) => debounceLeaderboard(leaderboardArray, req, username));
      socket.emit("inzone");

      const makePlayerWiggle = async () => {
        let player = new Wiggle(this.gameEngine, null, {
          position: this.gameEngine.randPos(),
        });
        player.direction = 0;
        player.bodyLength = this.gameEngine.startBodyLength;
        player.playerId = socket.playerId;
        player.score = 0;
        player.foodEaten = 0;
        player.name = username;
        player.req = req;
        player.roomName = roomName;
        player.profileId = profileId;

        // player.name = nameGenerator("general");
        this.gameEngine.addObjectToWorld(player);
        this.assignObjectToRoom(player, roomName);

        await Stats.incrementStat({
          profileId,
          statKey: "games",
          incrementAmount: 1,
        });
        await this.updateStats(roomName);
      };

      socket.on("requestRestart", makePlayerWiggle);

      // this.updateScore();

      // handle client restart requests
    } else {
      // User is spectating because not in private zone
      socket.emit("spectating");
      // this.updateScore();
    }
  }

  async updateStats(roomName) {
    let wiggles = this.gameEngine.world.queryObjects({
      instanceType: Wiggle,
      roomName,
      AI: false,
    });

    const wiggleList = await Promise.all(
      wiggles.map(async (wiggle) => {
        const { profileId } = wiggle;
        const { xpPerBlock, xpPerFood, xpLevelConstant } = this.gameEngine;
        let stats = await Stats.getStats({ profileId });
        stats = stats || {};
        const { blocks, foodEaten, games } = stats;
        const blocksXP = stats && stats.blocks ? stats.blocks * xpPerBlock : 0;
        const foodEatenXP = stats && stats.foodEaten ? stats.foodEaten * xpPerFood : 0;
        const XP = blocksXP + foodEatenXP;
        stats.XP = XP.toLocaleString();
        stats.level = stats && stats.XP ? Math.floor(xpLevelConstant * Math.sqrt(XP) + 1).toString() : "1";
        stats.blocksPerGame = blocks ? (blocks / games).toFixed(1) : "-";
        stats.foodPerGame = foodEaten ? (foodEaten / games).toFixed(1) : "-";
        stats.blocks = blocks ? blocks.toLocaleString() : "-";
        stats.foodEaten = foodEaten ? foodEaten.toLocaleString() : "-";
        stats.name = wiggle.name;

        // Set Wiggle player's persistent Stats to display in frontend
        wiggle.stat_XP = stats.XP;
        wiggle.stat_level = stats.level;
        wiggle.stat_blocks = stats.blocks;
        wiggle.stat_blocksPerGame = stats.blocksPerGame;
        wiggle.stat_foodPerGame = stats.foodPerGame;

        return { id: profileId, data: stats, XP };
      }),
    );
    // const boardArray = wiggleList.sort((a, b) => {
    //   return b.XP - a.XP;
    // });

    // StatsBoard.update({ boardArray, req });

    // console.log(wiggleList);

    // for (const id in this.connectedPlayers) {
    //   const player = this.connectedPlayers[id];
    //   if (player.roomName === roomName) leaderboardArray.push(player);
    // }
    // console.log(leaderboardArray);
  }

  onPlayerDisconnected(socketId, playerId) {
    super.onPlayerDisconnected(socketId, playerId);
    let playerWiggle = this.gameEngine.world.queryObject({ playerId });
    // console.log(this.connectedPlayers)

    if (playerWiggle) {
      const { roomName } = playerWiggle;
      // console.log("Player disconnected from room", roomName);
      // this.roomTracker[roomName]--;
      // this.roomPopulation[roomName]--;
      this.gameEngine.removeObjectFromWorld(playerWiggle.id);
      // if (!this.roomPopulation[roomName] || this.roomPopulation[roomName] === 0) {
      //   this.destroyRoom(roomName);
      // }
      // if (this.roomTracker[roomName] === 0) {
      //   this.destroyRoom(roomName);
      // }
      this.updateStats(roomName);
      let wiggles = this.gameEngine.world.queryObjects({
        instanceType: Wiggle,
        roomName,
      });
      if (wiggles.length <= this.gameEngine.aiCount) this.addAI(roomName);
    }
  }

  // THis isn't working properly
  onPlayerRoomUpdate(playerId, from, to) {
    let playerWiggle = this.gameEngine.world.queryObject({ playerId });
    console.log("Player room", playerWiggle.roomName);
    console.log("Player left room", from);
    // this.roomTracker[from]--;
    // if (this.roomTracker[from] === 0) {
    //   this.destroyRoom(from);
    // }
  }

  // Eating Food:
  // increase body length, and remove the food
  wiggleEatFood(w, f) {
    if (!f) return;
    if (!(f.id in this.gameEngine.world.objects)) return;
    this.gameEngine.removeObjectFromWorld(f.id);
    w.bodyLength++;
    w.foodEaten++;
    if (!w.AI)
      Stats.incrementStat({
        profileId: w.profileId,
        statKey: "foodEaten",
        incrementAmount: 1,
      });
    if (f) this.addFood(f.roomName);
    // if (f.id % 5 === 0) {
    //   // get scores of wiggles that aren't AI in f.roomName
    //   debounceLeaderboard(leaderboardArray, req, username);
    // }
  }

  async wiggleHitWiggle(w1, w2) {
    // w2 is the winner
    if (!(w2.id in this.gameEngine.world.objects) || !(w1.id in this.gameEngine.world.objects)) return;
    if (w1.destroyed) return;
    w1.destroyed = true; // Handles race condition that happens when multiple body parts get hit

    if (!w1.AI) {
      w2.score++;
      w2.bodyLength += w1.bodyLength / 2; // Blocking other player steals more length
    } else {
      w2.bodyLength += w1.bodyLength / 4;
    }
    // console.log(Object.keys(this.gameEngine.world.objects).length);
    if (!w2.AI && !w1.AI) {
      // if (!w2.AI) {
      // Only update if both in collision are players
      const leaderboardArray = await this.getLeaderboardArray(w2.roomName);

      // this.debounceLeaderboard(leaderboardArray, w2.req, w2.name);
      Stats.incrementStat({
        profileId: w2.profileId,
        statKey: "blocks",
        incrementAmount: 1,
      });
      this.leaderboardAllTimeByRoom[w2.roomName] = await updateInAppLeaderboard({ leaderboardArray, req: w2.req });
    }
    this.wiggleDestroyed(w1);
  }

  wiggleDestroyed(w) {
    if (!(w.id in this.gameEngine.world.objects)) return;
    this.gameEngine.removeObjectFromWorld(w.id);
    let wiggles = this.gameEngine.world.queryObjects({
      instanceType: Wiggle,
      roomName: w.roomName,
    });
    if (wiggles.length <= this.gameEngine.aiCount) this.addAI(w.roomName);

    // if (w.AI && this.roomPopulation[w.roomName] < 3) this.addAI(w.roomName);
  }

  async getLeaderboardArray(roomName) {
    let wiggles = this.gameEngine.world.queryObjects({
      instanceType: Wiggle,
      roomName,
      AI: false,
    });
    let leaderboardArray = wiggles
      .map((wiggle) => {
        const data = { kills: wiggle.score, name: wiggle.name };
        return { id: wiggle.id, data };
      })
      .sort((a, b) => {
        return a.score - b.score;
      });

    // for (const id in this.connectedPlayers) {
    //   const player = this.connectedPlayers[id];
    //   if (player.roomName === roomName) leaderboardArray.push(player);
    // }
    // console.log(leaderboardArray);

    return leaderboardArray;
  }

  // Used to clean up rooms with no players and prevent movement
  getRoomsWithPlayers() {
    let roomPopulation = {};
    for (const prop in this.connectedPlayers) {
      const player = this.connectedPlayers[prop];
      roomPopulation[player.roomName] = roomPopulation[player.roomName] || 0;
      roomPopulation[player.roomName]++;
    }
    // Destroy all rooms that don't currently have players
    for (var roomName in this.roomPopulation) {
      if (!roomPopulation[roomName]) this.destroyRoom(roomName);
    }
    this.roomPopulation = roomPopulation;
  }

  stepLogic(stepObj) {
    // TODO: possibly make more efficient by only looping through active rooms with this.rooms
    // Can add roomName to queryObjects
    let wiggles = this.gameEngine.world.queryObjects({ instanceType: Wiggle });
    let foodObjects = this.gameEngine.world.queryObjects({
      instanceType: Food,
    });

    // Check room populations every 500 ticks to prevent game logic in rooms that have no players
    if (stepObj.step % 500 === 0) {
      this.getRoomsWithPlayers();
    }

    for (let w of wiggles) {
      // Skip if that room doesn't have anyone in it
      if (!this.roomPopulation[w.roomName] || !this.rooms[w.roomName]) {
        // console.log("Nobody in room, skipping", w.roomName);
        continue;
      }

      // if (!this.roomTracker[w.roomName] || this.roomTracker[w.roomName] === 0) continue;
      // check for collision
      for (let w2 of wiggles) {
        if (w === w2 || w.roomName !== w2.roomName) continue; // Don't have collision if in different rooms

        for (let i = 0; i < w2.bodyParts.length; i++) {
          let distance = w2.bodyParts[i].clone().subtract(w.position);
          if (distance.length() < this.gameEngine.collideDistance) {
            this.wiggleHitWiggle(w, w2);
            continue;
          }
        }
      }

      // check for food-eating
      for (let f of foodObjects) {
        if (w.roomName !== f.roomName) continue;
        let distance = w.position.clone().subtract(f.position);
        if (distance.length() < this.gameEngine.eatDistance) {
          this.wiggleEatFood(w, f);
        }
      }

      // Slowly (and somewhat randomly) reduce length to prevent just sitting and hiding
      if (Math.random() < 0.02) {
        w.bodyLength -= w.bodyLength * this.gameEngine.hungerTick;
        if (w.bodyLength < 1) this.wiggleDestroyed(w);
      }

      // move AI wiggles
      if (w.AI) {
        if (Math.random() < 0.01) w.turnDirection *= -1;
        w.direction += (w.turnDirection * (Math.random() - 0.9)) / 20;
        if (w.position.y >= this.gameEngine.spaceHeight / 2) w.direction = -Math.PI / 2;
        if (w.position.y <= -this.gameEngine.spaceHeight / 2) w.direction = Math.PI / 2;
        if (w.position.x >= this.gameEngine.spaceWidth / 2) w.direction = Math.PI;
        if (w.position.x <= -this.gameEngine.spaceWidth / 2) w.direction = 0;
        if (w.direction > Math.PI * 2) w.direction -= Math.PI * 2;
        if (w.direction < 0) w.direction += Math.PI * 2;
      }
    }
  }
}
