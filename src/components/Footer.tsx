"use client";

import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="py-8 sm:py-12 px-4 sm:px-6 bg-[#f8f7f3]">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#8345dd] rounded-lg flex items-center justify-center">
              <Image src="/writine-light.svg" alt="Writine" width={20} height={20} />
            </div>
            <span className="font-semibold">Writine</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link href="/contact" className="hover:text-slate-900 transition-colors">Contact</Link>
            <Link href="/privacy" className="hover:text-slate-900 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-900 transition-colors">Terms</Link>
            <span>© {new Date().getFullYear()} Writine.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
