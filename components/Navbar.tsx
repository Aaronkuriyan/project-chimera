"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/simulator", label: "Simulator" },
    { href: "/dashboard", label: "Threat Radar" },
    { href: "/canaries", label: "Canary Ledger" },
    { href: "/verify", label: "Forensic Verify" },
    { href: "/gateway", label: "Proxy Gateway" },
  ];

  return (
    <header className="topnav">
      <div className="nav-brand-group">
        <Link href="/" className="wordmark">
          chimera
        </Link>
        <span className="defense-badge">
          <span className="dot dot-real" />
          ACTIVE DEFENSE
        </span>
      </div>

      <nav className="nav-links">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-item ${isActive ? "active" : ""}`}
            >
              {link.label}
            </Link>
          );
        })}
        <a
          href="https://github.com/Aaronkuriyan/project-chimera"
          target="_blank"
          rel="noreferrer"
          className="nav-item gh-link"
        >
          GitHub ↗
        </a>
      </nav>
    </header>
  );
}
