'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuthContext();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // User is logged in, check if admin and redirect accordingly
        const checkAdminAndRedirect = async () => {
          try {
            const { createClient } = await import('@/utils/supabase/client');
            const supabase = createClient();
            const { data: isAdmin } = await supabase.rpc('is_admin', { user_id: user.id });
            
            if (isAdmin) {
              router.push('/admin');
            } else {
              router.push('/login'); // Non-admin users should login again
            }
          } catch (error) {
            console.error('Error checking admin status:', error);
            router.push('/login');
          }
        };
        
        checkAdminAndRedirect();
      } else {
        // No user, redirect to login
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  // Show loading while checking
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando...</p>
      </div>
    </div>
  );
}

