import { LoaderFunctionArgs } from "@remix-run/node";
import { CodeTaskDbItem } from "api/aiEngineer/db/codeTasks.db";
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

  return (
    <div className="px-4 py-2">
      <div className="max-w-xl">
        <CodeTaskNav
          currentStep={codeTask.currentStep}
          onChange={codeTask.setCurrentStep}
        />
      </div>
      {codeTask.currentStep === "01" && (
        <RawInputForm
          codeTask={codeTask.codeTask}
          onSubmit={({ input }) =>
            codeTask.actions.generateSpecifications(input)
          }
        />
      )}
      {codeTask.currentStep === "02" && <SpecificationsForm {...codeTask} />}
      {codeTask.currentStep === "03" && <CodingPlanForm {...codeTask} />}
    </div>
  );
}
