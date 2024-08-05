import { useActionData, useLocation, useNavigation } from "@remix-run/react";
import { useEffect, useRef } from "react";

export function useFormSubmission(
  formAction = "",
  onSuccess?: (actionData: any) => void
) {
  // If no formAction is passed, use the current location
  if (!formAction) {
    formAction = useLocation()?.pathname;
  }

  let actionData = useActionData<any>();
  let navigation = useNavigation();
  let hadSubmittingStatus = useRef(false);
  let hadLoadingStatus = useRef(false);
  let isSubmitting =
    navigation?.state !== "idle" && navigation?.formAction === formAction;
  let formErrors: Record<string, string> = actionData?.formErrors || {};
  useEffect(() => {
    if (navigation.state === "submitting") {
      hadSubmittingStatus.current = true;
    } else if (navigation.state === "loading" && hadSubmittingStatus.current) {
      hadLoadingStatus.current = true;
    } else if (
      navigation.state === "idle" &&
      hadSubmittingStatus.current &&
      Object.keys(formErrors).length === 0
    ) {
      if (onSuccess) {
        onSuccess(actionData);
      }
    }
  }, [navigation.state]);
  return {
    errors: formErrors,
    isSubmitting,
    submittedValues: actionData?.submittedValues || {},
  };
}
