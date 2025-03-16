import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
/*import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";*/
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Chat } from "../chatarea/Chat";
import { AddApiForm } from "../apiForm/AddApiForm";

export function DashBoard() {
  const [activeView, setActiveView] = useState("Chat History");

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "350px",
      }}
    >
      <AppSidebar onNavItemClick={setActiveView} />
      <SidebarInset>
        <header className="sticky top-0 flex shrink-0 items-center gap-2 border-b bg-background p-4">
          <SidebarTrigger className="-ml-1" />
          <h1 className="text-lg font-medium">{activeView}</h1>
        </header>
        {activeView === "Chat History" ? (
          <Chat />
        ) : activeView === " Add API" ? (
          <AddApiForm />
        ) : null}
      </SidebarInset>
    </SidebarProvider>
  );
}
