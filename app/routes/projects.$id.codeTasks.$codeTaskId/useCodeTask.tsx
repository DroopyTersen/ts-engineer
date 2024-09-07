import { useNavigate, useParams } from "@remix-run/react";
import { type CodeTaskDbItem } from "api/aiEngineer/db/codeTasks.db";
import { useMemo, useState } from "react";
import { useApiUrl } from "~/root";
import { useLLMEventStream } from "~/toolkit/ai/ui/useLLMEventStream";
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
      generateCodingPlan: (specifications: string) => {
        if (codingPlanStream.isStreaming) {
          codingPlanStream.actions.cancel();
        }
        codingPlanStream.actions.submit({ input: specifications });
        setCurrentStep("03");
      },
      generateSpecifications: (input: string) => {
        if (specificationsStream.isStreaming) {
          specificationsStream.actions.cancel();
        }
        specificationsStream.actions.submit({ input });
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
    };
  }, [specificationsStream, codingPlanStream, codeTask]);

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
