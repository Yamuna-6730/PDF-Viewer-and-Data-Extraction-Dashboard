"use client";

import { useState, ReactNode } from "react";
import { Button } from "./button";

interface DialogProps {
  trigger: ReactNode;
  children: ReactNode;
}

export function Dialog({ trigger, children }: DialogProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      {open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-brandBlack text-white rounded-lg p-6 w-96 relative">
            {children}
            <Button className="mt-4" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
