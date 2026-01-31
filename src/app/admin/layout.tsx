"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Menu,
  LogOut,
  Bell,
  User,
  ChevronRight,
  Home,
  MessageSquare,
  Server,
  Tag,
  Receipt,
  FileText,
  Calendar,
  Building2,
  DollarSign,
  Settings,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import AdminNotificationDropdown from "@/components/admin/AdminNotificationDropdown";
import Chatbot from "@/components/admin/Chatbot";
import { BranchSelector } from "@/components/admin/BranchSelector";
import { ThemeSelector } from "@/components/theme-selector";
import { DemoModeBanner } from "@/components/onboarding/DemoModeBanner";
import { TourProvider } from "@/components/onboarding/TourProvider";
import { TourButton } from "@/components/onboarding/TourButton";
import { useBranch } from "@/hooks/useBranch";
import { useRoot } from "@/hooks/useRoot";
import { getBranchHeader } from "@/lib/utils/branch";
import businessConfig from "@/config/business";

interface AdminLayoutProps {
  children: React.ReactNode;
}

// Admin navigation items - will be populated dynamically
const createNavigationItems = (
  newWorkOrdersCount?: number,
  openTicketsCount?: number,
  isRoot?: boolean,
) => [
  {
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "Visión general y KPIs",
  },
  {
    href: "/admin/pos",
    label: "Punto de Venta",
    icon: ShoppingCart,
    description: "Sistema POS",
  },
  {
    href: "/admin/work-orders",
    label: "Trabajos",
    icon: Package,
    description: "Gestión de trabajos de laboratorio",
    badge:
      newWorkOrdersCount !== undefined && newWorkOrdersCount > 0
        ? newWorkOrdersCount.toString()
        : undefined,
  },
  {
    href: "/admin/quotes",
    label: "Presupuestos",
    icon: Receipt,
    description: "Crear y gestionar presupuestos",
  },
  {
    href: "/admin/appointments",
    label: "Citas y Agenda",
    icon: Calendar,
    description: "Gestión de citas y agenda",
  },
  {
    href: "/admin/products",
    label: "Productos",
    icon: Package,
    description: "Catálogo e inventario",
  },
  {
    href: "/admin/customers",
    label: "Clientes",
    icon: Users,
    description: "Gestión de clientes",
  },
  {
    href: "/admin/analytics",
    label: "Analíticas",
    icon: BarChart3,
    description: "Reportes y estadísticas",
  },
  {
    href: "/admin/checkout",
    label: "Checkout",
    icon: DollarSign,
    description: "Pagos con Flow / pasarelas",
    onboardingOnly: true, // Solo visible durante onboarding/suscripción
  },
  {
    href: "/admin/support",
    label: "Soporte",
    icon: MessageSquare,
    description: "Tickets y atención al cliente",
    badge:
      openTicketsCount !== undefined && openTicketsCount > 0
        ? openTicketsCount.toString()
        : undefined,
  },
  {
    href: "/admin/admin-users",
    label: "Administradores",
    icon: Users,
    description: "Gestión de usuarios admin",
  },
  {
    href: "/admin/branches",
    label: "Sucursales",
    icon: Building2,
    description: "Gestión de sucursales",
    superAdminOnly: true,
  },
  {
    href: "/admin/system",
    label: "Sistema",
    icon: Server,
    description: "Administración del sistema",
  },
  // Gestión SaaS - Solo visible para root/dev
  ...(isRoot
    ? [
        {
          href: "/admin/saas-management",
          label: "Gestión SaaS Opttius",
          icon: Settings,
          description: "Administración completa del SaaS",
          rootOnly: true,
        },
      ]
    : []),
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, profile, loading, signOut } = useAuthContext();
  const { isSuperAdmin, currentBranchId } = useBranch();
  const { isRoot, isLoading: isRootLoading } = useRoot();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatbotOpen, setChatbotOpen] = useState(false);

  // Admin state management - using combined state to prevent race conditions
  const [adminState, setAdminState] = useState<{
    isChecking: boolean;
    isAdmin: boolean;
    hasChecked: boolean;
    checkedUserId: string | null; // Track which user ID was checked
  }>({
    isChecking: true,
    isAdmin: false,
    hasChecked: false,
    checkedUserId: null,
  });

  // Organization state
  const [organizationState, setOrganizationState] = useState<{
    hasOrganization: boolean | null;
    isDemoMode: boolean;
    onboardingRequired: boolean;
    isChecking: boolean;
  }>({
    hasOrganization: null,
    isDemoMode: false,
    onboardingRequired: false,
    isChecking: true,
  });

  // Dynamic stats state - Updated for Optical Shop
  const [stats, setStats] = useState<{
    todayOrders: number;
    totalOrders: number;
    revenue: number;
    lowStock: number;
    // Optical Shop specific stats
    newWorkOrders: number; // Trabajos nuevos/pendientes
    inProgressWorkOrders: number; // Trabajos en progreso
    pendingQuotes: number; // Presupuestos pendientes
    todayAppointments: number; // Citas de hoy
    openTickets: number; // Tickets de soporte abiertos
  }>({
    todayOrders: 0,
    totalOrders: 0,
    revenue: 0,
    lowStock: 0,
    newWorkOrders: 0,
    inProgressWorkOrders: 0,
    pendingQuotes: 0,
    todayAppointments: 0,
    openTickets: 0,
  });

  // Add state to prevent multiple simultaneous admin checks
  const [isAdminCheckInProgress, setIsAdminCheckInProgress] = useState(false);

  // Add ref to prevent multiple redirects
  const redirectInProgress = useRef(false);

  // When user is signing out, skip any redirect to onboarding (avoids race with check-status response)
  const signOutInProgress = useRef(false);

  // Add ref to track if we've already logged the render message
  const hasLoggedRender = useRef(false);
  const lastLoggedUserId = useRef<string | null>(null);

  // Debug mode - can be enabled via localStorage
  const debugMode =
    typeof window !== "undefined" &&
    localStorage.getItem("admin-debug") === "true";

  // Check organization status
  useEffect(() => {
    const checkOrganization = async () => {
      // Solo verificar organización si el usuario es admin y está completamente autenticado
      // También esperar a que el check de root esté completo
      if (
        !adminState.isAdmin ||
        !adminState.hasChecked ||
        !user ||
        loading ||
        isRootLoading
      ) {
        if (!adminState.isAdmin && adminState.hasChecked) {
          // Si ya verificamos y no es admin, no necesitamos verificar organización
          setOrganizationState({
            hasOrganization: false,
            isDemoMode: false,
            onboardingRequired: false,
            isChecking: false,
          });
        }
        return;
      }

      // Si es root/dev, no necesita verificación de organización
      if (isRoot) {
        console.log("✅ Root/dev user detected - skipping organization check");
        setOrganizationState({
          hasOrganization: true, // Root users no necesitan organización pero marcamos como true para evitar redirección
          isDemoMode: false,
          onboardingRequired: false,
          isChecking: false,
        });
        return;
      }

      setOrganizationState((prev) => ({ ...prev, isChecking: true }));

      try {
        const response = await fetch("/api/admin/check-status");

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.organization) {
          const isRootUser = data.organization.isRootUser || false;
          const orgState = {
            hasOrganization: data.organization.hasOrganization || isRootUser, // Root users no necesitan organización
            isDemoMode: data.organization.isDemoMode || false,
            onboardingRequired:
              data.organization.onboardingRequired && !isRootUser, // Root users nunca necesitan onboarding
            isChecking: false,
          };

          setOrganizationState(orgState);

          // Solo redirigir a onboarding si realmente es necesario (y no estamos cerrando sesión)
          // No redirigir si tiene organización (incluso si es demo), es super_admin, o es root/dev
          if (
            !signOutInProgress.current &&
            orgState.onboardingRequired &&
            !orgState.hasOrganization &&
            !data.organization.isSuperAdmin &&
            !isRootUser
          ) {
            console.log(
              "🔄 Redirecting to onboarding - no organization assigned",
            );
            router.push("/onboarding/choice");
            return;
          }

          // Si es root/dev, permitir acceso directo sin verificación de organización
          if (isRootUser) {
            console.log(
              "✅ Root/dev user detected - skipping organization check",
            );
          }
        } else {
          // Si no hay datos de organización pero el usuario es admin
          // Verificar si es root/dev usando el hook del componente
          console.warn(
            "⚠️ No organization data in check-status response, but user is admin",
          );

          // Si es root/dev, no necesita onboarding
          if (isRoot) {
            console.log("✅ Root/dev user - skipping onboarding requirement");
            setOrganizationState({
              hasOrganization: true, // Root/dev no necesita organización pero marcamos como true
              isDemoMode: false,
              onboardingRequired: false,
              isChecking: false,
            });
            return;
          }

          // Si no es root/dev y no hay organización, requerir onboarding (salvo si está cerrando sesión)
          setOrganizationState({
            hasOrganization: false,
            isDemoMode: false,
            onboardingRequired: true,
            isChecking: false,
          });

          if (!signOutInProgress.current) {
            console.log("🔄 Redirecting to onboarding - no organization data");
            router.push("/onboarding/choice");
          }
          return;
        }
      } catch (error) {
        console.error("❌ Error checking organization status:", error);
        // En caso de error, verificar si es root/dev para no bloquear acceso
        if (isRoot) {
          console.log(
            "✅ Root/dev user - skipping onboarding requirement despite error",
          );
          setOrganizationState({
            hasOrganization: true, // Root/dev no necesita organización
            isDemoMode: false,
            onboardingRequired: false,
            isChecking: false,
          });
        } else {
          // Si no es root/dev y hay error, requerir onboarding por seguridad (salvo si está cerrando sesión)
          setOrganizationState({
            hasOrganization: false,
            isDemoMode: false,
            onboardingRequired: true,
            isChecking: false,
          });
          if (!signOutInProgress.current) {
            console.log(
              "🔄 Redirecting to onboarding - error checking organization",
            );
            router.push("/onboarding/choice");
          }
        }
      }
    };

    checkOrganization();
  }, [
    adminState.isAdmin,
    adminState.hasChecked,
    user,
    loading,
    router,
    isRoot,
    isRootLoading,
  ]);

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!adminState.isAdmin || !user || loading) return;

      try {
        const headers: HeadersInit = {
          ...getBranchHeader(currentBranchId),
        };

        const response = await fetch("/api/admin/dashboard", { headers });
        if (response.ok) {
          const data = await response.json();
          // Extract optical shop specific data
          const workOrders = data.kpis?.workOrders || {};
          const quotes = data.kpis?.quotes || {};
          const appointments = data.kpis?.appointments || {};

          // Fetch open tickets count (only for non-root users)
          let openTicketsCount = 0;
          if (!isRoot) {
            try {
              // Fetch tickets without status filter to count open ones
              // This endpoint now supports organization access
              const ticketsResponse = await fetch(
                "/api/admin/saas-management/support/tickets?limit=100",
              );
              if (ticketsResponse.ok) {
                const ticketsData = await ticketsResponse.json();
                const allTickets = ticketsData.tickets || [];
                // Count tickets that are not resolved or closed
                openTicketsCount = allTickets.filter(
                  (t: any) => t.status !== "resolved" && t.status !== "closed",
                ).length;
              } else if (ticketsResponse.status === 403) {
                // User doesn't have access to tickets, silently ignore
                console.debug("User doesn't have access to tickets");
              }
            } catch (error) {
              // Silently handle errors - tickets count is not critical
              console.debug("Error fetching open tickets count:", error);
            }
          }

          setStats({
            todayOrders: data.kpis?.orders?.pending || 0,
            totalOrders: workOrders.pending || 0, // Trabajos pendientes para el badge
            revenue: data.kpis?.revenue?.current || 0,
            lowStock: data.kpis?.products?.lowStock || 0,
            // Optical Shop specific
            newWorkOrders: workOrders.pending || 0, // Trabajos nuevos/pendientes
            inProgressWorkOrders: workOrders.inProgress || 0, // Trabajos en progreso
            pendingQuotes: quotes.pending || 0, // Presupuestos pendientes
            todayAppointments: appointments.today || 0, // Citas de hoy
            openTickets: openTicketsCount, // Tickets de soporte abiertos
          });
        }
      } catch (error) {
        // Silently handle 401 errors during initial load
        if (error instanceof Error && !error.message.includes("401")) {
          console.error("Error fetching stats:", error);
        }
      }
    };

    fetchStats();
    // Refresh stats every 30 seconds for real-time updates
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [adminState.isAdmin, user, loading, currentBranchId]);

  useEffect(() => {
    const checkAdminStatus = async () => {
      console.log("🔍 Admin layout: Starting admin check", {
        loading,
        hasUser: !!user,
        userEmail: user?.email,
        userId: user?.id,
        alreadyChecked: adminState.hasChecked,
        checkedUserId: adminState.checkedUserId,
        isAdminCheckInProgress,
      });

      // Don't check admin status if auth is still loading
      if (loading) {
        console.log("⏳ Auth still loading, waiting...");
        // Don't set state here to avoid unnecessary re-renders
        return;
      }

      // Wait a bit longer after auth loads to ensure auth state is stable
      if (!user) {
        console.log("❌ No user found");
        setAdminState({
          isChecking: false,
          isAdmin: false,
          hasChecked: true,
          checkedUserId: null,
        });
        return;
      }

      // Additional check: ensure we have a valid user with email
      if (!user.email) {
        console.log("⚠️ User found but no email");
        setAdminState({
          isChecking: false,
          isAdmin: false,
          hasChecked: false, // Don't mark as checked yet
          checkedUserId: null,
        });
        return;
      }

      // 🚀 KEY FIX: Skip admin check if we already checked this exact user ID
      // This prevents re-checking during token refresh events
      if (
        adminState.hasChecked &&
        adminState.checkedUserId === user.id &&
        adminState.isAdmin
      ) {
        console.log("✅ Already checked this user and is admin, skipping");
        return;
      }

      // Prevent multiple simultaneous admin checks
      if (isAdminCheckInProgress) {
        console.log("⏳ Admin check already in progress, skipping");
        return;
      }

      // Start admin check
      console.log("🚀 Starting admin check for user:", user.email);
      setIsAdminCheckInProgress(true);
      setAdminState((prev) => ({
        ...prev,
        isChecking: true,
        hasChecked: false,
      }));

      try {
        if (debugMode) {
          setAdminState({
            isChecking: false,
            isAdmin: true, // Force admin access in debug mode
            hasChecked: true,
            checkedUserId: user.id,
          });
          setIsAdminCheckInProgress(false);
          return;
        }

        const { createClient } = await import("@/utils/supabase/client");
        const supabase = createClient();

        // Add timeout to admin check to prevent infinite loading
        const adminCheckPromise = supabase.rpc("is_admin", {
          user_id: user.id,
        });
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Admin check timeout")), 10000),
        );

        const { data, error } = (await Promise.race([
          adminCheckPromise,
          timeoutPromise,
        ])) as any;

        let isAdminResult = false;

        if (error) {
          if (
            error.message !== "Admin check timeout" &&
            process.env.NODE_ENV === "development"
          ) {
            console.error("❌ Error checking admin status:", error);
          }
          isAdminResult = false;
        } else {
          isAdminResult = !!data;
        }

        // Atomic state update - set both checking and result together
        setAdminState({
          isChecking: false,
          isAdmin: isAdminResult,
          hasChecked: true,
          checkedUserId: user.id, // 🚀 KEY FIX: Store the user ID we checked
        });
        setIsAdminCheckInProgress(false);

        console.log("🏁 Admin check completed:", {
          isAdmin: isAdminResult,
          userId: user.id,
          userEmail: user.email,
        });

        // Si es admin, iniciar verificación de organización inmediatamente
        if (isAdminResult && user.id) {
          console.log("✅ User is admin, organization check will run next");
        } else {
          console.warn("⚠️ User is NOT admin, will redirect to login");
        }
      } catch (error: any) {
        if (error.message === "Admin check timeout") {
          console.error("⏱️ Admin check timed out - assuming not admin");
        } else {
          console.error("❌ Error checking admin status:", error);
        }

        // Atomic state update for error case
        setAdminState({
          isChecking: false,
          isAdmin: false,
          hasChecked: true,
          checkedUserId: user.id,
        });
        setIsAdminCheckInProgress(false);
      }
    };

    checkAdminStatus();
  }, [user?.id, loading]); // 🚀 KEY FIX: Only depend on user.id instead of entire user object

  useEffect(() => {
    console.log("🔄 Admin redirect check effect triggered:", {
      redirectInProgress: redirectInProgress.current,
      loading,
      adminStateHasChecked: adminState.hasChecked,
      adminStateIsChecking: adminState.isChecking,
      adminStateIsAdmin: adminState.isAdmin,
      hasUser: !!user,
      userEmail: user?.email,
    });

    // Skip if redirect is already in progress
    if (redirectInProgress.current) {
      console.log("⏭️ Redirect already in progress, skipping");
      return;
    }

    // Only redirect after both auth and admin checks are COMPLETELY finished
    if (!loading && adminState.hasChecked && !adminState.isChecking) {
      console.log("✅ All checks complete, evaluating redirect:", {
        user: !!user,
        userEmail: user?.email,
        isAdmin: adminState.isAdmin,
      });

      // If user is admin, just mark as done and return early
      if (user && user.email && adminState.isAdmin) {
        console.log("✅ User is admin, allowing access");
        return;
      }

      // Add a small delay to let auth fully stabilize before redirecting
      const delayRedirect = () => {
        console.log("⏳ Delaying redirect to let auth stabilize...");
        redirectInProgress.current = true;
        setTimeout(() => {
          console.log("🚪 Executing redirect check:", {
            hasUser: !!user,
            userEmail: user?.email,
            isAdmin: adminState.isAdmin,
          });

          if (!user || !user.email) {
            // Si el usuario acaba de cerrar sesión, ya estamos yendo a "/"; no redirigir a login
            if (signOutInProgress.current) return;
            console.log("❌ No user, redirecting to login");
            router.push("/login");
            return;
          }

          // Check admin access - only redirect if we've definitely checked and user is not admin
          if (!adminState.isAdmin) {
            console.log("❌ User is not admin, redirecting to login");
            router.push("/login");
            return;
          }

          console.log("✅ User is admin, allowing access");
        }, 500); // 500ms delay to let auth stabilize
      };

      if (!user || !user.email || !adminState.isAdmin) {
        delayRedirect();
      }
    } else {
      console.log("⏳ Still checking, waiting...", {
        loading,
        adminStateHasChecked: adminState.hasChecked,
        adminStateIsChecking: adminState.isChecking,
      });
    }
  }, [
    user?.id,
    adminState.hasChecked,
    adminState.isChecking,
    adminState.isAdmin,
    loading,
    router,
  ]);

  // Reset redirect/signOut flags when user changes
  useEffect(() => {
    redirectInProgress.current = false;
    // Solo resetear signOutInProgress cuando hay usuario de nuevo (nuevo login).
    // No resetear al cerrar sesión, así el setTimeout de redirección no nos manda a /login.
    if (user?.id) signOutInProgress.current = false;
  }, [user?.id]);

  const handleSignOut = async () => {
    signOutInProgress.current = true;
    await signOut();
    router.push("/");
  };

  // Show loading while auth or admin check is in progress
  // NO bloquear por verificación de organización si el usuario ya es admin
  const isStillChecking =
    loading || adminState.isChecking || !adminState.hasChecked;

  if (isStillChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dorado mx-auto"></div>
          <div className="space-y-2">
            <p className="text-azul-profundo font-semibold">
              {loading
                ? "Cargando autenticación..."
                : adminState.isChecking
                  ? "Verificando permisos de admin..."
                  : organizationState.isChecking
                    ? "Verificando organización..."
                    : "Cargando..."}
            </p>
            <p className="text-tierra-media text-sm">
              {loading
                ? "Iniciando sesión..."
                : user?.email
                  ? `Verificando acceso para ${user.email}`
                  : "Verificando permisos..."}
            </p>
            <div className="text-xs text-muted-foreground mt-2">
              Estado:{" "}
              {loading
                ? "Auth loading"
                : adminState.isChecking
                  ? "Admin checking"
                  : organizationState.isChecking
                    ? "Org checking"
                    : adminState.hasChecked
                      ? "Check complete"
                      : "Not checked"}{" "}
              | User: {user ? "✓" : "✗"} | Admin:{" "}
              {adminState.isAdmin ? "✓" : "✗"} | HasOrg:{" "}
              {organizationState.hasOrganization ? "✓" : "✗"}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If auth is loaded but user is not found or not admin, let the redirect useEffect handle it
  // Don't render the admin interface until we confirm admin access
  // IMPORTANT: Solo verificar esto después de que la verificación de admin haya terminado
  // NO bloquear por verificación de organización - eso es opcional
  if (
    !loading &&
    adminState.hasChecked &&
    !adminState.isChecking &&
    (!user || !adminState.isAdmin)
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
          <p className="text-red-600">
            {!user
              ? "Redirigiendo al login..."
              : "Acceso no autorizado, redirigiendo..."}
          </p>
          <div className="text-xs text-muted-foreground">
            User: {user ? "✓" : "✗"} | Admin: {adminState.isAdmin ? "✓" : "✗"} |
            Loading: {loading ? "✓" : "✗"} | Checking:{" "}
            {adminState.isChecking ? "✓" : "✗"} | HasChecked:{" "}
            {adminState.hasChecked ? "✓" : "✗"}
          </div>
        </div>
      </div>
    );
  }

  // If we reach here, user is authenticated and is admin
  // Only log once per user session to avoid console spam
  if (user?.email && user?.id) {
    // Reset if user changed
    if (lastLoggedUserId.current !== user.id) {
      hasLoggedRender.current = false;
      lastLoggedUserId.current = user.id;
    }

    // Log only once per user (removed for cleaner console)
    if (!hasLoggedRender.current) {
      hasLoggedRender.current = true;
    }
  }

  return (
    <TourProvider>
      <div className="admin-layout">
        {/* Mobile Header */}
        <div className="lg:hidden admin-header">
          <div className="admin-header-content">
            <div className="flex items-center space-x-3">
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5 text-admin-text-primary" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0">
                  <AdminSidebar
                    pathname={pathname}
                    onNavigate={() => setSidebarOpen(false)}
                    stats={stats}
                    organizationState={organizationState}
                  />
                </SheetContent>
              </Sheet>

              <h1 className="admin-header-title">Admin</h1>
            </div>

            <div className="admin-header-actions">
              <BranchSelector />
              <ThemeSelector />
              <AdminNotificationDropdown />
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="h-5 w-5 text-admin-text-primary" />
              </Button>
            </div>
          </div>
        </div>

        <div className="lg:flex">
          {/* Desktop Sidebar */}
          <div className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0">
            <AdminSidebar
              pathname={pathname}
              stats={stats}
              onChatbotClick={() => setChatbotOpen(true)}
              organizationState={organizationState}
            />
          </div>

          {/* Main Content */}
          <div className="lg:pl-72" style={{ width: "-webkit-fill-available" }}>
            {/* Desktop Header */}
            <div className="hidden lg:block admin-header">
              <div className="admin-header-content">
                <div>
                  <h1 className="admin-header-title font-malisha text-admin-text-primary">
                    {businessConfig.displayName || businessConfig.name}
                  </h1>
                  <p className="admin-header-subtitle font-caption text-admin-text-primary">
                    {businessConfig.admin.subtitle}
                  </p>
                </div>

                <div className="admin-header-actions">
                  <BranchSelector />
                  <ThemeSelector />
                  <AdminNotificationDropdown />

                  {/* Botón "Activar tu óptica" - Solo visible en modo demo */}
                  {organizationState.isDemoMode && (
                    <Button
                      onClick={() => router.push("/onboarding/create")}
                      className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2"
                      size="sm"
                    >
                      <Sparkles className="h-4 w-4" />
                      Activar tu Óptica
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}

                  <div className="admin-header-user">
                    <div className="admin-header-user-info">
                      <p className="admin-header-user-name font-caption text-admin-text-primary">
                        {profile?.first_name
                          ? `${profile.first_name} ${profile.last_name || ""}`.trim()
                          : user?.email || "Usuario"}
                      </p>
                      <p className="admin-header-user-role font-caption text-admin-text-secondary">
                        Administrador
                      </p>
                    </div>
                    <Link href="/admin/profile">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:bg-admin-bg-tertiary transition-colors"
                        title="Ver perfil"
                      >
                        <User className="h-5 w-5 text-admin-text-primary" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleSignOut}
                      className="hover:bg-admin-bg-tertiary transition-colors"
                      title="Cerrar sesión"
                    >
                      <LogOut className="h-5 w-5 text-admin-text-primary" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Page Content */}
            <main className="admin-content">
              {/* Demo Mode Banner */}
              {organizationState.isDemoMode && <DemoModeBanner />}
              {children}
            </main>
          </div>
        </div>

        {/* Chatbot - Floating Button */}
        <Chatbot />

        {/* Tour Help Button - Floating */}
        <TourButton />
      </div>
    </TourProvider>
  );
}

// Sidebar Component
function AdminSidebar({
  pathname,
  onNavigate,
  stats,
  onChatbotClick,
  organizationState,
}: {
  pathname: string;
  onNavigate?: () => void;
  stats: {
    todayOrders: number;
    totalOrders: number;
    revenue: number;
    lowStock: number;
    newWorkOrders: number;
    inProgressWorkOrders: number;
    pendingQuotes: number;
    todayAppointments: number;
  };
  onChatbotClick?: () => void;
  organizationState?: {
    hasOrganization: boolean | null;
    isDemoMode: boolean;
    onboardingRequired: boolean;
    isChecking: boolean;
  };
}) {
  const { isSuperAdmin } = useBranch();
  const { isRoot } = useRoot();
  return (
    <div
      className="admin-sidebar flex grow flex-col gap-y-5 overflow-y-auto"
      style={{ background: "var(--admin-bg-primary)" }}
    >
      {/* Logo */}
      <div className="admin-sidebar-header bg-admin-bg-secondary">
        <Link href="/" className="admin-sidebar-logo">
          <div className="admin-sidebar-logo-icon">
            <Image
              src={businessConfig.admin.logo}
              alt={`Logo`}
              width={60}
              height={60}
              className="transition-transform duration-300 hover:scale-105"
            />
          </div>
          <span className="font-malisha text-admin-text-primary">
            {businessConfig.name}
          </span>
        </Link>
      </div>

      {/* Quick Stats - Optical Shop Focused */}
      <div className="px-6 bg-admin-bg-primary">
        <div className="admin-card">
          <div className="admin-card-content">
            <h3 className="admin-card-title">Resumen Rápido</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  Trabajos Pendientes
                </span>
                <span className="font-medium text-orange-600">
                  {stats.newWorkOrders}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">En Proceso</span>
                <span className="font-medium text-blue-600">
                  {stats.inProgressWorkOrders}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  Presupuestos Pendientes
                </span>
                <span className="font-medium text-purple-600">
                  {stats.pendingQuotes}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Citas Hoy</span>
                <span className="font-medium text-green-600">
                  {stats.todayAppointments}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="admin-sidebar-nav bg-admin-bg-primary">
        <ul role="list" className="flex flex-1 flex-col gap-y-1">
          {createNavigationItems(stats.newWorkOrders, stats.openTickets, isRoot)
            .filter((item: any) => {
              // Filter out super admin only items if user is not super admin
              if (item.superAdminOnly && !isSuperAdmin) {
                return false;
              }
              // Filter out root-only items if user is not root/dev
              if (item.rootOnly && !isRoot) {
                return false;
              }
              // Filter out onboarding-only items if user has an active organization
              // Show checkout only during onboarding (when onboardingRequired is true or hasOrganization is false/null)
              if (item.onboardingOnly) {
                if (
                  organizationState?.hasOrganization &&
                  !organizationState?.onboardingRequired
                ) {
                  return false; // Hide checkout if user has active organization
                }
              }
              return true;
            })
            .map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/admin" && pathname.startsWith(item.href));

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn("admin-nav-item", isActive && "active")}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span>{item.label}</span>
                        {item.badge && (
                          <Badge
                            variant="secondary"
                            className="admin-badge admin-badge-error"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.description}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-6">
        <div className="text-center">
          <p className="text-xs text-gray-500">
            {businessConfig.displayName || businessConfig.name} v1.0
          </p>
          <p className="text-xs text-gray-500 mt-1">Admin Panel</p>
        </div>
      </div>
    </div>
  );
}
