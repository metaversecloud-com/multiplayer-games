"use strict";

import { BaseTypes, DynamicObject } from "@rtsdk/lance-topia";

export default class Wiggle extends DynamicObject {
  static get netScheme() {
    return Object.assign(
      {
        direction: { type: BaseTypes.TYPES.FLOAT32 },
        bodyLength: { type: BaseTypes.TYPES.INT16 },
        score: { type: BaseTypes.TYPES.INT16 },
        name: { type: BaseTypes.TYPES.STRING },
        stat_XP: { type: BaseTypes.TYPES.STRING },
        stat_level: { type: BaseTypes.TYPES.STRING },
        stat_blocks: { type: BaseTypes.TYPES.STRING },
        stat_blocksPerGame: { type: BaseTypes.TYPES.STRING },
        stat_foodPerGame: { type: BaseTypes.TYPES.STRING },
      },
      super.netScheme,
    );
  }

  constructor(gameEngine, options, props) {
    super(gameEngine, options, props);
    this.class = Wiggle;
    this.bodyParts = [];
    this.score = 0;
    this.stat_XP = "";
    this.stat_level = "";
    this.stat_blocks = "";
    this.stat_blocksPerGame = "";
    this.stat_foodPerGame = "";
  }

  syncTo(other) {
    super.syncTo(other);
    this.direction = other.direction;
    this.bodyLength = other.bodyLength;
    this.name = other.name;
    this.score = other.score;
    this.stat_XP = other.stat_XP;
    this.stat_level = other.stat_level;
    this.stat_blocks = other.stat_blocks;
    this.stat_blocksPerGame = other.stat_blocksPerGame;
    this.stat_foodPerGame = other.stat_foodPerGame;
  }

  toString() {
    return `Wiggle::${super.toString()} direction=${this.direction} length=${this.bodyLength} name=${this.name} score=${
      this.score
    }`;
  }
}
