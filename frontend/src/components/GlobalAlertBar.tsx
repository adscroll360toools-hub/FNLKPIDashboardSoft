import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, X, Clock } from "lucide-react";
import { useTask } from "@/context/TaskContext";
import { useAuth } from "@/context/AuthContext";

export function GlobalAlertBar() {
    const { tasks } = useTask();
    const { currentUser } = useAuth();
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Reset dismissed state when mounting if needed
        const isDismissed = sessionStorage.getItem("zaptiz_delayed_dismissed");
        if (isDismissed) {
            setDismissed(true);
        }
    }, []);

    if (dismissed) return null;

    // Determine delayed tasks
    let delayedTasks = tasks.filter((t) => {
        if (!t.deadline || t.deadline === "Daily") return false;
        if (t.status === "Completed" || t.status === "Approved") return false;
        
        // Filter based on user role
        if (currentUser?.role === "employee" && t.assigneeId !== currentUser.id) return false;
        
        const d = new Date(t.deadline);
        return d < new Date();
    });

    if (delayedTasks.length === 0) return null;

    // Get the most delayed task for the main error
    const mostDelayed = delayedTasks.sort((a,b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())[0];
    
    const delaysInHours = Math.floor((new Date().getTime() - new Date(mostDelayed.deadline).getTime()) / (1000 * 60 * 60));
    let delayStr = delaysInHours > 24 ? `${Math.floor(delaysInHours/24)} days` : `${delaysInHours} hours`;

    const handleDismiss = () => {
        setDismissed(true);
        sessionStorage.setItem("zaptiz_delayed_dismissed", "true");
    };

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-red-500 text-white w-full overflow-hidden shadow-lg border-b border-red-600 z-[100] relative"
            >
                <div className="px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 animate-pulse text-white/90" />
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <span className="font-bold text-sm tracking-wide">ATTENTION:</span>
                            <span className="text-sm text-red-50">
                                You have {delayedTasks.length} delayed task(s). First delay: <strong>"{mostDelayed.title}"</strong> ({delayStr} overdue).
                            </span>
                        </div>
                    </div>
                    <button 
                        onClick={handleDismiss}
                        className="p-1 rounded-md hover:bg-black/10 transition-colors flex-shrink-0 ml-4 ring-1 ring-white/30"
                    >
                        <span className="sr-only">Dismiss</span>
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
