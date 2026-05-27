import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ShieldAlert } from "lucide-react";

const ALERT_MESSAGES = [
  "New threat detected: malicious-payload-xyz.ru",
  "Phishing attempt blocked from 192.168.45.2",
  "Suspicious login activity across 5 accounts",
  "Credential harvesting script intercepted",
  "Malware signature match: Trojan.Win32.Generic",
  "DDoS mitigation engaged for external-api-gateway",
];

export function ThreatAlerts() {
  const { toast } = useToast();

  useEffect(() => {
    // Show random alerts every 30-45 seconds
    const scheduleNextAlert = () => {
      const delay = Math.floor(Math.random() * 15000) + 30000; // 30s to 45s
      
      return setTimeout(() => {
        const msg = ALERT_MESSAGES[Math.floor(Math.random() * ALERT_MESSAGES.length)];
        
        toast({
          title: "Real-time Threat Alert",
          description: msg,
          variant: "destructive",
          className: "bg-destructive/20 border border-destructive/50 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]",
          duration: 5000,
        });
        
        scheduleNextAlert();
      }, delay);
    };

    const timer = scheduleNextAlert();
    return () => clearTimeout(timer);
  }, [toast]);

  return null;
}