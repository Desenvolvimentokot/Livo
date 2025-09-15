import { FileText, Clock, User, Check } from "lucide-react";

interface StatsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  icon: "file-text" | "clock" | "user" | "check";
  color: "primary" | "secondary" | "accent" | "green";
}

const iconMap = {
  "file-text": FileText,
  clock: Clock,
  user: User,
  check: Check,
};

const colorMap = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary", 
  accent: "bg-accent/10 text-accent",
  green: "bg-green-100 text-green-600",
};

export default function StatsCard({ title, value, icon, color, ...props }: StatsCardProps) {
  const Icon = iconMap[icon];
  
  return (
    <div className="bg-card border border-border rounded-xl p-6" {...props}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
