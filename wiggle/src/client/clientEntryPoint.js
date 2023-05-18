import querystring from "query-string";
import { Lib } from "@rtsdk/lance-topia";
import WiggleClientEngine from "../client/WiggleClientEngine";
import WiggleGameEngine from "../common/WiggleGameEngine";
const qsOptions = querystring.parse(location.search);

// default options, overwritten by query-string options
// is sent to both game engine and client engine
const defaults = {
  traceLevel: Lib.Trace.TRACE_NONE,
  delayInputCount: 5,
  scheduler: "render-schedule",
  //   syncOptions: {
  //     sync: qsOptions.sync || "extrapolate",
  //     // sync: qsOptions.sync || "frameSync",
  //     localObjBending: 0.2,
  //     remoteObjBending: 0.2,
  //     bendingIncrements: 6,
  //   },

  syncOptions: {
    // Using interpolate because sending fullSyncRate every 5 steps on server.  Extrapolate would try to predict and then undo.
    // Interpolate waits for the server instead of predicting, so there's less teleporting.
    // If increase fullSyncRate, might want to use extrapolate so has some prediction between server updates.
    // However, if have lots of collision in game and need that to be snappy, need to have low fullSyncRate as server controls collision.
    // Higher bending means it'll teleport to the server's truthiness.  Higher bending value: With a higher bending value, the client state will adjust more quickly to match the server state. This can make the game feel more responsive, as the client will closely mirror the server state. However, if there are irregularities in the network (like jitter or packet loss), this can also lead to more noticeable jumps or "teleportation" of game entities, as the client state rapidly adjusts to the server state.
    sync: qsOptions.sync || "interpolate",
    // localObjBending: 0.5,
    // remoteObjBending: 0.6,
    localObjBending: 0.7,
    remoteObjBending: 0.9,
    // bendingIncrements: 6,
  },
};
let options = Object.assign(defaults, qsOptions);

// create a client engine and a game engine
const gameEngine = new WiggleGameEngine(options);
const clientEngine = new WiggleClientEngine(gameEngine, options);

document.addEventListener("DOMContentLoaded", function (e) {
  clientEngine.start();
});
