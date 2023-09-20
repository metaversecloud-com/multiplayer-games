import { BaseTypes, DynamicObject } from "@rtsdk/lance-topia";

export default class LeaderboardItem extends DynamicObject {
  static get netScheme() {
    return Object.assign(
      {
        id: { type: BaseTypes.TYPES.STRING },
        score: { type: BaseTypes.TYPES.INT16 },
        name: { type: BaseTypes.TYPES.STRING },
        date: { type: BaseTypes.TYPES.FLOAT32 },
      },
      super.netScheme,
    );
  }

  constructor(gameEngine, options, props) {
    super(gameEngine, options, props);
    this.class = LeaderboardItem;
    this.bodyParts = [];
    this.id = "";
    this.score = 0;
    this.name = "";
    this.date = 0;
  }

  syncTo(other) {
    super.syncTo(other);
    this.id = other.id;
    this.score = other.score;
    this.name = other.name;
    this.date = other.date;
  }
}
