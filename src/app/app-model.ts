import { reactive } from "@vue/reactivity";
import { apiGetPatientsMinimal } from "../api";
import { ApiConnector } from "../api/api-connector";
import { clvVersion } from "../config/config";
import { AddPatient } from "../features/add-patient/add-patient";
import { Patient } from "../features/patient/patient";
import { Patients } from "../features/patients/patients";

export class AppModel {
  clvVersion = clvVersion ?? "-";
  darkMode = localStorage.getItem("darkMode") === "true";

  // basics
  patients: Patients;

  // patient loading and tabs
  patient: Patient = null;

  constructor(public seerlinqApi: ApiConnector) {}

  // basic loaders
  init() {
    this.setTheme();
  }

  async getPatients() {
    const res = await apiGetPatientsMinimal();

    this.patients = new Patients(
      res.data.patients,
      this.seerlinqApi.userLevel,
      this.seerlinqApi.userUUID,
    );

    this.patients.init();
  }

  initPatient(patientId: number) {
    if (!this.patient || this.patient.patientId !== patientId) {
      this.patient = new Patient(patientId, this.seerlinqApi);
    }

    return this.patient;
  }

  async initAddPatient() {
    const model = reactive(new AddPatient(this.seerlinqApi, null));
    await model.initEmpty();
    return model;
  }

  // dark mode
  setTheme() {
    let darkTheme = document.getElementById("dark-mode-css") as HTMLLinkElement;
    if (this.darkMode) {
      darkTheme.disabled = false;
    } else {
      darkTheme.disabled = true;
    }
  }

  async toggleDarkMode() {
    this.darkMode = !this.darkMode;
    localStorage.setItem("darkMode", String(this.darkMode));
    this.setTheme();
  }
}
