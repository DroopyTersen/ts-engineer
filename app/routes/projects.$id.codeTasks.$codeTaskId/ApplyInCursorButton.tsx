import { useState } from "react";
import { useApiUrl } from "~/root";
import { Button } from "~/shadcn/components/ui/button";
import { TooltipWrapper } from "~/shadcn/components/ui/TooltipWrapper";
import { jsonRequest } from "~/toolkit/http/fetch.utils";
import { copyTextToClipboard } from "~/toolkit/utils/clipboard.utils.client";

type ApplyInCursorButtonProps = {
  projectId: string;
  codeTaskId: string;
  disabled?: boolean;
  codePlan: string;
};

export const ApplyInCursorButton = ({
  projectId,
  codeTaskId,
  disabled = false,
  codePlan,
}: ApplyInCursorButtonProps) => {
  const [isApplying, setIsApplying] = useState(false);
  const apiUrl = useApiUrl();

  const handleApplyInCursor = async () => {
    setIsApplying(true);
    try {
      await copyTextToClipboard(codePlan);
      await jsonRequest(
        `${apiUrl}/projects/${projectId}/codeTasks/${codeTaskId}/applyPlan`,
        {
          method: "POST",
        }
      );
    } catch (error) {
      console.error("Error applying plan in Cursor:", error);
      // Optionally, add error handling UI here
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <TooltipWrapper tooltip={<p>Apply coding plan in Cursor</p>}>
      <Button
        onClick={handleApplyInCursor}
        disabled={disabled || isApplying}
        className="w-40"
      >
        {isApplying ? "Applying..." : "Apply in Cursor"}
      </Button>
    </TooltipWrapper>
  );
};
