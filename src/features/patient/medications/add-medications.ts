import { ApiConnector } from "../../../api/api-connector";
import { DataAdd } from "../../../models/data-add";
import { Patient } from "../patient";

export class AddMedications extends DataAdd {

    constructor(api: ApiConnector, patient: Patient) {
      super(api, patient);
      this.desc = "Patient medications data";
      this.bodyField = "medications";
      this.endpoint = "api/v1/medications/bulk";
      this.defaultDateTimeName = "Now";
      this.defaultDateTimeFields = ["medication_started"];
      this.reloadToTab = "medications";
      this.requiredFields = [
        "medication_started",
        "medication_name",
        "medication_dose",
        "medication_unit",
      ];
    }

    async initEmpty() {
      this.defaultDateTime = new Date().toISOString();
      const emptyMedication = {
        medication_started: this.defaultDateTime,
        medication_ended: null,
        medication_name: "",
        medication_group: "",
        medication_dose: null,
        medication_unit: "",
        comment: null,
      };
      this.addingList = [emptyMedication];
    }
}