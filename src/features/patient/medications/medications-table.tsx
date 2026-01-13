import { reactive } from "@vue/reactivity";
import { useMemo } from "react";
import { apiGetPatientsPatientIdMedications } from "../../../api";
import { AppModel } from "../../../app/app-model";
import { AButton } from "../../../components/ui-kit/a-button";
import { CellLastEdit } from "../../../components/ui-kit/tables/cells/cell-last-edit";
import { DataTable } from "../../../components/ui-kit/tables/data-table";
import { reacter } from "../../../utils/react";
import { useFetch } from "../../../utils/use-fetch";
import { Medications } from "./medications";
import { PatientSubpage } from "../common/patient-subpage";

export const MedicationsTable = reacter(function MedicationsTable(props: { app: AppModel }) {
  const patient = props.app.patient;
  const api = props.app.seerlinqApi;

  const model = useMemo(
    () => reactive(new Medications([], api.userLevel, api.userUUID)),
    [api.userLevel, api.userUUID],
  );

  const { loading, refetch } = useFetch(
    async ({ isRefetch }) => {
      const response = await apiGetPatientsPatientIdMedications({
        path: { patient_id: patient.patientId },
        meta: { useSessionCache: !isRefetch },
      });
      model.updateData(response.data.medications);
      await patient.fetchSupportedMedicalData();
    },
    [patient.patientId],
  );

  return (
    <PatientSubpage title="Medications" loading={loading}>
      <AButton to="add">Add medications</AButton>

      <br />
      <br />
      <br />

      <DataTable
        name={`patient/${patient.patientId}/medications`}
        model={model}
        columns={[
          {
            header1: "Started",
            attr: "medication_started",
            type: "datetime",
            editable: true,
            sort: true,
            initSort: "desc",
          },
          {
            header1: "Ended",
            attr: "medication_ended",
            type: "datetime",
            editable: true,
            sort: true,
            initSort: "desc",
          },
          {
            header1: "Group",
            attr: "medication_group",
            type: "string",
            sort: true,
            initSort: "desc",
          },
          {
            header1: "Name",
            attr: "medication_name",
            type: "string",
            sort: true,
            initSort: "desc",
          },
          {
            header1: "Dose",
            attr: "medication_dose",
            type: "string",
            editable: true,
            sort: true,
            initSort: "desc",
          },
          {
            header1: "Unit",
            attr: "medication_unit",
            type: "string",
            editable: true,
          },
          {
            header1: "Comment",
            attr: "comment",
            type: "string",
            multiline: true,
            editable: true,
          },
          model.showingHistory && {
            header1: "Added",
            attr: "created_at",
            type: "datetime",
          },
          model.showingHistory && {
            header1: "Last edit",
            cell: ({ item }) => <CellLastEdit item={item} />,
          },
        ]}
        onEdit={async (editedField, item) => {
          await patient.updateItem("medications", item.uuid, editedField);
          await refetch();
        }}
        onDelete={async (item) => {
          await patient.deleteItem("medications", item.uuid);
          await refetch();
        }}
      />
    </PatientSubpage>
  );
});
