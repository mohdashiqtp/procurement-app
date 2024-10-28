import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ChevronFirst,
  ChevronLast,
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
} from "lucide-react";

interface SideMenuProps {
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  className?: string;
}

interface NavItemProps {
  icon: React.ReactNode;
  title: string;
  to: string;
  isExpanded: boolean;
}

const NavItem = ({ icon, title, to, isExpanded }: NavItemProps) => {
  const iconClass = isExpanded ? "text-foreground" : "text-black";

  const content = (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
          "hover:bg-accent/50 hover:text-accent-foreground hover:shadow-sm",
          "active:scale-[0.98]",
          isActive
            ? "bg-primary text-primary-foreground shadow-inner font-medium"
            : "text-muted-foreground"
        )
      }
    >
      {React.cloneElement(icon, { className: iconClass })} 
      {isExpanded && (
        <motion.span
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: "auto" }}
          exit={{ opacity: 0, width: 0 }}
          transition={{ duration: 0.2 }}
          className="whitespace-nowrap overflow-hidden font-medium"
        >
          {title}
        </motion.span>
      )}
    </NavLink>
  );

  if (!isExpanded) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {title}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
};


export function SideMenu({ isExpanded, setIsExpanded, className }: SideMenuProps) {
  const navigationItems = [
    {
      title: "Dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
      to: "/",
    },
    {
      title: "Purchase Orders",
      icon: <ShoppingCart className="w-5 h-5" />,
      to: "/purchase-order",
    },
    {
      title: "Suppliers",
      icon: <Users className="w-5 h-5" />,
      to: "/suppliers",
    },
    {
      title: "Items",
      icon: <Package className="w-5 h-5" />,
      to: "/items",
    },
  ];

  return (
    <motion.div
      animate={{ width: isExpanded ? 240 : 80 }}
      className={cn(
        "flex flex-col min-h-screen bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "border-r shadow-sm relative",
        className
      )}
    >
      <div className="flex items-center h-14 px-4 border-b">
        {isExpanded ? (
          <div className="flex items-center justify-between w-full">
            <span className="font-semibold text-lg">Menu</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsExpanded(false)}
              className="h-8 w-8"
            >
              <ChevronFirst className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex justify-center w-full">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsExpanded(true)}
              className="h-8 w-8 bg-background"
            >
              <ChevronLast className="h-4 w-4 text-foreground" />
            </Button>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1 p-3">
          {navigationItems.map((item) => (
            <NavItem
              key={item.to}
              icon={item.icon}
              title={item.title}
              to={item.to}
              isExpanded={isExpanded}
            />
          ))}
        </div>
      </ScrollArea>
    </motion.div>
  );
}
