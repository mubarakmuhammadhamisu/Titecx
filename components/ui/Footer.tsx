import Link from "next/link";
import { Twitter, Youtube, Linkedin, Github } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 py-12 px-4 text-gray-400">
      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8 mb-12">
        <div className="col-span-2">
          <h3 className="text-white font-bold text-xl mb-4">Titecx</h3>
          <p className="max-w-xs">Empowering learners with real-world skills through expert-led courses.</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4">Legal</h4>
          <ul className="space-y-2">
            <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4">Social</h4>
          <div className="flex gap-4">
            <a href="#" className="hover:text-indigo-400 transition-colors"><Twitter size={20} /></a>
            <a href="#" className="hover:text-red-500 transition-colors"><Youtube size={20} /></a>
            <a href="#" className="hover:text-blue-500 transition-colors"><Linkedin size={20} /></a>
            <a href="#" className="hover:text-white transition-colors"><Github size={20} /></a>
          </div>
        </div>
      </div>
      <div className="text-center text-sm border-t border-white/5 pt-8">
        © {new Date().getFullYear()} Titecx. All rights reserved.
      </div>
    </footer>
  );
}
