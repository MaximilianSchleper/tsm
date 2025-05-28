'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import StarfieldBackground from './components/StarfieldBackground';

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLaunchClick = () => {
    setIsLoading(true);
    // Small delay to ensure loading animation is visible
    setTimeout(() => {
      router.push('/constellation');
    }, 100);
  };

  return (
    <main className="min-h-screen text-white">
      <StarfieldBackground />
      <div className="container mx-auto px-6 min-h-screen flex items-center justify-center">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="font-orbitron text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent leading-tight pb-2" style={{backgroundImage: 'linear-gradient(to right, #FFB74D, #FF8A65, #FFB74D)'}}>
            Configure Your Satellite Constellation
          </h1>
          
          <p className="font-roboto-mono text-xl md:text-2xl text-gray-200 mb-12 leading-relaxed">
            Advanced orbital simulation and coverage analysis tool for satellite constellation design. No areospace degrees required.
          </p>
          
          <button
            onClick={handleLaunchClick}
            disabled={isLoading}
            className="inline-flex items-center justify-center bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:from-amber-700 disabled:to-orange-700 text-white font-roboto-mono font-semibold px-8 py-4 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg hover:shadow-xl min-w-[280px]"
            style={{
              background: isLoading 
                ? 'linear-gradient(to right, #E65100, #FF6F00)' 
                : 'linear-gradient(to right, #FFB74D, #FF8A65)', 
              boxShadow: '0 10px 25px rgba(255, 183, 77, 0.3)'
            }}
          >
            {isLoading ? (
              <>
                <svg 
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  ></circle>
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Launching Simulation...
              </>
            ) : (
              'Launch Simulation Tool'
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
