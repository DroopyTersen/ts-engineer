import { useParams } from "@remix-run/react";
import { DynamicMessageInput } from "~/toolkit/ai/ui/DynamicMessageInput";
import { useLLMEventsChat } from "~/toolkit/ai/ui/useLLMEventsChat";
import { useSelectedFilesContext } from "../projects.$id/route";

export default function ChatRoute() {
  let { id } = useParams();
  let { selectedFiles } = useSelectedFilesContext();
  let { actions, messages } = useLLMEventsChat<{ selectedFiles: string[] }>({
    apiPath: `/projects/${id}/chat`,
  });
  return (
    <div className="">
      <div className="w-full max-w-4xl mx-auto mt-40">
        <DynamicMessageInput
          autoFocus={true}
          placeholder="Ask a question about the codebase..."
          handleSubmit={(input) => actions.submit(input, { selectedFiles })}
        />
      </div>
    </div>
  );
}
