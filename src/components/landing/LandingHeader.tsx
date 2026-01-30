"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X, Building2, LayoutDashboard } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export function LandingHeader() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setIsAuthenticated(!!user);
      } catch (error) {
        console.error("Error checking auth:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    }
    checkAuth();
  }, []);

  const navigation = [
    { name: "Inicio", href: "#inicio" },
    { name: "Características", href: "#caracteristicas" },
    { name: "Beneficios", href: "#beneficios" },
    { name: "Testimonios", href: "#testimonios" },
    { name: "Precios", href: "#precios" },
  ];

  const scrollToSection = (href: string) => {
    if (href.startsWith("#")) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Opttius</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => scrollToSection(item.href)}
                className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
              >
                {item.name}
              </button>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {isLoading ? (
              <div className="h-10 w-32 bg-gray-100 animate-pulse rounded-md" />
            ) : isAuthenticated ? (
              <Button
                onClick={() => router.push("/admin")}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Ir al Dashboard
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => router.push("/login")}
                  className="text-gray-700 hover:text-gray-900"
                >
                  Iniciar Sesión
                </Button>
                <Button
                  onClick={() => router.push("/signup")}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                >
                  Registrarse Gratis
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-4 border-t border-gray-200">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => scrollToSection(item.href)}
                className="block w-full text-left text-gray-700 hover:text-blue-600 transition-colors font-medium py-2"
              >
                {item.name}
              </button>
            ))}
            <div className="pt-4 space-y-2 border-t border-gray-200">
              {isLoading ? (
                <div className="h-10 w-full bg-gray-100 animate-pulse rounded-md" />
              ) : isAuthenticated ? (
                <Button
                  onClick={() => {
                    router.push("/admin");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Ir al Dashboard
                </Button>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      router.push("/login");
                      setMobileMenuOpen(false);
                    }}
                    className="w-full justify-start"
                  >
                    Iniciar Sesión
                  </Button>
                  <Button
                    onClick={() => {
                      router.push("/signup");
                      setMobileMenuOpen(false);
                    }}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                  >
                    Registrarse Gratis
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
