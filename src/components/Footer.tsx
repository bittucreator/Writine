"use client";

import Link from "next/link";
import Image from "next/image";
import { Twitter, Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="py-8 sm:py-12 px-4 sm:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#918df6] rounded-lg flex items-center justify-center">
              <Image src="/writine-light.svg" alt="Writine" width={20} height={20} />
            </div>
            <span className="font-semibold">Writine</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-slate-600">
            <Link href="/#features" className="hover:text-slate-900">Features</Link>
            <Link href="/#pricing" className="hover:text-slate-900">Pricing</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="https://twitter.com" target="_blank" className="text-slate-400 hover:text-slate-600">
              <Twitter className="w-5 h-5" />
            </Link>
            <Link href="https://github.com/bittucreator/Writine" target="_blank" className="text-slate-400 hover:text-slate-600">
              <Github className="w-5 h-5" />
            </Link>
          </div>
        </div>

        <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-sm text-slate-500 border-t border-slate-100">
          <p>© {new Date().getFullYear()} Writine.</p>
        </div>
      </div>
    </footer>
  );
}
