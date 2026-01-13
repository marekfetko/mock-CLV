import { reactive } from "@vue/reactivity";
import { useMemo } from "react";
import { AppModel } from "../../../app/app-model";
import { AddTable } from "../../../components/ui-kit/tables/add-table";
import { CellDateField } from "../../../components/ui-kit/tables/cell-fields/cell-date-field";
import { CellTextField } from "../../../components/ui-kit/tables/cell-fields/cell-text-field";
import { CellRemoveButton } from "../../../components/ui-kit/tables/cells/cell-remove-button";

import { reacter } from "../../../utils/react";
import { AddMedications } from "./add-medications";

export const AddMedicationsTable = reacter(function AddMedicationsTable(props: {
  app: AppModel;
  variant: "medications";
}) {
    const patient = props.app.patient;
    const model = useMemo(() => {
        const m = reactive(new AddMedications(patient.api, patient));
        m.initEmpty();
        return m;
    }, [patient]);

  return (
    <AddTable
      model={model}
      setAllDates="datetime"
      columns={[
        {
          header: "Started at",
          mandatory: true,
          cell: (item) => (
            <CellDateField
              model={item}
              attr="medication_started"
              type="datetime-local"
            />
          ),
        },
        {
          header: "Ended at",
          cell: (item) => (
            <CellDateField
              model={item}
              attr="medication_ended"
              type="datetime-local"
            />
          ),
        },
        {
          header: "Name",
          mandatory: true,
          cell: (item) => (
            <CellTextField 
              model={item} 
              attr="medication_name"
            />
          ),
        },
        {
          header: "Group",
          cell: (item) => (
            <CellTextField 
              model={item} 
              attr="medication_group"
            />
          ),
        },
        {
          header: "Dose",
          mandatory: true,
          cell: (item) => (
            <CellTextField 
              model={item} 
              attr="medication_dose"
              type="number"
            />
          ),
        },
        {
          header: "Unit",
          mandatory: true,
          cell: (item) => (
            <CellTextField 
              model={item} 
              attr="medication_unit"
            />
          ),
        },
        {
          header: "Comment",
          cell: (item) => (
            <CellTextField 
              model={item} 
              attr="comment" 
              multiline="autosize" />
          ),
        },
        {
          header: "Remove data row",
          cell: (item, index) => (
            <CellRemoveButton index={index} model={model} />
          ),
        },
      ]}
    />
  );
  });