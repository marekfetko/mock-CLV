import { createBrowserRouter, Navigate, RouteObject } from "react-router-dom";
import { AccountRoute } from "../features/account/account-route";
import { AddPatientRoute } from "../features/add-patient/add-patient-route";
import { LabsTable } from "../features/patient/labs/labs-table";
import { MedicationsTable } from "../features/patient/medications/medications-table";
import { AddMedicalTable } from "../features/patient/medical/add-medical-table";
import { PatientRoute } from "../features/patient/patient-route";
import { SymptomsRoute } from "../features/patient/symptoms/symptoms-route";
import { PatientsRoute } from "../features/patients/patients-route";
import { AppModel } from "./app-model";
import { ForgotPasswordRoute } from "./forgot-password-route";
import { MainLayout } from "./layout/main-layout";
import { LoginRoute } from "./login-route";
import { RouterRoot } from "./router-root";
import { AddMedicationsTable } from "../features/patient/medications/add-medications-table";

export function createRouter(app: AppModel) {
  const routes: RouteObject[] = [
    {
      element: <RouterRoot />,
      children: [
        {
          path: "/login",
          element: <LoginRoute app={app} />,
        },
        {
          path: "/forgot-password",
          element: <ForgotPasswordRoute app={app} />,
        },
        {
          element: <MainLayout app={app} />,
          children: [
            {
              path: "/",
              element: <PatientsRoute api={app.seerlinqApi} app={app} />,
              handle: { crumb: "Patients" },
            },
            {
              path: "/patient/:id/*",
              element: <PatientRoute app={app} />,
              handle: { crumb: (params: any) => `Patient #${params.id}` },
              children: [
                {
                  path: "",
                  element: <Navigate to="symptoms" replace />,
                },
                {
                  path: "symptoms",
                  element: <SymptomsRoute app={app} />,
                  handle: { crumb: "Symptoms" },
                },
                {
                  path: "labs",
                  handle: { crumb: "Labs" },
                  children: [
                    {
                      index: true,
                      element: <LabsTable app={app} />,
                    },
                    {
                      path: "add",
                      element: <AddMedicalTable app={app} variant="labs" />,
                      handle: { crumb: "Add", backButton: true },
                    },
                  ],
                },
                {
                  path: "medications",
                  handle: { crumb: "Medications" },
                  children: [
                    {
                      index: true,
                      element: <MedicationsTable app={app} />,
                    },
                    {
                      path: "add",
                      element: <AddMedicationsTable app={app} variant="medications" />,
                      handle: { crumb: "Add", backButton: true },
                    },
                  ],
                },
              ],
            },
            {
              path: "/add-patient",
              element: <AddPatientRoute app={app} />,
              handle: { crumb: "Add new patient" },
            },
            {
              path: "/account",
              element: <AccountRoute app={app} api={app.seerlinqApi} />,
              handle: { crumb: "Account" },
            },
          ],
        },
      ],
    },
  ];

  return createBrowserRouter(routes);
}
