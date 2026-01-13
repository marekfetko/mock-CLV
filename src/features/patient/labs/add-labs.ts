import { MedicalDataCategory, SupportedMedicalData } from "../../../api";
import { ApiConnector } from "../../../api/api-connector";
import { DataAdd } from "../../../models/data-add";
import { Patient } from "../patient";

export class AddLabs extends DataAdd {
  supportedVariables: SupportedMedicalData[];

  constructor(api: ApiConnector, patient: Patient) {
    super(api, patient);
    this.initFields = [
      "measurement_datetime",
      "measurement_type",
      "measurement_unit",
    ];
    this.desc = "Patient laboratory data";
    this.bodyField = "medical_data";
    this.endpoint = "hf/data";
    this.defaultDateTimeName = "Now";
    this.defaultDateTimeFields = ["measurement_datetime"];
    this.reloadToTab = "labs";
    this.requiredFields = [
      "measurement_datetime",
      "measurement_type",
      "measurement_value",
    ];
  }

  async initEmpty() {
    this.defaultDateTime = new Date().toISOString();
    this.supportedVariables = this.patient.supportedMedData.filter(
      (data) => data.data_category === MedicalDataCategory.labs,
    );
    let empty = [];
    for (const variable of this.supportedVariables) {
      const temp = {
        measurement_datetime: this.defaultDateTime,
        measurement_type: variable.data_name,
        measurement_unit: variable.primary_unit,
      };
      empty.push(temp);
    }
    this.addingList = empty;
  }
}
