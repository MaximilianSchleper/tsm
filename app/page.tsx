"use client";

import dynamic from 'next/dynamic';

const GlobeViewer = dynamic(() => import('../components/GlobeViewer'), { ssr: false });

export default function Home() {
  return (
    <main>
      <GlobeViewer />
    </main>
  );
}
