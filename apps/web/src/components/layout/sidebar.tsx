"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  BarChart3,
  MessageSquare,
  Calendar,
  Settings,
  HelpCircle,
  Bell,
  Building2,
  Star,
  Target,
  Zap,
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Projects",
    href: "/projects",
    icon: FolderOpen,
  },
  {
    name: "Team",
    href: "/team",
    icon: Users,
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    name: "Messages",
    href: "/messages",
    icon: MessageSquare,
  },
  {
    name: "Calendar",
    href: "/calendar",
    icon: Calendar,
  },
];

const secondaryNavigation = [
  {
    name: "Notifications",
    href: "/notifications",
    icon: Bell,
  },
  {
    name: "Help & Support",
    href: "/support",
    icon: HelpCircle,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 shadow-sm border-r border-gray-200">
      <div className="flex h-16 shrink-0 items-center">
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Nexus</h1>
          </div>
        </div>
      </div>
      
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        isActive
                          ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                          : "text-gray-700 hover:text-blue-700 hover:bg-gray-50",
                        "group flex gap-x-3 rounded-l-md py-2 pl-2 pr-3 text-sm leading-6 font-medium transition-colors"
                      )}
                    >
                      <item.icon
                        className={cn(
                          isActive ? "text-blue-700" : "text-gray-400 group-hover:text-blue-700",
                          "h-5 w-5 shrink-0"
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>
          
          <li>
            <div className="text-xs font-semibold leading-6 text-gray-400 uppercase tracking-wide">
              Account
            </div>
            <ul role="list" className="-mx-2 mt-2 space-y-1">
              {secondaryNavigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        isActive
                          ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                          : "text-gray-700 hover:text-blue-700 hover:bg-gray-50",
                        "group flex gap-x-3 rounded-l-md py-2 pl-2 pr-3 text-sm leading-6 font-medium transition-colors"
                      )}
                    >
                      <item.icon
                        className={cn(
                          isActive ? "text-blue-700" : "text-gray-400 group-hover:text-blue-700",
                          "h-5 w-5 shrink-0"
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>

          {/* Upgrade Banner */}
          <li className="mt-auto">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-4 text-white">
              <div className="flex items-center mb-2">
                <Star className="h-5 w-5 mr-2" />
                <span className="font-medium">Upgrade to Pro</span>
              </div>
              <p className="text-sm text-blue-100 mb-3">
                Unlock advanced features and unlimited projects.
              </p>
              <Link
                href="/upgrade"
                className="block w-full bg-white text-blue-600 text-center py-2 px-3 rounded-md text-sm font-medium hover:bg-blue-50 transition-colors"
              >
                Upgrade Now
              </Link>
            </div>
          </li>
        </ul>
      </nav>
    </div>
  );
}
