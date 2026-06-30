"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui";
import { RoomModal } from "@/components/RoomModal";

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  useEffect(() => {

    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
  };

  const handleStartDrawing = () => {
    if (!isAuthenticated) {
      router.push("/signin");
      return;
    }
    setIsCreateModalOpen(true);
  };

  const handleJoinRoom = () => {
    if (!isAuthenticated) {
      router.push("/signin");
      return;
    }
    setIsJoinModalOpen(true);
  };

  return (
    <div 
      className="relative flex min-h-screen flex-col bg-[#090909] text-white font-sans select-none overflow-hidden"
      style={{
        backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      {}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />

      {}
      <header className="relative z-10 flex h-16 items-center justify-between border-b border-neutral-800/40 px-6 sm:px-12 bg-[#090909]/80 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900">
            <svg
              className="h-4.5 w-4.5 text-purple-400 animate-pulse"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </div>
          <span className="font-semibold text-sm tracking-wide text-neutral-200 uppercase font-sans">
            Excalidraw
          </span>
        </div>

        <nav className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <span className="text-xs text-neutral-400 font-medium">Logged In</span>
              <Button
                variant="secondary"
                onClick={handleSignOut}
                className="!py-1.5 !px-4 text-xs font-semibold rounded-lg"
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <>
              <Link href="/signin" className="text-xs font-semibold text-neutral-400 hover:text-white transition-colors duration-200">
                Sign In
              </Link>
              <Link href="/signup">
                <Button
                  variant="primary"
                  className="!py-1.5 !px-4 text-xs font-semibold rounded-lg"
                >
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </nav>
      </header>

      {}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
        {}
        <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-900/50 px-3 py-1 text-xs text-neutral-400 font-medium tracking-wide">
          <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
          Collaborative Workspace
        </div>

        {}
        <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl font-sans">
          Draw ideas together,{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
            instantly.
          </span>
        </h1>

        {}
        <p className="mt-4 max-w-xl text-base text-neutral-400 sm:text-lg">
          Collaborative whiteboarding for teams. Sketch flows, diagram systems, and brainstorm ideas in real-time.
        </p>

        {}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Button
            variant="primary"
            className="w-full sm:w-44 shadow-lg hover:shadow-purple-500/10"
            onClick={handleStartDrawing}
          >
            Start Drawing
          </Button>
          <Button
            variant="secondary"
            className="w-full sm:w-44 hover:border-neutral-700"
            onClick={handleJoinRoom}
          >
            Join Room
          </Button>
        </div>
      </main>

      <RoomModal
        mode="create"
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <RoomModal
        mode="join"
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />

      {}
      <footer className="relative z-10 flex h-16 items-center justify-center border-t border-neutral-800/40 text-xs text-neutral-500 bg-[#090909]/40">
        <p>Built for speed and collaboration. Open source drawing clone.</p>
      </footer>
    </div>
  );
}
