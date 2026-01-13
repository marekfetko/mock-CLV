import { useMemo } from "react";
import {
  apiDeleteSchedulesUuid,
  apiPostSchedules,
  apiPutSchedulesUuid,
  PatientScheduleResponse,
  ScheduleTypes,
} from "../../api";
import { handleError } from "../../app/errors";
import { TextField } from "../../components/ui-kit/fields/text-field";
import { FormModel } from "../../components/ui-kit/form/form-model";
import { FormRowEditable } from "../../components/ui-kit/form/form-row-editable";
import { dayNames } from "../../utils/data-utils";
import { reacter } from "../../utils/react";
import { Patient } from "./patient";

export const ScheduleFormRow = reacter(function ScheduleFormRow(props: {
  patient: Patient;
  form: FormModel;
}) {
  const schedules = useMemo(
    () => props.patient.schedules.paginatedData,
    [props.patient.schedules.paginatedData],
  );

  return (
    <FormRowEditable
      label="Schedule"
      editMode={() => (
        <>
          {props.form.editedField.schedules.map(
            (schedule: any, index: number) => (
              <div key={index}>
                Every{" "}
                <TextField
                  attr="schedule_frequency_regular_repeat_every"
                  model={schedule}
                  type="number"
                  width={30}
                />{" "}
                day at times:{" "}
                <div
                  style={{ display: "inline-flex" }}
                  data-tooltip="You can enter more times and separate them by commas"
                >
                  <TextField
                    attr="schedule_times"
                    model={schedule}
                    width={80}
                    multiline="autosize"
                  />
                </div>{" "}
                <button
                  type="button"
                  onClick={() => {
                    props.form.editedField.schedules.splice(index, 1);
                  }}
                >
                  X
                </button>
              </div>
            ),
          )}
          <button
            type="button"
            onClick={() => {
              props.form.editedField.schedules.push({
                schedule_times: "",
                schedule_frequency_regular_repeat_every: null,
              });
            }}
          >
            Add schedule
          </button>
        </>
      )}
      form={props.form}
      viewMode={
        <>
          {schedules.map((schedule) => (
            <div key={schedule.uuid}>{scheduleToString(schedule)}</div>
          ))}
        </>
      }
      getEditedField={() => ({
        schedules: schedules.map((schedule) => ({
          uuid: schedule.uuid,
          schedule_times: schedule.schedule_times?.join(", ") ?? "",
          schedule_frequency_regular_repeat_every:
            schedule.schedule_frequency_regular_repeat_every,
        })),
      })}
      onChange={async (editedField) => {
        for (const schedule of editedField.schedules) {
          try {
            const body = {
              schedule_times: parseScheduleTimesString(schedule.schedule_times),
              schedule_frequency_regular_repeat_every:
                schedule.schedule_frequency_regular_repeat_every,
            };

            if (schedule.uuid) {
              await apiPutSchedulesUuid({
                path: { uuid: schedule.uuid },
                body,
              });
            } else {
              await apiPostSchedules({
                body: {
                  patient_id: props.patient.patientId,
                  schedule_type: ScheduleTypes.ppg,
                  specific_schedule_data_name: ["Condition 1", "Condition 2"],
                  ...body,
                },
              });
            }
          } catch (error) {
            handleError(error);
          }
        }

        const deletedUuids = schedules
          .filter(
            (s) => !editedField.schedules.find((s2: any) => s2.uuid === s.uuid),
          )
          .map((s) => s.uuid);

        for (const uuid of deletedUuids) {
          try {
            await apiDeleteSchedulesUuid({ path: { uuid } });
          } catch (error) {
            handleError(error);
          }
        }

        await props.patient.fetch();
      }}
    />
  );
});

function scheduleToString(member: PatientScheduleResponse) {
  const ordinalSuperscript: Record<number, string> = {
    1: "st",
    2: "nd",
    3: "rd",
  };
  let freqString = "";
  if (member.schedule_frequency_regular_repeat_every != null) {
    const ordinalStr =
      ordinalSuperscript[member.schedule_frequency_regular_repeat_every] ||
      "th";
    freqString =
      "Every " +
      member.schedule_frequency_regular_repeat_every +
      ordinalStr +
      " day";
  } else {
    freqString = "Days: " + schedDays(member);
  }
  freqString += " at times: " + member.schedule_times.join(", ");
  return freqString;
}

function schedDays(member: PatientScheduleResponse) {
  return member.schedule_frequency_on_days
    .map((day) => dayNames[day])
    .join("/");
}

function parseScheduleTimesString(str: string): string[] {
  const res: string[] = [];

  for (const item of str.split(/[\n,]/)) {
    const [hoursStr, minutesStr = "00", secondsStr = "00"] = item.split(":");

    res.push(
      `${hoursStr.padStart(2, "0").trim()}:${minutesStr.trim()}:${secondsStr.trim()}`,
    );
  }

  return res;
}
