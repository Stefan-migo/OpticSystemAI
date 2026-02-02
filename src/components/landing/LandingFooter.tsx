"use client";

import Link from "next/link";
import {
  Building2,
  Mail,
  Phone,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Sparkles,
} from "lucide-react";
import businessConfig from "@/config/business";

export function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-100 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid md:grid-cols-4 gap-16">
          {/* Brand Column */}
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-xl">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <span className="text-2xl font-malisha text-gray-900 tracking-tight">
                {businessConfig.name}
              </span>
            </div>
            <p className="text-gray-500 text-sm font-body leading-relaxed max-w-xs">
              Redefiniendo el estándar tecnológico en la industria óptica global
              con inteligencia artificial y diseño centrado en el ser humano.
            </p>
            <div className="flex gap-5">
              {[Facebook, Twitter, Linkedin, Instagram].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="h-10 w-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-primary/10 hover:text-primary transition-all duration-300"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Product Column */}
          <div>
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-[0.2em] mb-8">
              Soluciones
            </h3>
            <ul className="space-y-4 text-sm font-body">
              {["Características", "Precios", "API & Developers"].map(
                (item, i) => (
                  <li key={i}>
                    <Link
                      href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                      className="text-gray-500 hover:text-primary transition-colors flex items-center group"
                    >
                      <div className="w-0 group-hover:w-2 h-px bg-primary mr-0 group-hover:mr-2 transition-all"></div>
                      {item}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-[0.2em] mb-8">
              Compañía
            </h3>
            <ul className="space-y-4 text-sm font-body">
              {["Sobre Nosotros", "Carreras", "Blog", "Prensa"].map(
                (item, i) => (
                  <li key={i}>
                    <Link
                      href="#"
                      className="text-gray-500 hover:text-primary transition-colors flex items-center group"
                    >
                      <div className="w-0 group-hover:w-2 h-px bg-primary mr-0 group-hover:mr-2 transition-all"></div>
                      {item}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-[0.2em] mb-8">
              Soporte
            </h3>
            <ul className="space-y-6 text-sm font-body">
              <li className="flex items-start gap-4 text-gray-500 group">
                <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-primary/5 transition-colors">
                  <Mail className="h-4 w-4 text-gray-400 group-hover:text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                    Email
                  </p>
                  <a
                    href={`mailto:${businessConfig.contactEmail}`}
                    className="hover:text-primary transition-colors"
                  >
                    {businessConfig.contactEmail}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-4 text-gray-500 group">
                <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-primary/5 transition-colors">
                  <Phone className="h-4 w-4 text-gray-400 group-hover:text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                    Citas
                  </p>
                  <a
                    href="tel:+1234567890"
                    className="hover:text-primary transition-colors"
                  >
                    +1 (234) 567-890
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 mt-20 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest">
            © {currentYear} {businessConfig.displayName}. Todos los derechos
            reservados.
          </p>
          <div className="flex gap-8 text-[11px] font-medium text-gray-400 uppercase tracking-widest">
            <Link href="#" className="hover:text-primary transition-colors">
              Privacidad
            </Link>
            <Link href="#" className="hover:text-primary transition-colors">
              Términos
            </Link>
            <Link href="#" className="hover:text-primary transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
