import { AccessRules } from "../../../constants/roles";
import { DataModel } from "../../../models/data-model";

export class Medications extends DataModel {
  readonly idAttr = "uuid";

  constructor(data, userLevel: number, userUUID: string) {
    super(data, userLevel, userUUID);
    this.hasHistory = true;

    // access
    this.access = {
        editRules: { 2: AccessRules.owner, 3: AccessRules.visible },
        deleteRules: { 2: AccessRules.none, 3: AccessRules.visible },
        historyMinLevel: 3,
    };
  }
}