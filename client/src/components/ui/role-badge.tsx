import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Shield, 
  Stethoscope, 
  UserCheck, 
  User, 
  Pill 
} from "lucide-react";

interface RoleBadgeProps {
  role: string;
  className?: string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

const roleConfig = {
  admin: {
    label: "Administrator",
    color: "bg-medical-blue text-white",
    icon: Shield,
    shortLabel: "Admin"
  },
  doctor: {
    label: "Doctor",
    color: "bg-health-green text-white",
    icon: Stethoscope,
    shortLabel: "Doctor"
  },
  nurse: {
    label: "Nurse",
    color: "bg-alert-orange text-white",
    icon: UserCheck,
    shortLabel: "Nurse"
  },
  patient: {
    label: "Patient",
    color: "bg-gray-600 text-white",
    icon: User,
    shortLabel: "Patient"
  },
  pharmacy: {
    label: "Pharmacy Staff",
    color: "bg-purple-600 text-white",
    icon: Pill,
    shortLabel: "Pharmacy"
  }
};

export function RoleBadge({ 
  role, 
  className, 
  showIcon = true, 
  size = "md" 
}: RoleBadgeProps) {
  const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.patient;
  const IconComponent = config.icon;

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5"
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };

  return (
    <Badge 
      className={cn(
        config.color,
        sizeClasses[size],
        "font-medium inline-flex items-center gap-1.5",
        className
      )}
    >
      {showIcon && (
        <IconComponent className={iconSizes[size]} />
      )}
      <span>{size === "sm" ? config.shortLabel : config.label}</span>
    </Badge>
  );
}
