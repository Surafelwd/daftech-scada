import { useEffect, useState } from "react";
import { api } from "../services/api";
import { Meter, Command, CommandStatus } from "../types";
import { Terminal, Send, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, Activity, Cpu, Search } from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../components/FirebaseProvider";
import { motion, AnimatePresence } from "framer-motion";

const CommandStatusBadge = ({ status }: { status: CommandStatus }) => {
  const config = {
    [CommandStatus.QUEUED]: { icon: Clock, color: "text-zinc-500 bg-zinc-50 border-zinc-200" },
    [CommandStatus.SENT]: { icon: Send, color: "text-blue-500 bg-blue-50 border-blue-200" },
    [CommandStatus.ACK]: { icon: CheckCircle, color: "text-green-600 bg-green-50 border-green-200" },
    [CommandStatus.NACK]: { icon: XCircle, color: "text-red-600 bg-red-50 border-red-200" },
    [CommandStatus.TIMEOUT]: { icon: AlertCircle, color: "text-orange-600 bg-orange-50 border-orange-200" },
    [CommandStatus.RETRY_EXHAUSTED]: { icon: AlertCircle, color: "text-red-900 bg-red-100 border-red-300" },
  };
  const { icon: Icon, color } = config[status];
  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shrink-0", color)}
    >
      <Icon size={10} />
      {status.replace('_', ' ')}
    </motion.div>
  );
};

export default function CommandCenter() {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [selectedMeter, setSelectedMeter] = useState<string>("");
  const [commandType, setCommandType] = useState<string>("REBOOT");
  const [payload, setPayload] = useState<string>("{}");
  const [commands, setCommands] = useState<Command[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    api.meters.list().then(setMeters);
  }, []);

  const handleSendCommand = async () => {
    if (!selectedMeter) return;
    setLoading(true);
    try {
      const p = JSON.parse(payload);
      const userId = user?.uid ?? "local-operator";
      await api.commands.send(selectedMeter, commandType, p, userId);
      const updated = await api.commands.list(selectedMeter);
      setCommands(updated);
    } catch (e) {
      alert("Invalid JSON payload");
    } finally {
      setLoading(false);
    }
  };

  const handleMeterChange = async (id: string) => {
    setSelectedMeter(id);
    if (id) {
      setHistoryLoading(true);
      const history = await api.commands.list(id);
      setCommands(history);
      setHistoryLoading(false);
    } else {
      setCommands([]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
      {/* Header section with refined typography and subtle activity signals */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-100 pb-8">
        <div>
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-2 mb-2"
          >
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white">
              <Cpu size={18} />
            </div>
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.25em]">Utility Fleet OS v2.4</span>
          </motion.div>
          <h1 className="text-4xl font-extrabold text-zinc-900 tracking-tighter leading-none">
            Command Center
          </h1>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Operator System</span>
            <span className="text-xs font-mono font-bold text-zinc-900 uppercase">{user?.email || "GUEST"}</span>
          </div>
          <div className="h-8 w-px bg-zinc-100" />
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Gateway Sync</span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-green-600 uppercase">
                <Activity size={12} className="animate-pulse" />
                Active
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Command Console */}
        <div className="lg:col-span-4 space-y-8">
          <section className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
              <h2 className="text-xs font-black text-zinc-900 uppercase tracking-[0.2em] flex items-center gap-2">
                <Terminal size={14} className="text-zinc-400" />
                New Instruction
              </h2>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="group">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 block group-focus-within:text-blue-600 transition-colors">Target Hardware</label>
                  <select 
                    value={selectedMeter}
                    onChange={(e) => handleMeterChange(e.target.value)}
                    className="w-full h-11 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717a' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
                  >
                    <option value="">Select ID...</option>
                    {meters.map(m => (
                      <option key={m.meter_id || m.id} value={m.meter_id || m.id}>{(m as any).meter_id || m.id} — {m.serial_number || 'Unknown'}</option>
                    ))}
                  </select>
                </div>

                <div className="group">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 block group-focus-within:text-blue-600 transition-colors">Function Type</label>
                  <select 
                    value={commandType}
                    onChange={(e) => setCommandType(e.target.value)}
                    className="w-full h-11 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717a' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
                  >
                    <option value="REBOOT">REBOOT SYSTEM</option>
                    <option value="FIRMWARE_UPDATE">FIRMWARE DEPLOYMENT</option>
                    <option value="SET_SYNC_INTERVAL">CALIBRATE SYNC WINDOW</option>
                    <option value="CLEAR_ALARMS">RESET DIAGNOSTICS</option>
                    <option value="VALVE_CLOSE">ACTUATOR: TERMINATE</option>
                    <option value="VALVE_OPEN">ACTUATOR: INITIATE</option>
                  </select>
                </div>

                <div className="group">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 block group-focus-within:text-blue-600 transition-colors">Parameters (JSON)</label>
                  <div className="relative rounded-xl overflow-hidden border border-zinc-800 transition-colors">
                    <textarea 
                      value={payload}
                      onChange={(e) => setPayload(e.target.value)}
                      rows={5}
                      className="w-full p-4 bg-zinc-950 text-emerald-400 text-xs font-mono focus:outline-none placeholder-zinc-700 resize-none"
                      style={{ caretColor: '#10b981' }}
                    />
                  </div>
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSendCommand}
                disabled={!selectedMeter || loading}
                className="w-full py-4 bg-zinc-900 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-3 hover:bg-black transition-colors shadow-lg shadow-zinc-200 disabled:opacity-40 disabled:grayscale disabled:cursor-not-allowed"
              >
                {loading ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                Execute Transmission
              </motion.button>
            </div>
          </section>

          {/* Lifecycle guide with better spacing and visuals */}
          <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-xl shadow-blue-200/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
            <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-4">Transmission Protocol</h3>
            <p className="text-[11px] text-blue-100 font-medium leading-relaxed mb-6">
              Instructions are prioritized based on hardware heartbeat intervals. 
              Emergency overrides take precedence.
            </p>
            <div className="space-y-3">
              {[
                { label: "QUEUED", desc: "Awaiting window", color: "bg-blue-300" },
                { label: "SENT", desc: "Active transit", color: "bg-blue-100" },
                { label: "ACK/NACK", desc: "Terminal state", color: "bg-white" }
              ].map((step, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className={cn("w-1.5 h-1.5 rounded-full shadow-glow", step.color)} />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-wider">{step.label}</span>
                    <span className="text-[10px] text-blue-100/70 font-bold">{step.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Timeline */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-black text-zinc-900 tracking-tight">Activity Feed</h2>
              {selectedMeter && (
                <span className="px-2 py-0.5 bg-zinc-100 text-zinc-500 rounded text-[10px] font-mono font-bold">
                  TARGET: {selectedMeter}
                </span>
              )}
            </div>
            <motion.button 
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.5 }}
              onClick={() => selectedMeter && handleMeterChange(selectedMeter)}
              className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all"
            >
              <RefreshCw size={18} />
            </motion.button>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {historyLoading ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 bg-zinc-50 animate-pulse rounded-2xl border border-zinc-100" />
                  ))}
                </motion.div>
              ) : (
                <>
                  {commands.map((cmd, idx) => (
                    <motion.div 
                      key={cmd.command_id}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group bg-white border border-zinc-100 rounded-2xl p-5 hover:border-zinc-300 hover:shadow-xl hover:shadow-zinc-100/50 transition-all cursor-default"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400 group-hover:bg-zinc-900 group-hover:text-white transition-all transform group-hover:rotate-12">
                            <Terminal size={20} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-black text-zinc-900 font-mono tracking-tight">{cmd.command_id}</h4>
                              <span className="text-[10px] font-bold text-zinc-300">#TX-LNK</span>
                            </div>
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.15em]">{cmd.command_type.replace('_', ' ')}</p>
                          </div>
                        </div>
                        <CommandStatusBadge status={cmd.status} />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 border-t border-zinc-50 pt-5">
                        <div className="space-y-1">
                          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">Initialized</span>
                          <span className="text-[11px] font-mono font-bold text-zinc-700">{new Date(cmd.created_at_utc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                          <span className="text-[9px] text-zinc-400 block font-bold">{new Date(cmd.created_at_utc).toLocaleDateString()}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">Transmission</span>
                          {cmd.sent_at_utc ? (
                            <>
                              <span className="text-[11px] font-mono font-bold text-zinc-900">{new Date(cmd.sent_at_utc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              <span className="text-[9px] text-zinc-400 block font-bold">ACK Window Open</span>
                            </>
                          ) : (
                            <span className="text-[11px] font-bold text-zinc-300 italic tracking-widest">PENDING</span>
                          )}
                        </div>
                        <div className="hidden sm:block space-y-1">
                          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">Response</span>
                          {cmd.responded_at_utc ? (
                            <>
                              <span className="text-[11px] font-mono font-bold text-zinc-900">{new Date(cmd.responded_at_utc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              <span className="text-[9px] text-blue-500 block font-bold">Data Confirmed</span>
                            </>
                          ) : (
                            <span className="text-[11px] font-bold text-zinc-300 italic tracking-widest">—</span>
                          )}
                        </div>
                      </div>

                      {cmd.nack_reason && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          className="mt-5 p-3 bg-red-50/50 border border-red-100 rounded-xl text-[10px] font-bold text-red-600 uppercase tracking-widest flex items-center gap-2"
                        >
                          <AlertCircle size={12} />
                          NACK: {cmd.nack_reason}
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </>
              )}
            </AnimatePresence>

            {!selectedMeter && !historyLoading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center p-20 text-center border-2 border-dashed border-zinc-100 rounded-[2rem]"
              >
                <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-200 mb-4">
                  <Search size={32} />
                </div>
                <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-2">No Hardware Selected</h3>
                <p className="text-xs text-zinc-300 max-w-[200px] leading-relaxed">
                  Select a meter from the control panel to access historical command logs.
                </p>
              </motion.div>
            )}

            {selectedMeter && commands.length === 0 && !historyLoading && (
              <div className="p-20 text-center border-2 border-dashed border-zinc-100 rounded-[2rem] text-zinc-300 italic text-sm">
                No active command history for this node.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
