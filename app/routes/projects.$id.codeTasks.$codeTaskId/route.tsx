import { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigation } from "@remix-run/react";
import { CodeTaskDbItem } from "api/aiEngineer/db/codeTasks.db";
import { useState } from "react";
import { proxyApiRequestAsJson } from "~/toolkit/http/proxyApiRequest";
import CodeTaskNav, { CodeTaskStep } from "./CodeTaskNav";
import { RawInputForm } from "./RawInputForm";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  let codeTask = await proxyApiRequestAsJson<CodeTaskDbItem | null>(
    request,
    `/projects/${params.id}/codeTasks/${params.codeTaskId}`
  );
  return {
    codeTask,
  };
};
let steps: CodeTaskStep[] = [
  {
    id: "01",
    name: "Raw Input",
  },
  {
    id: "02",
    name: "Specifications",
  },
  {
    id: "03",
    name: "Planning",
  },
];
export default function CodeTasksRoute() {
  let { codeTask } = useLoaderData<typeof loader>();
  let navigation = useNavigation();
  let [currentStep, setCurrentStep] = useState<string>(() => {
    if (codeTask?.plan) return "03";
    if (codeTask?.specifications) return "02";
    return "01";
  });
  let isLoading = navigation.state !== "idle";

  return (
    <div className="px-4 py-2">
      <div className="max-w-xl">
        <CodeTaskNav
          currentStep={currentStep}
          onChange={setCurrentStep}
          steps={steps}
        />
      </div>
      {currentStep === "01" && (
        <RawInputForm codeTask={codeTask as any} onSubmit={() => {}} />
      )}
    </div>
  );
}
