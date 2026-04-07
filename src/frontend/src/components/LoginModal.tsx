import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Lock, LogIn } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

export function LoginModal({ open, onClose }: LoginModalProps) {
  const { login, isLoggingIn } = useInternetIdentity();

  function handleLogin() {
    login();
    onClose();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      data-ocid="login.dialog"
    >
      <DialogContent className="sm:max-w-md" data-ocid="login.modal">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <DialogTitle className="text-lg">Login Required</DialogTitle>
          </div>
          <DialogDescription>
            You&apos;ve used your free print preview. Log in with Internet
            Identity to unlock unlimited printing, save series, and access all
            features.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
          <p className="font-medium text-foreground">
            With a free account you get:
          </p>
          <ul className="space-y-1 text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="text-primary">✓</span> Unlimited print previews &
              prints
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">✓</span> Save barcode series to the
              cloud
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">✓</span> Access history across
              devices
            </li>
          </ul>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="login.cancel_button"
          >
            Maybe Later
          </Button>
          <Button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="flex-1"
            data-ocid="login.primary_button"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Login with Internet Identity
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
