import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import StaxZone from '@/components/StaxZone';
import AICapabilities from '@/components/AICapabilities';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <StaxZone />
        <AICapabilities />
      </main>
      <Footer />
    </>
  );
}
