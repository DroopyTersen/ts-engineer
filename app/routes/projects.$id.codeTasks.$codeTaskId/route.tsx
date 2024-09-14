import { LoaderFunctionArgs } from "@remix-run/node";
import { useOutletContext } from "@remix-run/react";
import { CodeTaskDbItem } from "api/aiEngineer/db/codeTasks.db";
import { useEffect } from "react";
import { proxyApiRequestAsJson } from "~/toolkit/http/proxyApiRequest";
import CodeTaskNav from "./CodeTaskNav";
import { CodingPlanForm } from "./CodingPlanForm";
import { RawInputForm } from "./RawInputForm";
import { SpecificationsForm } from "./SpecficationsForm";
import { useCodeTask } from "./useCodeTask";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  let codeTask = await proxyApiRequestAsJson<CodeTaskDbItem | null>(
    request,
    `/projects/${params.id}/codeTasks/${params.codeTaskId}`
  );
  return {
    codeTask,
  };
};

export default function CodeTasksRoute() {
  let codeTask = useCodeTask();
  let { selectedFiles, setSelectedFiles } = useOutletContext<{
    selectedFiles: string[];
    setSelectedFiles: (selectedFiles: string[], selectionKey?: string) => void;
  }>();

  useEffect(() => {
    if (codeTask.codeTask?.selected_files) {
      setSelectedFiles(codeTask.codeTask.selected_files, Date.now().toString());
    }
  }, []);
  return (
    <div className="px-4 py-2">
      <div className="max-w-4xl">
        <CodeTaskNav
          currentStep={codeTask.currentStep}
          onChange={codeTask.setCurrentStep}
        />
      </div>
      {codeTask.currentStep === "01" && (
        <RawInputForm
          codeTask={codeTask.codeTask}
          onSubmit={({ input, selectedFiles }) =>
            codeTask.actions.generateSpecifications(input, selectedFiles)
          }
        />
      )}
      {codeTask.currentStep === "02" && <SpecificationsForm {...codeTask} />}
      {codeTask.currentStep === "03" && <CodingPlanForm {...codeTask} />}
    </div>
  );
}
