"use client";

import Image from "next/image";

export function Footer() {
  return (
    <footer className="py-8 sm:py-12 px-4 sm:px-6 bg-[#f8f7f3]">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#8345dd] rounded-lg flex items-center justify-center">
              <Image src="/writine-light.svg" alt="Writine" width={20} height={20} />
            </div>
            <span className="font-semibold">Writine</span>
          </div>

          <p className="text-sm text-slate-500">© {new Date().getFullYear()} Writine.</p>
        </div>
      </div>
    </footer>
  );
}
