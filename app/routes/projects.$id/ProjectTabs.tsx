import { Link, useLocation, useNavigation } from "@remix-run/react";
import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "~/shadcn/components/ui/tabs";

let tabIds = ["summary", "chat", "codeTasks", "edit", "markdown"];

export default function ProjectTabs({
  projectId,
  selectedFiles,
}: {
  projectId: string;
  selectedFiles: string[];
}) {
  let { pathname } = useLocation();
  let navigation = useNavigation();

  let targetPath = navigation.location?.pathname || pathname;
  let [activeTab, setActiveTab] = useState(() => {
    return tabIds.find((tabId) => targetPath.includes(tabId)) || "summary";
  });
  useEffect(() => {
    setActiveTab(
      tabIds.find((tabId) => targetPath.includes(tabId)) || "summary"
    );
  }, [targetPath]);

  return (
    <Tabs defaultValue={activeTab} className="w-full">
      <TabsList>
        <TabsTrigger value="summary" asChild>
          <Link to={`/projects/${projectId}/summary`}>Summary</Link>
        </TabsTrigger>
        <TabsTrigger value="chat" asChild>
          <Link to={`/projects/${projectId}/chat`}>Chat</Link>
        </TabsTrigger>
        <TabsTrigger value="codeTasks" asChild>
          <Link to={`/projects/${projectId}/codeTasks`}>Code Tasks</Link>
        </TabsTrigger>
        <TabsTrigger value="edit" asChild>
          <Link to={`/projects/${projectId}/edit`}>Edit</Link>
        </TabsTrigger>
        {selectedFiles?.length > 0 && (
          <TabsTrigger value="markdown" asChild>
            <Link to={`/projects/${projectId}/markdown`}>Markdown</Link>
          </TabsTrigger>
        )}
      </TabsList>
    </Tabs>
  );
}
