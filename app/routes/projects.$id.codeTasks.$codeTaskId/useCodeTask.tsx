import { useNavigate, useParams } from "@remix-run/react";
import { type CodeTaskDbItem } from "api/aiEngineer/db/codeTasks.db";
import { useMemo, useState } from "react";
import { useApiUrl } from "~/root";
import { useLLMEventStream } from "~/toolkit/ai/ui/useLLMEventStream";
import { jsonRequest } from "~/toolkit/http/fetch.utils";
import { useRouteData } from "~/toolkit/remix/useRouteData";

export const useCodeTask = () => {
  let { codeTaskId, id: projectId } = useParams();
  let apiUrl = useApiUrl();
  let navigate = useNavigate();
  let codeTask = useRouteData((r) => r?.data?.codeTask) as CodeTaskDbItem;
  let [currentStep, setCurrentStep] = useState<string>(() => {
    if (codeTask?.plan) return "03";
    if (codeTask?.specifications) return "02";
    return "01";
  });
  let apiPath = `${apiUrl}/projects/${projectId}/codeTasks/${codeTaskId}`;
  let specificationsStream = useLLMEventStream<{
    input: string;
    followUpInput?: string;
    selectedFiles?: string[];
  }>({
    apiPath: `${apiPath}/specifications`,
    bodyInput: {},
  });
  let codingPlanStream = useLLMEventStream<{
    input: string;
    followUpInput?: string;
    selectedFiles?: string[];
  }>({
    apiPath: `${apiPath}/codingPlan`,
    bodyInput: {},
  });

  const actions = useMemo(() => {
    return {
      generateCodingPlan: (specifications: string, selectedFiles: string[]) => {
        if (codingPlanStream.isStreaming) {
          codingPlanStream.actions.cancel();
        }
        codingPlanStream.actions.submit({
          input: specifications,
          selectedFiles: selectedFiles.length > 0 ? selectedFiles : undefined,
        });
        setCurrentStep("03");
      },
      generateSpecifications: (input: string, selectedFiles: string[]) => {
        specificationsStream.actions.submit({
          input,
          selectedFiles: selectedFiles.length > 0 ? selectedFiles : undefined,
        });
        setCurrentStep("02");
      },
      regenerateSpecifications: (followUpInput: string) => {
        if (specificationsStream.isStreaming) {
          specificationsStream.actions.cancel();
        }
        specificationsStream.actions.submit({
          input: codeTask?.input || "",
          followUpInput,
        });
        setCurrentStep("02");
      },
      regenerateCodingPlan: (followUpInput: string) => {
        if (codingPlanStream.isStreaming) {
          codingPlanStream.actions.cancel();
        }
        codingPlanStream.actions.submit({
          input: codeTask?.specifications || "",
          followUpInput,
        });
        setCurrentStep("03");
      },
      saveCodingPlan: async (codingPlan: string) => {
        await jsonRequest(`${apiPath}/saveCodingPlan`, {
          method: "POST",
          body: JSON.stringify({ codingPlan }),
        });
      },
      saveSpecifications: async (
        specifications: string,
        selectedFiles: string[]
      ) => {
        console.log(
          "🚀 | saveSpecifications: | specifications:",
          specifications,
          selectedFiles
        );
        await jsonRequest(`${apiPath}/saveSpecifications`, {
          method: "POST",
          body: JSON.stringify({ specifications, selectedFiles }),
        });
      },
    };
  }, [specificationsStream, codingPlanStream, codeTask, apiPath]);

  return {
    actions,
    specifications:
      specificationsStream?.message?.content || codeTask?.specifications || "",
    specificationsStream,
    codingPlan: codingPlanStream?.message?.content || codeTask?.plan || "",
    codingPlanStream,
    codeTask,
    setCurrentStep,
    currentStep,
  };
};
