import {
  LayoutDashboard,
  Users,
  FileText,
  Activity,
  UserPlus,
  LogIn,
  Inbox,
} from "lucide-react";

/**
 * Role-based navigation links rendered in the sidebar and navbar.
 * Each entry maps a label to a route path and a Lucide icon.
 */
export const roleNavItems = {
  Admin: [
    { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/employees", label: "Manage Employees", icon: Users },
    { to: "/admin/reports", label: "Reports", icon: FileText },
    { to: "/admin/activity-logs", label: "Activity Logs", icon: Activity },
  ],
  Receptionist: [
    {
      to: "/receptionist/dashboard",
      label: "Queue Dashboard",
      icon: LayoutDashboard,
    },
    {
      to: "/receptionist/register-visitor",
      label: "Register Visitor",
      icon: UserPlus,
    },
    { to: "/receptionist/check-in-out", label: "Check-In/Out", icon: LogIn },
    { to: "/admin/reports", label: "Visitor Reports", icon: FileText },
  ],
  Employee: [
    {
      to: "/employee/pending-requests",
      label: "Pending Requests",
      icon: Inbox,
    },
    { to: "/admin/reports", label: "Visitor Reports", icon: FileText },
  ],
};

/**
 * Returns the navigation items for a given user role.
 * @param {string} role
 * @returns {Array<{ to: string, label: string, icon: LucideIcon }>}
 */
export const getNavItemsForRole = (role) => roleNavItems[role] || [];
