import { cn } from "@/lib/utils";
import { Participant } from "@/types/meeting";
import { Shield, Star, User, UserCheck, Users } from "lucide-react";

interface RoleCardProps {
  participant: Participant;
  expanded?: boolean;
  className?: string;
}

const authorityIcons = {
  executive: Shield,
  lead: Star,
  senior: UserCheck,
  member: User,
  guest: Users,
};

const authorityLabels = {
  executive: "Executive",
  lead: "Team Lead",
  senior: "Senior",
  member: "Member",
  guest: "Guest",
};

const authorityColors = {
  executive: "text-aurora-violet border-aurora-violet/30 bg-aurora-violet/10",
  lead: "text-aurora-teal border-aurora-teal/30 bg-aurora-teal/10",
  senior: "text-aurora-cyan border-aurora-cyan/30 bg-aurora-cyan/10",
  member: "text-muted-foreground border-border bg-surface-2",
  guest: "text-muted-foreground/70 border-border/50 bg-surface-1",
};

const availabilityColors = {
  available: "bg-aurora-teal",
  busy: "bg-aurora-rose",
  away: "bg-muted-foreground",
};

export function RoleCard({ participant, expanded = false, className }: RoleCardProps) {
  const AuthorityIcon = authorityIcons[participant.role.authorityLevel];

  return (
    <div
      className={cn(
        "glass-panel rounded-xl p-4 transition-all duration-300",
        expanded ? "scale-in" : "",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative">
          <img
            src={participant.avatar}
            alt={participant.name}
            className="w-12 h-12 rounded-full object-cover"
          />
          {/* Availability Dot */}
          <div
            className={cn(
              "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card",
              availabilityColors[participant.role.availability]
            )}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-foreground truncate">
              {participant.name}
            </h4>
            {participant.isHost && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-aurora-violet/20 text-aurora-violet font-medium">
                Host
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {participant.role.title}
          </p>
        </div>
      </div>

      {/* Authority Badge */}
      <div className="mt-3">
        <div
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium",
            authorityColors[participant.role.authorityLevel]
          )}
        >
          <AuthorityIcon className="w-3.5 h-3.5" />
          {authorityLabels[participant.role.authorityLevel]}
        </div>
      </div>

      {/* Skills (Expanded View) */}
      {expanded && (
        <div className="mt-4 pt-3 border-t border-border/50 fade-in">
          <p className="text-xs text-muted-foreground mb-2">Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {participant.role.skills.map((skill) => (
              <span
                key={skill}
                className="text-xs px-2 py-1 rounded-md bg-surface-2 text-foreground/80"
              >
                {skill}
              </span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3 mb-2">Department</p>
          <span className="text-sm text-foreground">
            {participant.role.department}
          </span>
        </div>
      )}
    </div>
  );
}
