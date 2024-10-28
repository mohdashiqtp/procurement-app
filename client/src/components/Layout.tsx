import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { SideMenu } from "./SideMenu";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface LayoutProps {
  className?: string;
}

export default function Layout({ className }: LayoutProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className={cn("flex h-screen w-full overflow-hidden", className)}>
      <aside
        className={cn(
          "border-r transition-all duration-300 ease-in-out",
          isExpanded ? "w-60" : "w-[70px]"
        )}
      >
        <SideMenu 
          isExpanded={isExpanded} 
          setIsExpanded={setIsExpanded} 
        />
      </aside>
      <div className="flex w-full flex-1 flex-col overflow-hidden">
        <Header />
        <Separator />
        <ScrollArea className="flex-1">
          <main className="flex-1 bg-background p-4">
            <Outlet />
          </main>
        </ScrollArea>
      </div>
    </div>
  );
}
