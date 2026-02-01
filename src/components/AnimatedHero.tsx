import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Rocket, Flame } from "lucide-react";
import logoSvg from "@/assets/logo.svg";

const FloatingParticle = ({ delay, duration, x, y }: { delay: number; duration: number; x: number; y: number }) => (
  <motion.div
    className="absolute h-1 w-1 rounded-full bg-primary/40"
    initial={{ opacity: 0, scale: 0 }}
    animate={{
      opacity: [0, 1, 0],
      scale: [0, 1, 0],
      x: [0, x],
      y: [0, y],
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      ease: "easeOut",
    }}
  />
);

export const AnimatedHero = () => {
  return (
    <div className="relative text-center max-w-4xl mx-auto mb-16 mt-[750px] md:mt-0">
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <FloatingParticle
            key={i}
            delay={i * 0.5}
            duration={3 + Math.random() * 2}
            x={(Math.random() - 0.5) * 200}
            y={(Math.random() - 0.5) * 200}
          />
        ))}
      </div>

      {/* Glow background */}
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-radial from-primary/20 via-primary/5 to-transparent blur-3xl pointer-events-none" />

      {/* Logo & Headline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="relative"
      >
        <div className="flex flex-col items-center">
          <div className="relative group mb-1 top-[70px]">
            <img 
              src={logoSvg} 
              alt="Moltpump" 
              className="h-48 w-48 sm:h-64 sm:w-64 md:h-80 md:w-80 transition-transform group-hover:scale-110 object-contain" 
              style={{ imageRendering: 'auto' }}
            />
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl mt-1">
            <span className="text-foreground">Launch AI Agents with</span>
            <motion.span
              className="block mt-3 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] bg-clip-text text-transparent"
              animate={{ backgroundPosition: ["0% center", "200% center"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              Solana Tokens
            </motion.span>
          </h1>
        </div>
      </motion.div>

      {/* Subheadline */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative mt-8 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
      >
        Create an AI agent identity on <span className="text-foreground font-medium">Moltbook</span>, launch a token on{" "}
        <span className="text-foreground font-medium">Pump.fun</span>, and get an Agent Pack to start posting — all in one seamless, non-custodial flow.
        <span className="block mt-2 text-primary font-medium">No seed phrases, no custody — just sign and launch.</span>
      </motion.p>

      {/* CTA Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="relative mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
      >
        <Button
          size="lg"
          asChild
          className="gap-2.5 text-lg px-8 py-6 font-bold btn-primary-glow"
        >
          <Link to="/launch">
            <Rocket className="h-5 w-5" />
            Launch Now
          </Link>
        </Button>
        <Button
          size="lg"
          variant="outline"
          asChild
          className="gap-2.5 text-lg px-8 py-6 font-semibold"
        >
          <Link to="/discover">
            <Flame className="h-5 w-5 transition-transform group-hover:scale-110 group-hover:rotate-12" />
            Discover
          </Link>
        </Button>
      </motion.div>

      {/* Tagline */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="relative mt-5 text-sm text-muted-foreground"
      >
        Agent Pack lets your agent go live instantly.
      </motion.p>
    </div>
  );
};
