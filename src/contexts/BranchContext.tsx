"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useAuthContext } from "./AuthContext";

export interface Branch {
  id: string;
  name: string;
  code: string;
  role?: string;
  is_primary?: boolean;
}

interface BranchContextType {
  branches: Branch[];
  currentBranch: Branch | null;
  isGlobalView: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
  setCurrentBranch: (branchId: string | "global" | null) => Promise<void>;
  refreshBranches: () => Promise<void>;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

const STORAGE_KEY = "selected_branch_id";

interface BranchProviderProps {
  children: ReactNode;
}

export function BranchProvider({ children }: BranchProviderProps) {
  const { user, loading: authLoading } = useAuthContext();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentBranch, setCurrentBranchState] = useState<Branch | null>(null);
  const [isGlobalView, setIsGlobalView] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBranches = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/branches");

      if (!response.ok) {
        throw new Error("Failed to fetch branches");
      }

      const data = await response.json();
      setBranches(data.branches || []);
      setIsSuperAdmin(data.isSuperAdmin || false);

      // For super admins, prioritize localStorage to maintain selection across page reloads
      // For regular admins, use server values (they have assigned branches)
      if (data.isSuperAdmin) {
        const savedBranchId = localStorage.getItem(STORAGE_KEY);

        if (savedBranchId === "global") {
          // Restore global view
          setCurrentBranchState(null);
          setIsGlobalView(true);
        } else if (savedBranchId) {
          // Restore saved branch selection
          const branch = data.branches?.find(
            (b: Branch) => b.id === savedBranchId,
          );
          if (branch) {
            setCurrentBranchState(branch);
            setIsGlobalView(false);
          } else {
            // Saved branch no longer exists, default to global view for super admin
            setCurrentBranchState(null);
            setIsGlobalView(true);
            localStorage.setItem(STORAGE_KEY, "global");
          }
        } else {
          // No saved selection, use server values or default to global view
          if (data.currentBranch) {
            const branch = data.branches?.find(
              (b: Branch) => b.id === data.currentBranch,
            );
            if (branch) {
              setCurrentBranchState(branch);
              setIsGlobalView(false);
              localStorage.setItem(STORAGE_KEY, branch.id);
            } else {
              setCurrentBranchState(null);
              setIsGlobalView(true);
              localStorage.setItem(STORAGE_KEY, "global");
            }
          } else if (data.isGlobalView) {
            setCurrentBranchState(null);
            setIsGlobalView(true);
            localStorage.setItem(STORAGE_KEY, "global");
          } else {
            // Default to global view for super admin
            setCurrentBranchState(null);
            setIsGlobalView(true);
            localStorage.setItem(STORAGE_KEY, "global");
          }
        }
      } else {
        // Regular admin: use server values (they have assigned branches)
        setIsGlobalView(data.isGlobalView || false);

        if (data.currentBranch) {
          const branch = data.branches?.find(
            (b: Branch) => b.id === data.currentBranch,
          );
          if (branch) {
            setCurrentBranchState(branch);
            localStorage.setItem(STORAGE_KEY, branch.id);
          } else {
            // Use first available branch
            const firstBranch = data.branches?.[0];
            if (firstBranch) {
              setCurrentBranchState(firstBranch);
              localStorage.setItem(STORAGE_KEY, firstBranch.id);
            }
          }
        } else {
          // Use primary branch or first available
          const primaryBranch = data.branches?.find(
            (b: Branch) => b.is_primary,
          );
          const branch = primaryBranch || data.branches?.[0];
          if (branch) {
            setCurrentBranchState(branch);
            localStorage.setItem(STORAGE_KEY, branch.id);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setCurrentBranch = async (branchId: string | "global" | null) => {
    if (branchId === "global") {
      if (!isSuperAdmin) {
        console.error("Only super admins can use global view");
        return;
      }
      setCurrentBranchState(null);
      setIsGlobalView(true);
      localStorage.setItem(STORAGE_KEY, "global");

      // Notify server of branch change
      await fetch("/api/admin/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_branch", branch_id: null }),
      });
    } else if (branchId) {
      const branch = branches.find((b) => b.id === branchId);
      if (branch) {
        setCurrentBranchState(branch);
        setIsGlobalView(false);
        localStorage.setItem(STORAGE_KEY, branch.id);

        // Notify server of branch change
        await fetch("/api/admin/branches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "set_branch", branch_id: branchId }),
        });
      }
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchBranches();
    } else if (!authLoading && !user) {
      setIsLoading(false);
      setBranches([]);
      setCurrentBranchState(null);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user, authLoading]);

  return (
    <BranchContext.Provider
      value={{
        branches,
        currentBranch,
        isGlobalView,
        isSuperAdmin,
        isLoading,
        setCurrentBranch,
        refreshBranches: fetchBranches,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export function useBranchContext() {
  const context = useContext(BranchContext);
  if (context === undefined) {
    throw new Error("useBranchContext must be used within a BranchProvider");
  }
  return context;
}
