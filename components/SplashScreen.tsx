// components/SplashScreen.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

const STORAGE_KEY = 'innova_splash_last_shown';

export default function SplashScreen({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showSplash, setShowSplash] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const today = new Date().toDateString(); // ex: "Fri Aug 21 2026"
    const lastShown = localStorage.getItem(STORAGE_KEY);

    if (lastShown !== today) {
      setShowSplash(true);
      localStorage.setItem(STORAGE_KEY, today);

      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 3000);

      return () => clearTimeout(timer);
    }

    setChecked(true);
  }, []);

  useEffect(() => {
    if (!showSplash) setChecked(true);
  }, [showSplash]);

  if (!checked && !showSplash) return null; // evita flash antes de decidir

  return (
    <>
      {showSplash && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
          <Image
            src="/images/logo.png"
            alt="INNOVA"
            width={280}
            height={90}
            priority
          />
        </div>
      )}
      {!showSplash && children}
    </>
  );
}
