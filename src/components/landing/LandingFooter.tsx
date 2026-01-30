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
} from "lucide-react";

export function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Opttius</span>
            </div>
            <p className="text-sm">
              Sistema de gestión inteligente para ópticas y laboratorios.
              Optimiza tus operaciones con IA.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="hover:text-white transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Product Column */}
          <div>
            <h3 className="text-white font-semibold mb-4">Producto</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="#caracteristicas"
                  className="hover:text-white transition-colors"
                >
                  Características
                </Link>
              </li>
              <li>
                <Link
                  href="#precios"
                  className="hover:text-white transition-colors"
                >
                  Precios
                </Link>
              </li>
              <li>
                <Link
                  href="/signup"
                  className="hover:text-white transition-colors"
                >
                  Registrarse Gratis
                </Link>
              </li>
              <li>
                <Link
                  href="/onboarding/choice"
                  className="hover:text-white transition-colors"
                >
                  Probar con Demo
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="text-white font-semibold mb-4">Empresa</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="#testimonios"
                  className="hover:text-white transition-colors"
                >
                  Casos de Éxito
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Sobre Nosotros
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Carreras
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contacto</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a
                  href="mailto:contacto@opttius.com"
                  className="hover:text-white transition-colors"
                >
                  contacto@opttius.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <a
                  href="tel:+1234567890"
                  className="hover:text-white transition-colors"
                >
                  +1 (234) 567-890
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm">
            © {currentYear} Opttius. Todos los derechos reservados.
          </p>
          <div className="flex gap-6 text-sm">
            <Link href="#" className="hover:text-white transition-colors">
              Política de Privacidad
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Términos de Servicio
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
