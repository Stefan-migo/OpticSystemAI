"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X, Building2, LayoutDashboard, Eye } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import businessConfig from "@/config/business";

type OrgStatus = {
  hasOrganization: boolean;
  isDemoMode: boolean;
} | null;

export function LandingHeader() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [orgStatus, setOrgStatus] = useState<OrgStatus>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAuthAndOrg() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const authenticated = !!user;
        setIsAuthenticated(authenticated);

        if (authenticated) {
          try {
            const res = await fetch("/api/admin/check-status", {
              credentials: "include",
            });
            if (res.ok) {
              const data = await res.json();
              setOrgStatus({
                hasOrganization: data.organization?.hasOrganization ?? false,
                isDemoMode: data.organization?.isDemoMode ?? false,
              });
            } else {
              setOrgStatus({ hasOrganization: false, isDemoMode: false });
            }
          } catch {
            setOrgStatus({ hasOrganization: false, isDemoMode: false });
          }
        } else {
          setOrgStatus(null);
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        setIsAuthenticated(false);
        setOrgStatus(null);
      } finally {
        setIsLoading(false);
      }
    }
    checkAuthAndOrg();
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
    <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50 transition-all duration-300">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative overflow-hidden rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-105">
              <Image
                src={businessConfig.admin.logo}
                alt="Opttius Logo"
                width={44}
                height={44}
                className="object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-malisha text-gray-900 leading-tight tracking-tight">
                {businessConfig.name}
              </span>
              <span className="text-[10px] font-caption text-gray-500 uppercase tracking-[0.2em] font-bold">
                Optical Management
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-10">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => scrollToSection(item.href)}
                className="text-sm font-medium text-gray-600 hover:text-primary transition-all duration-300 relative group"
              >
                {item.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </button>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {isLoading ? (
              <div className="h-10 w-32 bg-gray-50 animate-pulse rounded-full" />
            ) : isAuthenticated ? (
              orgStatus?.hasOrganization && !orgStatus?.isDemoMode ? (
                <Button
                  onClick={() => router.push("/admin")}
                  className="rounded-full px-6 shadow-premium hover:shadow-premium-lg transition-all"
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Ir al Dashboard
                </Button>
              ) : (
                <div className="flex gap-3">
                  <Button
                    onClick={() => router.push("/onboarding/create")}
                    className="rounded-full px-6 shadow-premium hover:shadow-premium-lg transition-all"
                  >
                    <Building2 className="mr-2 h-4 w-4" />
                    Activar Óptica
                  </Button>
                  <Button
                    onClick={() => router.push("/onboarding/choice")}
                    variant="outline"
                    className="rounded-full px-6 border-gray-200 hover:border-primary hover:text-primary transition-all"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Demo
                  </Button>
                </div>
              )
            ) : (
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  onClick={() => router.push("/login")}
                  className="rounded-full px-6 text-gray-600 font-bold hover:bg-gray-50"
                >
                  Acceso
                </Button>
                <Button
                  onClick={() => router.push("/signup")}
                  className="rounded-full px-8 shadow-premium hover:shadow-premium-lg transition-all font-bold"
                >
                  Empezar Ahora
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl"
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
          <div className="lg:hidden py-6 space-y-4 border-t border-gray-50 animate-in slide-in-from-top duration-300">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => scrollToSection(item.href)}
                className="block w-full text-left text-lg font-medium text-gray-700 hover:text-primary transition-colors py-2"
              >
                {item.name}
              </button>
            ))}
            <div className="pt-6 space-y-3 border-t border-gray-50">
              {isLoading ? (
                <div className="h-12 w-full bg-gray-50 animate-pulse rounded-2xl" />
              ) : isAuthenticated ? (
                orgStatus?.hasOrganization && !orgStatus?.isDemoMode ? (
                  <Button
                    onClick={() => {
                      router.push("/admin");
                      setMobileMenuOpen(false);
                    }}
                    className="w-full rounded-2xl h-12 shadow-premium"
                  >
                    <LayoutDashboard className="mr-2 h-5 w-5" />
                    Ir al Dashboard
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <Button
                      onClick={() => {
                        router.push("/onboarding/create");
                        setMobileMenuOpen(false);
                      }}
                      className="w-full rounded-2xl h-12 shadow-premium"
                    >
                      <Building2 className="mr-2 h-5 w-5" />
                      Activar tu Óptica
                    </Button>
                    <Button
                      onClick={() => {
                        router.push("/onboarding/choice");
                        setMobileMenuOpen(false);
                      }}
                      variant="outline"
                      className="w-full rounded-2xl h-12 border-gray-200"
                    >
                      <Eye className="mr-2 h-5 w-5" />
                      Probar Demo
                    </Button>
                  </div>
                )
              ) : (
                <div className="space-y-3">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      router.push("/login");
                      setMobileMenuOpen(false);
                    }}
                    className="w-full rounded-2xl h-12 text-gray-600 font-bold"
                  >
                    Iniciar Sesión
                  </Button>
                  <Button
                    onClick={() => {
                      router.push("/signup");
                      setMobileMenuOpen(false);
                    }}
                    className="w-full rounded-2xl h-12 shadow-premium font-bold"
                  >
                    Registrarse Gratis
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
