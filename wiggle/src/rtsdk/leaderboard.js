// import moment from "moment";
import { getAssetAndDataObject } from "./dataObject";

export const updateInAppLeaderboard = async ({ leaderboardArray, req }) => {
  // const { assetId, urlSlug } = req.body;
  // const world = World.create(urlSlug, { credentials: req.body });
  // const droppedAssets = await world.fetchDroppedAssetsWithUniqueName({
  //   isPartial: true,
  //   uniqueName: `multiplayer_leaderboard_${assetId}`,
  // });
  // if (!droppedAssets || !droppedAssets.length) return; // If no leaderboard components, don't update.

  let sanitizedArray = [];
  const date = new Date().valueOf();
  for (var i = 0; i < 10; i++) {
    let name = "-";
    if (leaderboardArray[i]) {
      const score = leaderboardArray[i].data.kills;
      const id = leaderboardArray[i].id;
      name = leaderboardArray[i].data.name;
      if (id && score && name && date) sanitizedArray.push({ id, score, name, date });
    }
  }

  const highScores = await updateHighScores({ req, sanitizedArray });
  return highScores;
};

export const updateHighScores = async ({ req, sanitizedArray }) => {
  const arcadeAsset = await getAssetAndDataObject(req); // This seems to be creating issues with API
  if (!arcadeAsset) return;
  const { dataObject } = arcadeAsset;
  const { highScores } = dataObject;

  if (!sanitizedArray.length) return highScores;

  // Don't update high score if the lowest high score is higher than the top current score.
  if (
    highScores &&
    highScores[2] &&
    sanitizedArray &&
    sanitizedArray[0] &&
    sanitizedArray[0].score < highScores[2].score
  )
    return highScores;

  // This is to compare high score array to current scores array and update high scores if necessary.
  let newArray = highScores ? sanitizedArray.concat(highScores) : sanitizedArray;
  let sortedArray = newArray.sort((a, b) => {
    return b.score - a.score;
  });

  const objectArray = dedupe(sortedArray);
  const highScoreArray = objectArray.slice(0, 10);
  // If they are the same, no need to update object or text.
  if (highScores === highScoreArray) return highScores;

  // for (let i = 0; i < highScoreArray.length; i++) {
  //   let name = "-";
  //   let date = "-";
  //   let scoreString = "-";
  //   if (highScoreArray[i]) {
  //     const score = highScoreArray[i].score;
  //     name = highScoreArray[i].name;
  //     scoreString = score.toString() || "0";
  //     date = moment(parseInt(highScoreArray[i].date)).fromNow();
  //   }

  //   updateText({
  //     World,
  //     req,
  //     text: name,
  //     uniqueName: `multiplayer_leaderboard_${req.body.assetId}_topPlayerName_${i}`,
  //   });

  //   updateText({
  //     World,
  //     req,
  //     text: date,
  //     uniqueName: `multiplayer_leaderboard_${req.body.assetId}_topDate_${i}`,
  //   });

  //   updateText({
  //     World,
  //     req,
  //     text: scoreString,
  //     uniqueName: `multiplayer_leaderboard_${req.body.assetId}_topScore_${i}`,
  //   });
  // }

  try {
    arcadeAsset.updateDataObject({ highScores: highScoreArray });
    return highScoreArray;
  } catch (e) {
    console.log("Cannot update dropped asset", e);
  }
};

// Convert to object to dedupe
function dedupe(arr) {
  var rv = {};
  for (var i = 0; i < arr.length; ++i) {
    const item = arr[i];
    if (item) {
      const id = item.id;
      // Remove duplicate player IDs and prevent score of 0 from being in high score array.
      if (!rv[id] && item.score) rv[id] = item;
    }
  }
  const dedupedArray = Object.keys(rv).map((id) => rv[id]);
  return dedupedArray.sort((a, b) => {
    return b.score - a.score;
  });
}
