import {
  AlertKind,
  apiGetClinicalStudies,
  apiGetDiagnosesList,
  apiGetHfVitalsPatientId,
  apiGetLabelstudioTaskProjectIdPpgUuid,
  apiGetMedicaldataList,
  apiGetPatientsPatientId,
  apiGetPatientsPatientIdComputed,
  apiGetPatientsPatientIdDerived,
  apiGetPatientsPatientIdHealthPro,
  apiGetPatientsPatientIdMonitoringInfo,
  apiGetSchedules,
  apiGetSymptomsList,
  apiPostPatientsPatientIdUser,
  apiPutAlertsMarkAllSeenPatientId,
  apiPutComputedUuid,
  apiPutDerivedUuid,
  apiPutPatientsPatientId,
  client,
  CreateUserForExistingPatientSchema,
  DerivedDataRollingType,
  Level3ClinicalPatientResponse,
  Level3PatientResponse,
  PatientState,
  PPGDerivedDataGroup,
  PPGRelatedQualityFlag,
  QuickLookTasks,
  SupportedDiagnosis,
  SupportedMedicalData,
  SupportedSymptom,
} from "../../api";
import { ApiConnector } from "../../api/api-connector";
import { FormModel } from "../../components/ui-kit/form/form-model";
import {
  HeartCoreQuickLook,
  HeartCoreRangeMonths,
  PatientQuickLook,
} from "../../models/quick-look-analyses";
import { consentOk, isPaperConsent } from "../../utils/data-utils";
import { dateTimeOrNull } from "../../utils/utils";
import { ComputedData } from "./common/computed-data";
import { DerivedData } from "./common/derived-data";
import { MedDataSource, MergedMedData } from "./common/merged-med-data";
import { Schedules } from "./schedules";

export class Patient {
  loaded = false;
  defaultTab: string;
  data: any;
  schedules: Schedules;
  heartCore: any;

  detailsForm = new FormModel();
  healthProDetailsForm = new FormModel();

  driHeartCore: PatientQuickLook;
  heartCoreReport: HeartCoreQuickLook;
  hcReportPlot: HeartCoreRangeMonths = 12;
  hcReportTable: HeartCoreRangeMonths = 3;

  supportedDiags: SupportedDiagnosis[];
  supportedMedData: SupportedMedicalData[];
  supportedSymptoms: SupportedSymptom[];

  isHealthProPatient: boolean;

  numDRIDataPoints: number;

  enrollments: Array<{ study_acronym: string; enrollment_uuid: string }> = [];

  constructor(
    public patientId: number,
    public api: ApiConnector,
  ) {}

  async init() {
    this.defaultTab = "symptoms";
    if (this.api.userLevel === 2) {
      this.heartCoreReport = new HeartCoreQuickLook(this.api, this.patientId);
    }
    if (this.api.userLevel >= 3) {
      this.driHeartCore = new PatientQuickLook(
        this.api,
        QuickLookTasks.hf_dri_timeseries_ql,
        this.patientId,
      );
      this.initHeartCore();
    }

    await this.fetch();
  }

  initHeartCore() {
    this.heartCoreReport = new HeartCoreQuickLook(
      this.api,
      this.patientId,
      this.hcReportPlot,
      this.hcReportTable,
    );
  }

  async fetch() {
    try {
      this.data = (
        await apiGetPatientsPatientId({
          path: { patient_id: this.patientId },
        })
      ).data;

      await Promise.all([
        this.fetchDri(),
        this.fetchSchedules(),
        this.fetchHeartCore(),
        this.fetchEnrollments(),
      ]);
      this.isHealthProPatient = this.isHealthPro(this.data);

      await this.fetchSupportedMedicalData();

      this.loaded = true;
    } catch (error) {
      console.error("Error fetching patient data:", error);
      // Set loaded to true even on error so the page can render
      this.loaded = true;
      throw error;
    }
  }

  isHealthPro(data: Level3PatientResponse | Level3ClinicalPatientResponse) {
    const insuranceDetails = data?.["insurance_policy_details"];
    if (insuranceDetails === null || insuranceDetails === undefined) {
      return false;
    }
    return [
      "healthpro_id",
      "healthpro_diagnosis",
      "healthpro_physician",
      "healthpro_service",
    ].every((key) => insuranceDetails.hasOwnProperty(key));
  }

  consentOk() {
    return consentOk(this.data);
  }

  isPaperConsent() {
    return isPaperConsent(this.data);
  }

  sanitizeBody(body: object) {
    for (const key in body) {
      if (body.hasOwnProperty(key)) {
        if (body[key] === "") {
          body[key] = null;
        }
      }
    }
    // remove null
    body = Object.fromEntries(
      Object.entries(body).filter(([key, value]) => value !== null),
    );
    return body;
  }

  async updatePatientField(body: object, sanitize = true) {
    if (sanitize) {
      body = this.sanitizeBody(body);
    }
    await apiPutPatientsPatientId({
      path: { patient_id: this.patientId },
      body,
    });
    await this.fetch();
  }

  async updateItem(endpoint: string, uuid: string, body: object) {
    const cleanBody: any = this.sanitizeBody(body);
    await client.put({
      url: `/api/v1/${endpoint}/${uuid}`,
      body: cleanBody,
    });
  }

  async overrideValue(value: number, uuid: string, dataSource: MedDataSource) {
    if (dataSource === MedDataSource.PPGDerived) {
      await apiPutDerivedUuid({
        path: { uuid: uuid },
        body: {
          seerlinq_measurement_quality_flag:
            PPGRelatedQualityFlag.manual_value_override,
          override_value: value,
        },
      });
    } else if (dataSource === MedDataSource.SQAlgo) {
      await apiPutComputedUuid({
        path: { uuid: uuid },
        body: {
          seerlinq_measurement_quality_flag:
            PPGRelatedQualityFlag.manual_value_override,
          override_value: value,
        },
      });
    }
  }

  async deleteItem(endpoint: string, uuid: string) {
    await client.delete({
      url: `/api/v1/${endpoint}/${uuid}`,
    });
  }

  async createConnectedUser(body: CreateUserForExistingPatientSchema) {
    await apiPostPatientsPatientIdUser({
      path: { patient_id: this.patientId },
      body,
    });
    this.loaded = false;
    await this.fetch();
    this.loaded = true;
  }

  async togglePatientState() {
    let newState: PatientState;
    if (this.data.patient_state === PatientState.normal) {
      newState = PatientState.high_risk;
    } else {
      newState = PatientState.normal;
    }
    await apiPutPatientsPatientId({
      path: { patient_id: this.patientId },
      body: { patient_state: newState },
    });
    window.location.reload();
  }

  async generateHealthProReports(
    maxReports: number,
    fromDate: string,
    extended: boolean,
  ) {
    const reports = await apiGetPatientsPatientIdHealthPro({
      path: { patient_id: this.patientId },
      query: {
        max_reports: maxReports,
        from_date: fromDate === null ? null : fromDate,
        extended_report: extended,
      },
    });
    let reportsData = reports.data;
    reportsData.from_date = dateTimeOrNull(reportsData.from_date, false);
    reportsData.from_date =
      reportsData.from_date === null ? "--" : reportsData.from_date;
    return reportsData;
  }

  async clearHealthProDetails() {
    await apiPutPatientsPatientId({
      path: { patient_id: this.patientId },
      body: { insurance_policy_details: {} },
    });
    window.location.reload();
  }

  private async fetchDri() {
    // TODO discontinue after adding `numDRIDataPoints` to `this.fetchHeartCore` on API
    const driData = await apiGetPatientsPatientIdComputed({
      path: { patient_id: this.patientId },
      query: {
        all_versions: false,
        search_string: "diastolic*reserve*index",
        paginate: false,
      },
      cache: "reload",
    });
    this.numDRIDataPoints = driData.data.results || 0;
  }

  async fetchVitals(vitals: MergedMedData, skipCache = false) {
    const vitalsResp = await apiGetHfVitalsPatientId({
      path: { patient_id: this.patientId },
      meta: { useSessionCache: !skipCache },
    });
    vitals.data = vitalsResp.data.medical_data;
    // merge with SpO2 and HR from derived and HR from computed
    const derived = await apiGetPatientsPatientIdDerived({
      path: { patient_id: this.patientId },
      query: {
        rolling_type: [DerivedDataRollingType.full],
        data_groups: [PPGDerivedDataGroup.hr, PPGDerivedDataGroup.spo2],
        paginate: false,
      },
      meta: { useSessionCache: !skipCache },
    });
    const SpO2 = new DerivedData(
      derived.data.derived_data,
      this.api.userLevel,
      this.api.userUUID,
    );
    SpO2.filterSpO2();
    SpO2.init();
    const HRDerived = new DerivedData(
      derived.data.derived_data,
      this.api.userLevel,
      this.api.userUUID,
      this.api,
      QuickLookTasks.ppg_timeseries_ql,
    );
    HRDerived.filterHR();
    HRDerived.init();

    const computed = await apiGetPatientsPatientIdComputed({
      path: { patient_id: this.patientId },
      query: {
        all_versions: false,
        search_string: "heart*rate",
        paginate: false,
      },
      meta: { useSessionCache: !skipCache },
    });
    const HRComputed = new ComputedData(
      computed.data.computed_data,
      this.api.userLevel,
      this.api.userUUID,
      this.api,
      QuickLookTasks.ppg_timeseries_ql,
    );
    HRComputed.init();

    const varMapping = {
      "SpO2: mean": "SpO2",
      "HR: mean": "heart rate",
      "heart rate": "heart rate",
    };
    vitals.mergeWithPPGDerivedAndComputed(
      [SpO2, HRDerived],
      [HRComputed],
      "measurement_type",
      varMapping,
    );
    vitals.init();
  }

  async fetchSupportedMedicalData() {
    const response = await apiGetMedicaldataList({
      meta: { useSessionCache: true },
    });
    this.supportedMedData = response.data.medical_data;
  }

  async fetchSupportedSymptoms() {
    const response = await apiGetSymptomsList({
      meta: { useSessionCache: true },
    });
    this.supportedSymptoms = response.data.symptoms;
  }

  async fetchSupportedDiags() {
    const response = await apiGetDiagnosesList({
      meta: { useSessionCache: true },
    });
    this.supportedDiags = response.data.diagnoses;
  }

  private async fetchSchedules() {
    const schedules = await apiGetSchedules({
      query: { patient_ids: [this.patientId], schedule_type: "ppg" },
    });
    this.schedules = new Schedules(
      schedules.data.schedules,
      this.api.userLevel,
      this.api.userUUID,
    );
    this.schedules.init();
  }

  private async fetchHeartCore() {
    if (this.api.userLevel < 3) {
      return;
    }

    const monitoringInfo = await apiGetPatientsPatientIdMonitoringInfo({
      path: { patient_id: this.patientId },
    });
    this.heartCore = monitoringInfo.data;
    this.heartCore.last_ppg = dateTimeOrNull(this.heartCore.last_ppg, true);
    this.heartCore.reportStart = dateTimeOrNull(
      this.heartCore.report_start_date,
      false,
    );
    this.heartCore.dris = (this.heartCore.last_5_dris || []).map(
      ([datetime, floatVal]) => [
        dateTimeOrNull(datetime),
        parseFloat(floatVal.toFixed(1)),
      ],
    );
  }

  async fetchEnrollments() {
    if (this.api.userLevel !== 4) {
      return;
    }

    const response = await apiGetClinicalStudies({
      query: { patient_ids: [this.patientId] },
    });

    this.enrollments = response.data.study_enrollments.map((enrollment) => ({
      study_acronym: enrollment.study_acronym,
      enrollment_uuid: enrollment.uuid,
    }));
  }

  async redirectToLabelStudio(ppgUuid: string) {
    const response = await apiGetLabelstudioTaskProjectIdPpgUuid({
      path: {
        project_id: parseInt(import.meta.env.VITE_LABEL_STUDIO_PROJECT_ID),
        ppg_uuid: ppgUuid,
      },
    });
    window.open(response.data.url, "_blank");
  }

  async markMedicalAlertsSeen() {
    const response = await apiPutAlertsMarkAllSeenPatientId({
      path: { patient_id: this.patientId },
      query: { alert_kinds: [AlertKind.medical] },
    });
    const numMarked = response.data.results;
    alert(`${numMarked} medical alerts were marked as seen.`);
    window.location.reload();
  }

  async markTechAlertsSeen() {
    const response = await apiPutAlertsMarkAllSeenPatientId({
      path: { patient_id: this.patientId },
      query: {
        alert_kinds: [AlertKind.technical, AlertKind.compliance],
      },
    });
    const numMarked = response.data.results;
    alert(`${numMarked} technical and compliance alerts were marked as seen.`);
    window.location.reload();
  }
}
