import Link from 'next/link';

export const metadata = {
  title: 'Satellite Constellation Manager - Advanced Orbital Simulation Tool',
  description: 'Professional satellite constellation management, orbital visualization, and coverage analysis with interactive 3D interface. Optimize satellite deployments and analyze global coverage patterns.',
  keywords: 'satellite constellation, orbital mechanics, space simulation, coverage analysis, satellite management, aerospace engineering, orbital visualization',
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-black text-white">
      <div className="container mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="font-orbitron text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-cyan-400 to-green-400 bg-clip-text text-transparent">
            Satellite Constellation Manager
          </h1>
          
          <p className="font-roboto-mono text-xl md:text-2xl text-slate-300 mb-12 leading-relaxed">
            Advanced orbital simulation and coverage analysis tool for satellite constellation design and optimization
          </p>
          
          <Link 
            href="/constellation"
            className="inline-block bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-roboto-mono font-semibold px-8 py-4 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Launch Simulation Tool →
          </Link>
        </div>
      </div>
    </main>
  );
}
