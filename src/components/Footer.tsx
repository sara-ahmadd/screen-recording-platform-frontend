import React from 'react'
import { Link } from 'react-router-dom';

export default function Footer() {
    const footerLinks = [
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms-and-conditions", label: "Terms & Conditions" },
  { href: "/contact", label: "Contact" },
  { href: "/about", label: "About" },
  { href: "/blogs", label: "Blogs" },
  { href: "/how-it-works", label: "How it works" },
];

  return (
  <footer className="border-t border-border/50 py-8">
         <div className="max-w-[95%] mx-auto px-6 flex flex-wrap items-center justify-between gap-4">
           <p className="text-sm text-muted-foreground">
             © {new Date().getFullYear()} theRec. All rights reserved.
           </p>
           <div className="flex flex-wrap items-center gap-4 text-sm">
             {footerLinks.map((item) => (
               <Link
                 key={item.href}
                 to={item.href}
                 className="text-muted-foreground hover:text-foreground transition-colors"
               >
                 {item.label}
               </Link>
             ))}
           </div>
         </div>
       </footer>
  )
}
