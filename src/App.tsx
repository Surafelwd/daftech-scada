import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Droplets, 
  Activity, 
  Terminal, 
  Settings, 
  Menu, 
  X, 
  Bell, 
  LogIn, 
  LogOut,
  AlertTriangle,
  FileText,
  Map,
  ShieldCheck,
  Globe,
  Home,
  Wifi,
  DollarSign,
  Wrench
} from "lucide-react";
import { useState } from "react";
import { cn } from "./lib/utils";
import Dashboard from "./pages/Dashboard";
import MeterList from "./pages/MeterList";
import MeterDetail from "./pages/MeterDetail";
import CommandCenter from "./pages/CommandCenter";
import Analytics from "./pages/Analytics";
import Alarms from "./pages/Alarms";
import Reports from "./pages/Reports";
import SiteManagement from "./pages/SiteManagement";
import Integration from "./pages/Integration";
import SystemAdmin from "./pages/SystemAdmin";
import HardwareSpecs from "./pages/HardwareSpecs";

import { FirebaseProvider, useAuth } from "./components/FirebaseProvider";
import ErrorBoundary from "./components/ErrorBoundary";
import { signIn, logOut } from "./firebase";
import { WelcomePage } from "./pages/Welcome";

const navItems = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Meters", path: "/meters", icon: Droplets },
  { name: "Alarms", path: "/alarms", icon: AlertTriangle },
  { name: "Commands", path: "/commands", icon: Terminal },
  { name: "Analytics", path: "/analytics", icon: Activity },
  { name: "Reports", path: "/reports", icon: FileText },
  { name: "Sites", path: "/sites", icon: Map },
  { name: "Integration", path: "/integration", icon: Globe },
  { name: "Admin", path: "/admin", icon: ShieldCheck },
];

function Nav({ isOpen, setIsOpen, onReturnWelcome }: { isOpen: boolean; setIsOpen: (val: boolean) => void; onReturnWelcome: () => void }) {
  const location = useLocation();
  const { user, role } = useAuth();

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity cursor-pointer" 
          onClick={() => setIsOpen(false)}
        />
      )}

      <nav className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-zinc-900 text-zinc-400 border-r border-zinc-800 transition-transform",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6">
          <div className="flex items-center justify-between text-white mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <Globe size={20} />
              </div>
              <span className="font-bold text-xl tracking-tight italic serif">Daftech SCADA</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                  location.pathname === item.path 
                    ? "bg-zinc-800 text-white" 
                    : "hover:bg-zinc-800/50 hover:text-zinc-200"
                )}
              >
                <item.icon size={18} />
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-zinc-800">
          <div className="px-3 py-2 text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">
            Role: <span className="text-blue-400">{role || "Guest"}</span>
          </div>
          <button
            onClick={() => {
              setIsOpen(false);
              onReturnWelcome();
            }}
            className="flex w-full items-center gap-3 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
          >
            <Home size={18} />
            <span>Welcome Screen</span>
          </button>
          <button 
            onClick={() => logOut()}
            className="flex w-full items-center gap-3 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors mt-1"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </nav>
    </>
  );
}

function Header({ toggleMenu, onReturnWelcome }: { toggleMenu: () => void; onReturnWelcome: () => void }) {
  const { user } = useAuth();
  return (
    <header className="h-16 border-b border-zinc-200 bg-white flex items-center justify-between px-4 sm:px-8 sticky top-0 z-30">
      <div className="flex items-center gap-2 sm:gap-4">
        <button 
          onClick={toggleMenu}
          className="p-2 -ml-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
          aria-label="Toggle Menu"
        >
          <Menu size={24} />
        </button>
        <h1 className="text-base sm:text-lg font-semibold text-zinc-900 italic serif truncate">Daftech SCADA</h1>
      </div>
      <div className="flex items-center gap-4">
        <button 
          onClick={onReturnWelcome}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors mr-2"
          title="Return to Welcome Screen"
        >
          <Home size={16} />
          Welcome Screen
        </button>
        <button className="p-2 text-zinc-500 hover:text-zinc-900 transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-zinc-900">{user?.displayName}</p>
            <p className="text-[10px] text-zinc-500 font-medium">{user?.email}</p>
          </div>
          <div className="w-8 h-8 bg-zinc-200 rounded-full flex items-center justify-center text-xs font-bold text-zinc-600 overflow-hidden">
            {user?.photoURL ? <img src={user.photoURL} alt="Avatar" /> : "SW"}
          </div>
        </div>
      </div>
    </header>
  );
}

function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-6">
      <div className="max-w-md w-full bg-white border border-zinc-200 rounded-2xl p-8 shadow-xl text-center space-y-8">
        <div className="w-16 h-16 bg-zinc-900 text-blue-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-zinc-900/20">
          <Globe size={32} />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-zinc-900 italic serif tracking-tight">Daftech SCADA</h1>
          <p className="text-sm text-zinc-500 leading-relaxed">
            Enterprise IoT water meter monitoring and control platform. Please sign in to access the dashboard.
          </p>
        </div>
        <button
          onClick={() => signIn().catch(console.error)}
          className="w-full py-4 bg-zinc-900 text-white text-sm font-bold uppercase tracking-widest rounded-xl flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/10"
        >
          <LogIn size={18} />
          Sign in with Google
        </button>
        <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest">
          Secure Access Control • Audit Enabled
        </p>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const navigate = useNavigate();

  if (showWelcome) return <WelcomePage onEnter={(path) => {
    setShowWelcome(false);
    if (path) navigate(path);
  }} />;

  // DEVELOPMENT BYPASS: Skip loading and login screens
  // if (loading) return <div className="min-h-screen flex items-center justify-center bg-zinc-900 text-white italic serif">Initializing Daftech SCADA...</div>;
  // if (!user) return <Login />;

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      <Nav isOpen={isNavOpen} setIsOpen={setIsNavOpen} onReturnWelcome={() => setShowWelcome(true)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          toggleMenu={() => setIsNavOpen(!isNavOpen)} 
          onReturnWelcome={() => setShowWelcome(true)} 
        />
        <main className="p-8 max-w-7xl mx-auto w-full">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/meters" element={<MeterList />} />
            <Route path="/meters/:id" element={<MeterDetail />} />
            <Route path="/alarms" element={<Alarms />} />
            <Route path="/commands" element={<CommandCenter />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/sites" element={<SiteManagement />} />
            <Route path="/integration" element={<Integration />} />
            <Route path="/admin" element={<SystemAdmin />} />
            <Route path="/hardware" element={<HardwareSpecs />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <FirebaseProvider>
      <Router>
        <AppWithBoundary />
      </Router>
    </FirebaseProvider>
  );
}

function AppWithBoundary() {
  const location = useLocation();
  return (
    <ErrorBoundary resetKey={location.pathname}>
      <AppContent />
    </ErrorBoundary>
  );
}
