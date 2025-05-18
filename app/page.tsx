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
    <main>
      <section>
        <GlobeViewer />
      </section>
    </main>
  );
};

export default Home;
