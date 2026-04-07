import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Toaster } from "@/components/ui/sonner";
import {
  Camera,
  ChevronDown,
  Clock,
  LayoutTemplate,
  Loader2,
  LogIn,
  LogOut,
  Printer,
  ScanLine,
  Settings,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { GeneratorTab } from "./components/GeneratorTab";
import { History } from "./components/History";
import { LabelDesigner } from "./components/LabelDesigner";
import { PageSetupTab } from "./components/PageSetupTab";
import { PrintSettingsTab } from "./components/PrintSettingsTab";
import { Scanner } from "./components/Scanner";
import { SettingsTab } from "./components/SettingsTab";
import { AppProvider } from "./contexts/AppContext";
import { useInternetIdentity } from "./hooks/useInternetIdentity";

const NAV_ITEMS = [
  { value: "generator", label: "Generator", icon: ScanLine },
  { value: "scanner", label: "Scanner", icon: Camera },
  { value: "designer", label: "Label Designer", icon: LayoutTemplate },
  { value: "history", label: "History", icon: Clock },
  { value: "print", label: "Print", icon: Printer },
  { value: "settings", label: "Settings", icon: Settings },
];

function Header({
  activeTab,
  setActiveTab,
}: { activeTab: string; setActiveTab: (t: string) => void }) {
  const { login, clear, loginStatus, identity, isInitializing } =
    useInternetIdentity();
  const isLoggedIn = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  const principal = identity?.getPrincipal().toString();
  const shortPrincipal = principal
    ? `${principal.slice(0, 5)}...${principal.slice(-3)}`
    : "";

  return (
    <header className="h-14 flex items-center gap-0 bg-sidebar border-b border-sidebar-border px-4 flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 pr-4 border-r border-sidebar-border mr-3">
        <div className="w-7 h-7 rounded bg-primary/20 flex items-center justify-center">
          <ScanLine className="w-4 h-4 text-primary" />
        </div>
        <div className="leading-tight">
          <p className="text-sidebar-foreground font-semibold text-sm leading-none">
            BSG Pro
          </p>
          <p className="text-primary text-xs font-mono leading-none mt-0.5">
            BARCODE
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex items-center gap-0.5 flex-1 overflow-x-auto">
        {NAV_ITEMS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setActiveTab(value)}
            data-ocid={`nav.${value}.link`}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === value
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </nav>

      {/* Auth */}
      <div className="flex items-center gap-2 ml-2">
        {isInitializing ? (
          <Loader2 className="w-4 h-4 animate-spin text-sidebar-foreground/40" />
        ) : isLoggedIn ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground gap-1.5"
                data-ocid="nav.dropdown_menu"
              >
                <User className="w-3.5 h-3.5" />
                <span className="text-xs font-mono hidden sm:inline">
                  {shortPrincipal}
                </span>
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-xs font-mono text-muted-foreground"
                disabled
              >
                {principal?.slice(0, 20)}...
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setActiveTab("history")}
                data-ocid="nav.link"
              >
                <Clock className="w-3.5 h-3.5 mr-2" />
                History
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={clear}
                className="text-destructive focus:text-destructive"
                data-ocid="nav.button"
              >
                <LogOut className="w-3.5 h-3.5 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            size="sm"
            onClick={() => login()}
            disabled={isLoggingIn}
            className="h-8 text-xs"
            data-ocid="nav.primary_button"
          >
            {isLoggingIn ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <LogIn className="w-3.5 h-3.5 mr-1.5" />
            )}
            Login
          </Button>
        )}
      </div>
    </header>
  );
}

function AppShell() {
  const [activeTab, setActiveTab] = useState("generator");

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-hidden main-gradient">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="h-full"
        >
          {activeTab === "generator" && <GeneratorTab />}
          {activeTab === "scanner" && <Scanner />}
          {activeTab === "designer" && <LabelDesigner />}
          {activeTab === "history" && <History />}
          {activeTab === "print" && <PrintSettingsTab />}
          {activeTab === "settings" && <SettingsTab />}
        </motion.div>
      </main>
      <footer className="border-t border-sidebar-border py-2 px-4 bg-sidebar text-center">
        <p className="text-xs" style={{ color: "oklch(var(--sidebar-muted))" }}>
          &copy; {new Date().getFullYear()}. Built with &#10084; using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
