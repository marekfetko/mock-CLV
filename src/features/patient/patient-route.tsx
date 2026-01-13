import { useEffect, useMemo } from "react";
import { Outlet, useParams } from "react-router-dom";
import { AppModel } from "../../app/app-model";
import { Page } from "../../app/layout/page";
import { Menu } from "../../app/layout/sidebar/menu";
import { MenuItem } from "../../app/layout/sidebar/menu-item";
import { Spinner } from "../../components/ui-kit/spinner";
import { reacter } from "../../utils/react";

export const PatientRoute = reacter(function PatientRoute(props: {
  app: AppModel;
}) {
  const { id } = useParams<{ id: string }>();
  const patientId = parseInt(id!);
  const patient = useMemo(() => props.app.initPatient(patientId), [patientId]);

  useEffect(() => {
    const init = async () => {
      try {
        await patient.init();
      } catch (error) {
        console.error("Error initializing patient:", error);
        // Set loaded to true even on error so the page can render
        patient.loaded = true;
      }
    };

    init();
  }, [patient]);

  return (
    <Page
      app={props.app}
      sidebar={
        <>
          <Menu>
            <MenuItem href={`/patient/${patientId}/symptoms`} end>
              Symptoms
            </MenuItem>

            {props.app.seerlinqApi.userLevel >= 3 && (
              <MenuItem href={`/patient/${patientId}/labs`}>Labs</MenuItem>
            )}

            {props.app.seerlinqApi.userLevel >= 3 && (
              <MenuItem href={`/patient/${patientId}/medications`}>Medications</MenuItem>
            )}
          </Menu>
        </>
      }
    >
      {!patient.loaded && <Spinner />}

      {patient.loaded && <Outlet />}
    </Page>
  );
});
