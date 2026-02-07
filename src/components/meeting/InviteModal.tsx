import { useState } from "react";
import { cn } from "@/lib/utils";
import { 
  Copy, 
  Check, 
  Mail, 
  Link2, 
  Users,
  Send,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingId: string;
  meetingTitle: string;
}

export function InviteModal({
  isOpen,
  onClose,
  meetingId,
  meetingTitle,
}: InviteModalProps) {
  const [email, setEmail] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Generate meeting link
  const meetingLink = `${window.location.origin}/meeting/${meetingId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(meetingLink);
      setIsCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  const handleAddEmail = () => {
    if (email && email.includes("@") && !emails.includes(email)) {
      setEmails([...emails, email]);
      setEmail("");
    }
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setEmails(emails.filter(e => e !== emailToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddEmail();
    }
  };

  const handleSendInvites = async () => {
    if (emails.length === 0) {
      toast.error("Add at least one email address");
      return;
    }

    setIsSending(true);
    
    // Simulate sending invites (in production, call edge function)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success(`Invites sent to ${emails.length} people`);
    setEmails([]);
    setIsSending(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-surface-1 border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Invite to meeting
          </DialogTitle>
          <DialogDescription>
            Share the link or send email invitations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Meeting Info */}
          <div className="glass-panel rounded-lg p-3">
            <p className="text-sm font-medium text-foreground">{meetingTitle}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Anyone with the link can join
            </p>
          </div>

          {/* Copy Link Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              Meeting link
            </label>
            <div className="flex gap-2">
              <Input
                value={meetingLink}
                readOnly
                className="bg-surface-2 border-border/50 text-sm font-mono"
              />
              <Button
                variant="secondary"
                size="icon"
                onClick={handleCopyLink}
                className="shrink-0"
              >
                {isCopied ? (
                  <Check className="w-4 h-4 text-primary" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border/50" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border/50" />
          </div>

          {/* Email Invite Section */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Invite by email
            </label>
            
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="colleague@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                className="bg-surface-2 border-border/50"
              />
              <Button
                variant="secondary"
                onClick={handleAddEmail}
                disabled={!email || !email.includes("@")}
              >
                Add
              </Button>
            </div>

            {/* Email Tags */}
            {emails.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {emails.map((e) => (
                  <div
                    key={e}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface-3 text-sm"
                  >
                    <span className="text-foreground">{e}</span>
                    <button
                      onClick={() => handleRemoveEmail(e)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {emails.length > 0 && (
              <Button
                className="w-full"
                onClick={handleSendInvites}
                disabled={isSending}
              >
                {isSending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send {emails.length} invite{emails.length > 1 ? "s" : ""}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
