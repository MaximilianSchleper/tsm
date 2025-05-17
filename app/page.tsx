"use client";

import "./layout.css";

import * as React from "react";
import Image from "next/image";

import {
  Calendar,
  Clipboard,
  ClipboardCheck,
  FlameKindling,
  Github,
  Mouse,
  MoveUpRight,
  User,
} from "lucide-react";

import { useEventListener } from "~/hooks/use-event-listner";

const Home: React.FC = () => {
  const [isCopied, setIsCopied] = React.useState(false);
  const [showDropdown, setShowDropdown] = React.useState(false);

  // close dropdown on ESC key press
  useEventListener("keydown", (e) => {
    if (e.key === "Escape") setShowDropdown(false);
  });

  const copyToClipboard = (pm: PackageManagers) => {
    setShowDropdown(false);
    setIsCopied(true);

    const text = `${packageManagers[pm]} degit rajput-hemant/nextjs-template <project-name>`;

    try {
      void navigator.clipboard.writeText(text);
      setIsCopied(true);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  return (
    <main className="layout min-h-screen w-full bg-black bg-fixed text-white selection:bg-zinc-300 selection:text-black">
      <section className="container px-4 py-12 md:px-6 md:pt-24 lg:pt-32 xl:pt-48">

        <div className="grid items-center gap-6">
          <div className="flex flex-col justify-center space-y-4 text-center">
            <div className="mb-6 space-y-2">
              <h1 className="bg-linear-to-r from-white to-gray-500 bg-clip-text pb-2 text-3xl font-bold tracking-tighter text-transparent sm:text-5xl xl:text-6xl">
                Satellite Constellation Management
              </h1>

              <p className="mx-auto max-w-3xl text-sm text-zinc-200 sm:text-base md:text-xl">
                A platform for managing satellite constellations and optimizing task scheduling. 
              </p>
            </div>

            <div className="flex flex-col items-center justify-center gap-4 md:flex-row">
              <a
                href="/"
                className="flex rounded-full border border-zinc-700 px-6 py-3 duration-300 hover:bg-white/10 hover:shadow-md hover:shadow-black"
              >
                <Calendar className="mr-2 size-5" />
                Book a Demo
              </a>

              <a
                href="/"
                className="flex rounded-full border border-zinc-700 px-6 py-3 duration-300 hover:bg-white/10 hover:shadow-md hover:shadow-black"
              >
                <User className="mr-2 size-5" />
                Login
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="container mt-10 grid place-items-center pb-4 text-sm text-neutral-400">
        <span className="flex items-center gap-1">
          &copy;
          <span>{new Date().getFullYear()}</span>
          <a
            href="https://travellingspaceman.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-4 duration-200 hover:text-neutral-200 hover:underline"
          >
            travellingspaceman.com
          </a>
        </span>
      </footer>
    </main>
  );
};

export default Home;
