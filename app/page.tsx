"use client";

import "./layout.css";
import dynamic from 'next/dynamic';
import * as React from "react";

const GlobeViewer = dynamic(() => import('../components/GlobeViewer'), { 
  ssr: false,
  loading: () => <p>Loading Globe...</p>
});

const Home: React.FC = () => {
  return (
    <main className="layout min-h-screen w-full bg-black bg-fixed text-white selection:bg-zinc-300 selection:text-black">
      <section className="h-screen w-screen">
        <GlobeViewer />
      </section>
    </main>
  );
};

export default Home;
