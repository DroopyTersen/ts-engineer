import { Link, useLocation, useNavigation } from "@remix-run/react";
import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "~/shadcn/components/ui/tabs";

interface ProjectTabsProps {
  projectId: string;
}

let tabIds = ["summary", "chat", "codeTasks", "edit"];

export function ProjectTabs({ projectId }: ProjectTabsProps) {
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
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
      </TabsList>
    </Tabs>
  );
}
