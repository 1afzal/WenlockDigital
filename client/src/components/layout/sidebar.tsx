import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Ticket,
  UserPlus,
  Heart,
  Scissors,
  Pill,
  AlertTriangle,
  Settings,
  ClipboardList,
  Hospital,
  UserCheck,
  Stethoscope,
  Package,
  FileText
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

const navigationItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    roles: ["admin", "doctor", "nurse", "patient", "pharmacy"]
  },
  {
    title: "Patient Registry",
    href: "/patients",
    icon: Users,
    roles: ["admin", "doctor", "nurse"]
  },
  {
    title: "Appointments",
    href: "/appointments",
    icon: Calendar,
    roles: ["admin", "doctor", "nurse", "patient"]
  },
  {
    title: "Token Management",
    href: "/tokens",
    icon: Ticket,
    roles: ["admin", "nurse"]
  },
  {
    title: "Doctors",
    href: "/doctors",
    icon: Stethoscope,
    roles: ["admin"]
  },
  {
    title: "Nurses",
    href: "/nurses",
    icon: UserCheck,
    roles: ["admin"]
  },
  {
    title: "Pharmacy Staff",
    href: "/pharmacy-staff",
    icon: UserPlus,
    roles: ["admin"]
  },
  {
    title: "Departments",
    href: "/departments",
    icon: Hospital,
    roles: ["admin"]
  },
  {
    title: "Prescriptions",
    href: "/prescriptions",
    icon: FileText,
    roles: ["doctor", "pharmacy"]
  },
  {
    title: "Drug Inventory",
    href: "/inventory",
    icon: Package,
    roles: ["pharmacy", "admin"]
  },
  {
    title: "Operation Theatre",
    href: "/operation-theatre",
    icon: Scissors,
    roles: ["admin", "doctor"]
  },
  {
    title: "Emergency Alerts",
    href: "/emergency",
    icon: AlertTriangle,
    roles: ["admin", "doctor", "nurse"]
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["admin"]
  },
  {
    title: "Audit Logs",
    href: "/audit",
    icon: ClipboardList,
    roles: ["admin"]
  }
];

const departmentItems = [
  { title: "Cardiology", href: "/departments/cardiology", icon: Heart },
  { title: "Operation Theatre", href: "/departments/ot", icon: Scissors },
  { title: "Pharmacy", href: "/departments/pharmacy", icon: Pill },
  { title: "Emergency", href: "/departments/emergency", icon: AlertTriangle }
];

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  if (!user) return null;

  const filteredNavItems = navigationItems.filter(item => 
    item.roles.includes(user.role)
  );

  const isActive = (href: string) => {
    if (href === "/") {
      return location === "/" || location === `/${user.role}`;
    }
    return location === href;
  };

  return (
    <aside className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
      <div className="p-4">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-medical-blue rounded-lg flex items-center justify-center">
            <Hospital className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Wenlock Hospital</h1>
            <p className="text-xs text-gray-500">Management System</p>
          </div>
        </div>

        <nav className="space-y-2">
          {/* Overview Section */}
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Overview
            </h3>
            <Link href={`/${user.role}`}>
              <a className={cn(
                "flex items-center px-3 py-2 rounded-lg font-medium transition-colors",
                isActive("/") 
                  ? "text-medical-blue bg-blue-50" 
                  : "text-gray-700 hover:bg-gray-100"
              )}>
                <LayoutDashboard className="w-5 h-5 mr-3" />
                Dashboard
              </a>
            </Link>
          </div>

          {/* Main Navigation */}
          {user.role === "admin" && (
            <>
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Patient Management
                </h3>
                <div className="space-y-1">
                  <Link href="/patients">
                    <a className={cn(
                      "flex items-center px-3 py-2 rounded-lg transition-colors",
                      isActive("/patients") 
                        ? "text-medical-blue bg-blue-50" 
                        : "text-gray-700 hover:bg-gray-100"
                    )}>
                      <Users className="w-5 h-5 mr-3" />
                      Patient Registry
                    </a>
                  </Link>
                  <Link href="/appointments">
                    <a className={cn(
                      "flex items-center px-3 py-2 rounded-lg transition-colors",
                      isActive("/appointments") 
                        ? "text-medical-blue bg-blue-50" 
                        : "text-gray-700 hover:bg-gray-100"
                    )}>
                      <Calendar className="w-5 h-5 mr-3" />
                      Appointments
                    </a>
                  </Link>
                  <Link href="/tokens">
                    <a className={cn(
                      "flex items-center px-3 py-2 rounded-lg transition-colors",
                      isActive("/tokens") 
                        ? "text-medical-blue bg-blue-50" 
                        : "text-gray-700 hover:bg-gray-100"
                    )}>
                      <Ticket className="w-5 h-5 mr-3" />
                      Token Management
                    </a>
                  </Link>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Staff Management
                </h3>
                <div className="space-y-1">
                  <Link href="/doctors">
                    <a className={cn(
                      "flex items-center px-3 py-2 rounded-lg transition-colors",
                      isActive("/doctors") 
                        ? "text-medical-blue bg-blue-50" 
                        : "text-gray-700 hover:bg-gray-100"
                    )}>
                      <Stethoscope className="w-5 h-5 mr-3" />
                      Doctors
                    </a>
                  </Link>
                  <Link href="/nurses">
                    <a className={cn(
                      "flex items-center px-3 py-2 rounded-lg transition-colors",
                      isActive("/nurses") 
                        ? "text-medical-blue bg-blue-50" 
                        : "text-gray-700 hover:bg-gray-100"
                    )}>
                      <UserCheck className="w-5 h-5 mr-3" />
                      Nurses
                    </a>
                  </Link>
                  <Link href="/pharmacy-staff">
                    <a className={cn(
                      "flex items-center px-3 py-2 rounded-lg transition-colors",
                      isActive("/pharmacy-staff") 
                        ? "text-medical-blue bg-blue-50" 
                        : "text-gray-700 hover:bg-gray-100"
                    )}>
                      <Pill className="w-5 h-5 mr-3" />
                      Pharmacy Staff
                    </a>
                  </Link>
                </div>
              </div>
            </>
          )}

          {/* Department specific items */}
          {user.role !== "patient" && (
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Departments
              </h3>
              <div className="space-y-1">
                {departmentItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <a className={cn(
                      "flex items-center px-3 py-2 rounded-lg transition-colors",
                      isActive(item.href) 
                        ? "text-medical-blue bg-blue-50" 
                        : "text-gray-700 hover:bg-gray-100"
                    )}>
                      <item.icon className="w-5 h-5 mr-3" />
                      {item.title}
                    </a>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Role specific items */}
          {user.role === "doctor" && (
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Medical
              </h3>
              <div className="space-y-1">
                <Link href="/prescriptions">
                  <a className={cn(
                    "flex items-center px-3 py-2 rounded-lg transition-colors",
                    isActive("/prescriptions") 
                      ? "text-medical-blue bg-blue-50" 
                      : "text-gray-700 hover:bg-gray-100"
                  )}>
                    <FileText className="w-5 h-5 mr-3" />
                    Prescriptions
                  </a>
                </Link>
              </div>
            </div>
          )}

          {user.role === "pharmacy" && (
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Pharmacy
              </h3>
              <div className="space-y-1">
                <Link href="/prescriptions">
                  <a className={cn(
                    "flex items-center px-3 py-2 rounded-lg transition-colors",
                    isActive("/prescriptions") 
                      ? "text-medical-blue bg-blue-50" 
                      : "text-gray-700 hover:bg-gray-100"
                  )}>
                    <FileText className="w-5 h-5 mr-3" />
                    Prescriptions
                  </a>
                </Link>
                <Link href="/inventory">
                  <a className={cn(
                    "flex items-center px-3 py-2 rounded-lg transition-colors",
                    isActive("/inventory") 
                      ? "text-medical-blue bg-blue-50" 
                      : "text-gray-700 hover:bg-gray-100"
                  )}>
                    <Package className="w-5 h-5 mr-3" />
                    Drug Inventory
                  </a>
                </Link>
              </div>
            </div>
          )}

          {user.role === "patient" && (
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                My Health
              </h3>
              <div className="space-y-1">
                <Link href="/my-appointments">
                  <a className={cn(
                    "flex items-center px-3 py-2 rounded-lg transition-colors",
                    isActive("/my-appointments") 
                      ? "text-medical-blue bg-blue-50" 
                      : "text-gray-700 hover:bg-gray-100"
                  )}>
                    <Calendar className="w-5 h-5 mr-3" />
                    My Appointments
                  </a>
                </Link>
                <Link href="/my-prescriptions">
                  <a className={cn(
                    "flex items-center px-3 py-2 rounded-lg transition-colors",
                    isActive("/my-prescriptions") 
                      ? "text-medical-blue bg-blue-50" 
                      : "text-gray-700 hover:bg-gray-100"
                  )}>
                    <FileText className="w-5 h-5 mr-3" />
                    My Prescriptions
                  </a>
                </Link>
              </div>
            </div>
          )}

          {/* System section for admin */}
          {user.role === "admin" && (
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                System
              </h3>
              <div className="space-y-1">
                <Link href="/settings">
                  <a className={cn(
                    "flex items-center px-3 py-2 rounded-lg transition-colors",
                    isActive("/settings") 
                      ? "text-medical-blue bg-blue-50" 
                      : "text-gray-700 hover:bg-gray-100"
                  )}>
                    <Settings className="w-5 h-5 mr-3" />
                    Settings
                  </a>
                </Link>
                <Link href="/audit">
                  <a className={cn(
                    "flex items-center px-3 py-2 rounded-lg transition-colors",
                    isActive("/audit") 
                      ? "text-medical-blue bg-blue-50" 
                      : "text-gray-700 hover:bg-gray-100"
                  )}>
                    <ClipboardList className="w-5 h-5 mr-3" />
                    Audit Logs
                  </a>
                </Link>
              </div>
            </div>
          )}
        </nav>
      </div>
    </aside>
  );
}
