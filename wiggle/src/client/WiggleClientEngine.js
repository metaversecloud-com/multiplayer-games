import moment from "moment";
import { ClientEngine } from "@rtsdk/lance-topia";
import WiggleRenderer from "../client/WiggleRenderer";

function appendHtml(el, str) {
  var div = document.createElement("button"); //container to append to
  div.innerHTML = str;
  while (div.children.length > 0) {
    el.appendChild(div.children[0]);
  }
}
export default class WiggleClientEngine extends ClientEngine {
  constructor(gameEngine, options) {
    super(gameEngine, options, WiggleRenderer);

    const params = new Proxy(new URLSearchParams(window.location.search), {
      get: (searchParams, prop) => searchParams.get(prop),
    });
    this.roomName = params["assetId"];

    // show try-again button
    gameEngine.on("objectDestroyed", (obj) => {
      // this.updateLeaderboard();
      if (obj.playerId === gameEngine.playerId) {
        document.body.classList.add("lostGame");
        document.querySelector("#tryAgain").disabled = false;
        document.querySelector("#tryAgain").className = "show";

        this.socket.emit("requestLeaderboard", this.roomName);
      }
    });

    // restart game
    document.querySelector("#tryAgain").addEventListener("click", (clickEvent) => {
      // window.location.reload();
      this.socket.emit("requestRestart");
      // document.querySelector("#tryAgain").disabled = true;
      clickEvent.currentTarget.disabled = true;
      document.querySelector("#tryAgain").className = "hidden";
      document.querySelector("#leaderboardTable").className = "hidden";
      document.body.classList.remove("lostGame");
    });

    this.mouseX = null;
    this.mouseY = null;

    document.addEventListener("mousemove", this.updateMouseXY.bind(this), false);
    document.addEventListener("mouseenter", this.updateMouseXY.bind(this), false);
    document.addEventListener("touchmove", this.updateMouseXY.bind(this), false);
    document.addEventListener("touchenter", this.updateMouseXY.bind(this), false);
    this.gameEngine.on("client__preStep", this.sendMouseAngle.bind(this));
  }

  updateLeaderboard(data) {
    document.querySelector("#leaderboardBody").innerHTML = "";
    // id, score, name, date;
    console.log("Leaderboard DATA", data);
    if (!data) return;
    let leaderboardRows = "";
    for (let i = 0; i < data.length; i++) {
      if (i > 10) return;
      const date = data[i].date;
      const name = data[i].name;
      const score = data[i].score;
      const when = moment(date).fromNow();

      if (date && name && score) {
        leaderboardRows += `<tr class="leaderboardRow" id=${date}>
          <td class="leaderboardColumn1">${name}</td>
          <td class="leaderboardColumn2">${score}</td>
          <td class="leaderboardColumn3">${when}</td>
        </tr>`;
      }
    }

    document.querySelector("#leaderboardBody").innerHTML = leaderboardRows;
    document.querySelector("#leaderboardTable").className = "show";
  }

  updateMouseXY(e) {
    e.preventDefault();
    if (e.touches) e = e.touches.item(0);
    this.mouseX = e.pageX;
    this.mouseY = e.pageY;
  }

  sendMouseAngle() {
    let player = this.gameEngine.world.queryObject({ playerId: this.gameEngine.playerId });
    if (this.mouseY === null || player === null) return;

    let mouseX = (this.mouseX - document.body.clientWidth / 2) / this.zoom;
    let mouseY = (this.mouseY - document.body.clientHeight / 2) / this.zoom;
    let dx = mouseY - player.position.y;
    let dy = mouseX - player.position.x;
    if (Math.sqrt(dx * dx + dy * dy) < 0.5) {
      this.sendInput(this.gameEngine.directionStop, { movement: true });
      return;
    }

    let angle = Math.atan2(dx, dy);
    this.sendInput(angle, { movement: true });
  }

  connect() {
    return super.connect().then(() => {
      this.socket.on("leaderboardUpdated", this.updateLeaderboard);
      this.socket.emit("requestLeaderboard", this.roomName);

      this.socket.on("spectating", () => {
        console.log("spectating");
        document.querySelector("#spectating").className = "showOpaque";
        // document.querySelector("#joinGame").innerHTML = "Spectating";
      });

      this.socket.on("notinroom", () => {
        console.log("notinroom");
        // document.querySelector("#introText").innerHTML = "You can only enter a game from within a world";
        // document.querySelector("#joinGame").innerHTML =
        // "<a href=https://github.com/metaversecloud-com/multiplayer-iframe-game-example>Find me on GitHub</a>";
      });

      this.socket.on("inzone", () => {
        document.querySelector("#spectating").className = "hidden";
        // document.querySelector("#introText").innerHTML = "You are in the Game Zone. Click Join Game to play";
        // document.querySelector("#joinGame").innerHTML = "Join Game";
        document.querySelector("#joinGame").className = "show";
        document.querySelector("#joinGame").addEventListener("click", (clickEvent) => {
          this.socket.emit("requestRestart");
          document.querySelector("#joinGame").className = "hidden";
          document.querySelector("#adminControls").className = "hidden";
          document.querySelector("#instructions").className = "hidden";
          document.querySelector("#leaderboardTable").className = "hidden";
          // document.querySelector("#tryAgain").disabled = true;
          clickEvent.currentTarget.disabled = true;
        });
      });

      this.socket.on("isadmin", () => {
        appendHtml(
          document.querySelector("#adminControls"),
          "<button id='showLeaderboard' class='adminButton'>Show Scores</button>",
        );
        appendHtml(
          document.querySelector("#adminControls"),
          "<button id='hideLeaderboard' class='adminButton'>Hide Scores</button>",
        );
        appendHtml(
          document.querySelector("#adminControls"),
          "<button id='showStatsBoard' class='adminButton'>Show Stats</button>",
        );
        appendHtml(
          document.querySelector("#adminControls"),
          "<button id='hideStatsBoard' class='adminButton'>Hide Stats</button>",
        );
        // appendHtml(
        //   document.querySelector("#adminControls"),
        //   "<button id='resetLeaderboard'>Reset Leaderboard</button>",
        // );

        setTimeout(() => {
          document.querySelector("#showLeaderboard").addEventListener("click", (clickEvent) => {
            this.socket.emit("showLeaderboard");
          });
          document.querySelector("#hideLeaderboard").addEventListener("click", (clickEvent) => {
            this.socket.emit("hideLeaderboard");
          });

          document.querySelector("#showStatsBoard").addEventListener("click", (clickEvent) => {
            this.socket.emit("showStatsBoard");
          });
          document.querySelector("#hideStatsBoard").addEventListener("click", (clickEvent) => {
            this.socket.emit("hideStatsBoard");
          });
          //   document.querySelector("#resetLeaderboard").addEventListener("click", (clickEvent) => {
          //     this.socket.emit("resetLeaderboard");
          //   });
        }, 250);
      });

      this.socket.on("error", (e) => {
        console.log("error", e);
        // document.querySelector("#introText").innerHTML = "There was an error loading the game.  Please try reloading";
        // document.querySelector("#joinGame").innerHTML = "<a href=.>Reload</a>";
      });

      this.socket.on("connection_error", (e) => {
        console.log("Socket connection error", e);
        // document.querySelector("#introText").innerHTML = "There was an error loading the game.  Please try reloading";
        // document.querySelector("#joinGame").innerHTML = "<a href=.>Reload</a>";
      });

      //   this.socket.on("scoreUpdate", (e) => {
      //     const params = new Proxy(new URLSearchParams(window.location.search), {
      //       get: (searchParams, prop) => searchParams.get(prop),
      //     });
      //     let value = params[VisitorInfo.roomBasedOn];
      //     this.renderer.updateScore(e[value]);

      //     let scoreArray = [];
      //     for (let id of Object.keys(e[value])) {
      //       scoreArray.push({
      //         id,
      //         data: e[value][id],
      //       });
      //     }
      //     scoreArray.sort((a, b) => {
      //       return b.data.kills - a.data.kills;
      //     });

      //     // Only send update if you're in the lead
      //     if (
      //       this.renderer.playerShip &&
      //       scoreArray.length &&
      //       this.renderer.playerShip.id == parseInt(scoreArray[0].id)
      //     ) {
      //       this.socket.emit("updateLeaderboard", scoreArray);
      //     }
      //   });

      this.socket.on("disconnect", (e) => {
        console.log("disconnected");
        document.body.classList.add("disconnected");
        document.body.classList.remove("gameActive");
        // document.querySelector("#reconnect").disabled = false;
      });

      //   if ("autostart" in Utils.getUrlVars()) {
      //     this.socket.emit("requestRestart");
      //   }
    });
  }
}
