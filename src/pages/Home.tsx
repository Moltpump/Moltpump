import { AnimatedHero } from "@/components/AnimatedHero";
import { FeatureCards } from "@/components/FeatureCards";

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center px-4 h-auto w-full overflow-x-hidden pt-24 sm:pt-28 pb-12">
      <AnimatedHero />
      <FeatureCards />
    </div>
  );
};

export default Home;
