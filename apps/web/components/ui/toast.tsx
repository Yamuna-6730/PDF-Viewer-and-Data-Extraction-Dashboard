"use client";

import { useState, ReactNode } from "react";

interface ToastProps {
  message: string;
  duration?: number; // milliseconds
}

export function Toast({ message, duration = 3000 }: ToastProps) {
  const [visible, setVisible] = useState(true);

  setTimeout(() => setVisible(false), duration);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-brandBlue text-brandYellow px-4 py-2 rounded shadow-lg">
      {message}
    </div>
  );
}
