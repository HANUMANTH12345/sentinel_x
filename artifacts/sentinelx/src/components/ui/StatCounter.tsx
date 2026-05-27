import { useEffect, useState, useRef } from "react";
import { motion, useInView, useAnimation } from "framer-motion";

interface StatCounterProps {
  end: number;
  duration?: number;
  label: string;
  suffix?: string;
  prefix?: string;
}

export function StatCounter({ end, duration = 2, label, suffix = "", prefix = "" }: StatCounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (isInView) {
      let startTimestamp: number | null = null;
      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
        
        // Ease out expo
        const easeOut = 1 - Math.pow(1 - progress, 3);
        setCount(Math.floor(easeOut * end));
        
        if (progress < 1) {
          window.requestAnimationFrame(step);
        } else {
          setCount(end);
        }
      };
      window.requestAnimationFrame(step);
    }
  }, [end, duration, isInView]);

  return (
    <div ref={ref} className="flex flex-col items-center justify-center p-6 bg-card/20 backdrop-blur-sm border border-white/10 rounded-2xl relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="text-4xl md:text-5xl font-bold text-white font-display flex items-baseline drop-shadow-[0_0_10px_rgba(0,245,255,0.3)]"
      >
        {prefix && <span className="text-2xl mr-1 text-primary">{prefix}</span>}
        {count.toLocaleString()}
        {suffix && <span className="text-primary">{suffix}</span>}
      </motion.div>
      <motion.p 
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-2 text-sm md:text-base text-muted-foreground uppercase tracking-wider font-semibold"
      >
        {label}
      </motion.p>
    </div>
  );
}