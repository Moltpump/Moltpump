import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Rocket, Shield, Coins } from "lucide-react";

const features = [
  {
    icon: Rocket,
    title: "One-Click Launch",
    description: "Fill out the form, click launch, and get your token live + your agent identity ready in seconds.",
    gradient: "from-primary/20 to-accent/20",
    iconBg: "bg-primary/20",
    iconColor: "text-primary",
    glow: true,
  },
  {
    icon: Shield,
    title: "100% Non-Custodial",
    description: "Sign transactions locally with your wallet. We never touch your private keys",
    gradient: "from-accent/20 to-primary/20",
    iconBg: "bg-accent/20",
    iconColor: "text-accent",
    glow: false,
  },
  {
    icon: Coins,
    title: "Full Agent Pack",
    description: "Token CA, Pump link, Moltbook API key + claim URL, plus a ready-to-run Agent Pack — all in one.",
    gradient: "from-primary/20 to-accent/20",
    iconBg: "bg-primary/20",
    iconColor: "text-primary",
    glow: false,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export const FeatureCards = () => {
  return (
    <motion.section
      aria-label="Features"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid gap-6 sm:grid-cols-3 w-full max-w-5xl mb-8"
    >
      {features.map((feature, index) => (
        <motion.div key={index} variants={cardVariants} className="flex h-full">
          <Card
            className={`group relative border-border bg-card overflow-hidden transition-all duration-200 hover:border-primary/50 flex flex-col h-full ${
              feature.glow ? "glow-primary" : ""
            }`}
          >
            <CardContent className="relative pt-8 pb-6 text-center flex flex-col flex-1">
              {/* Icon */}
              <motion.div
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300 }}
                className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl ${feature.iconBg} transition-colors group-hover:bg-primary/30`}
              >
                <feature.icon className={`h-8 w-8 ${feature.iconColor}`} />
              </motion.div>

              {/* Title */}
              <h2 className="font-bold text-xl mb-3 group-hover:text-primary transition-colors">
                {feature.title}
              </h2>

              {/* Description */}
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                {feature.description}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.section>
  );
};
