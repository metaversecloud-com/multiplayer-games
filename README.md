<img src="https://global-uploads.webflow.com/62e7004a0f9b3a63b980ac3c/62e70c84dd3aac06fb2ac2b6_topia-logo-blue-2x.png" style="width: 25%" alt="Topia logo">

# Topia Multiplayer Game Sample

This repository contains sample games for use within topia.io.  Only Spaaace and Wiggle are configured with the [Topia SDK](https://metaversecloud-com.github.io/mc-sdk-js).

## Wiggle
<img src="https://user-images.githubusercontent.com/3702763/49344224-f0bb8980-f67c-11e8-935c-49fb2f30b566.gif">

### How To Play

- Students can play by walking inside of the game asset’s private zone
- Students can ‘spectate’ by clicking on the game asset while outside the private zone
- Nobody is able to join the game or spectate if they are not in the world

### Game Mechanics

- Click “Join Game” to create a wiggle and join the game. 
- Use your mouse to move your wiggle.
- Eat food (the red circles) to grow in length.
- If your wiggle is blocked (runs into) another wiggle, your game ends - try again.
- If you block another wiggle, you get a point.
- Blocking bots doesn’t give you a point.
- If you block a bot, your wiggle increases by ¼ of the bot’s length.
- If you block a player, your wiggle increases by ½ of that player’s length.
- Your wiggle will also shrink over time.  The bigger it gets, the faster it shrinks.

### Admin capabilities
Controls only available to admins / owners of a Topia world

#### Leaderboard
- Admins add the leaderboard in-world by clicking “Show Scores” in the Join screen
- Remove the leaderboard by clicking the “Hide Scores” button.
- Leaderboard is specific to an instance of the game.  If you have multiple instances of wiggle in your world, each one can have its own leaderboard.
- The “High Scores” section shows the top three players’ scores of anyone who has played this particular instance of the game.
- The “Current Scores” section shows the scores of everyone currently playing.
- Don’t delete your game instance without first removing the leaderboard.  Otherwise, the leaderboard needs to be removed manually.

#### Stats Board
- Admins can add a stats board to the world by clicking “Show Stats” in the Join screen.
- Remove the stats by clicking the “Hide Stats” button.
- Stats board maintains persistent statistics of every player across every instance of the game, in every world they play in.
- Students gain XP and levels by eating food and blocking other players’ wiggles.
- The stats board will only show stats for anyone currently playing with an active wiggle.
- Don’t delete your game instance without first removing the stats board.  Otherwise, the stats board needs to be removed manually.


## Spaaace
<img src="https://cloud.githubusercontent.com/assets/3951311/21784604/ffc2d282-d6c4-11e6-97f0-0ada12c4fab7.gif">
Configured to only allow visitors to access the game from within a world.  Your ship automatically has your Topia username.  Enter a private zone to play.  If outside the private zone, you can spectate.
The leaderboard shows current scores and all time high scores.

