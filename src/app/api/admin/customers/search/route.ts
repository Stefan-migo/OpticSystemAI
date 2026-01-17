import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/utils/supabase/server';
import { normalizeRUT, formatRUT } from '@/lib/utils/rut';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check admin authorization
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: isAdmin } = await supabase.rpc('is_admin', { user_id: user.id });
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';

    if (query.length < 1) {
      return NextResponse.json({ customers: [] });
    }

    // Use service role client to bypass RLS and ensure we can search all customers
    const supabaseServiceRole = createServiceRoleClient();
    let searchTerm = query.trim();
    
    // Normalize RUT: remove dots, dashes, and spaces for searching
    // This allows searching with or without formatting
    const normalizedSearchTerm = normalizeRUT(searchTerm);
    
    // Also format the normalized RUT (in case user searches without format but RUT is stored with format)
    const formattedSearchTerm = formatRUT(normalizedSearchTerm);
    
    console.log('🔍 Searching customers with query:', searchTerm);
    console.log('🔍 Normalized search term (for RUT):', normalizedSearchTerm);
    console.log('🔍 Formatted search term (for RUT):', formattedSearchTerm);
    
    // Check if search term looks like a RUT (mostly numbers, possibly with dots/dashes/K)
    // Allow partial RUT searches (minimum 3 digits for partial match)
    const isRutSearch = /^[\d.\-Kk\s]+$/.test(searchTerm) && normalizedSearchTerm.length >= 3;
    
    // Try multiple search approaches - PostgREST syntax can be tricky
    // Approach 1: For RUT searches, use SQL function for better partial matching
    let customers: any[] = [];
    let error: any = null;
    
    // If this looks like a RUT search, try the SQL function first (handles partial matches better)
    if (isRutSearch) {
      try {
        console.log('🔍 Using RUT search function for:', searchTerm);
        const { data: rutCustomers, error: rutError } = await supabaseServiceRole
          .rpc('search_customers_by_rut', { rut_search_term: searchTerm });
        
        if (!rutError && rutCustomers && rutCustomers.length > 0) {
          customers.push(...rutCustomers);
          console.log(`✅ Found ${rutCustomers.length} customers via RUT function`);
        } else if (rutError) {
          console.log('⚠️ RUT function error:', rutError.message);
        }
      } catch (rpcError: any) {
        console.log('⚠️ RUT function not available, using standard search:', rpcError.message);
      }
    }
    
    // Approach 2: Use or() with ilike (standard PostgREST syntax) for all fields
    try {
      // Build the or() query string - format: field.ilike.pattern
      // Note: business_name doesn't exist in profiles table, removed from search
      const searchPattern = `%${searchTerm}%`;
      const normalizedPattern = `%${normalizedSearchTerm}%`;
      const formattedPattern = `%${formattedSearchTerm}%`;
      
      // For RUT search, we need to search both the formatted and normalized versions
      // We'll use a more complex query that handles RUT normalization
      let orQuery = `first_name.ilike.${searchPattern},last_name.ilike.${searchPattern},email.ilike.${searchPattern},phone.ilike.${searchPattern}`;
      
      // Add RUT search patterns (original, normalized, and formatted)
      if (isRutSearch) {
        // Also search with original term, normalized term, and formatted term
        // This covers all cases:
        // - User searches "123456789" -> finds RUTs stored as "123456789" or "12.345.678-9"
        // - User searches "12.345.678-9" -> finds RUTs stored as "12.345.678-9" or "123456789"
        // - User searches "102534" (partial) -> RUT function handles this, but we also try standard search
        orQuery += `,rut.ilike.${searchPattern},rut.ilike.${normalizedPattern},rut.ilike.${formattedPattern}`;
      } else {
        // For non-RUT searches, still try RUT field with original pattern
        orQuery += `,rut.ilike.${searchPattern}`;
      }
      
      console.log('🔍 OR query:', orQuery);
      
      const result = await supabaseServiceRole
        .from('profiles')
        .select('id, first_name, last_name, email, phone, rut')
        .or(orQuery)
        .limit(20);
      
      // Combine results from RUT function and standard search
      const standardResults = result.data || [];
      
      // Merge results, avoiding duplicates
      const existingIds = new Set(customers.map(c => c.id));
      standardResults.forEach((customer: any) => {
        if (!existingIds.has(customer.id)) {
          customers.push(customer);
          existingIds.add(customer.id);
        }
      });
      
      error = result.error;
      
      if (error) {
        console.error('❌ Search error with or():', error);
        throw error;
      }
    } catch (orError: any) {
      console.error('❌ OR query failed, trying alternative approach:', orError);
      
      // Fallback: Try individual queries and combine results
      // For RUT, we need to search both formatted and normalized versions
      try {
        const searchPattern = `%${searchTerm}%`;
        const normalizedPattern = `%${normalizedSearchTerm}%`;
        const formattedPattern = `%${formattedSearchTerm}%`;
        
        const queries = [
          supabaseServiceRole
            .from('profiles')
            .select('id, first_name, last_name, email, phone, rut')
            .or(`first_name.ilike.${searchPattern},last_name.ilike.${searchPattern}`)
            .limit(20),
          supabaseServiceRole
            .from('profiles')
            .select('id, first_name, last_name, email, phone, rut')
            .ilike('email', searchPattern)
            .limit(20),
          supabaseServiceRole
            .from('profiles')
            .select('id, first_name, last_name, email, phone, rut')
            .ilike('phone', searchPattern)
            .limit(20)
        ];
        
        // For RUT search, try original, normalized, and formatted patterns
        // Also try the SQL function for normalized RUT search (partial matches)
        if (isRutSearch) {
          // Try SQL function first for better partial matching
          try {
            const { data: rutCustomers } = await supabaseServiceRole
              .rpc('search_customers_by_rut', { rut_search_term: searchTerm });
            
            if (rutCustomers) {
              allCustomers.push(...rutCustomers);
            }
          } catch (rpcError) {
            console.log('⚠️ RUT function not available in fallback');
          }
          
          queries.push(
            supabaseServiceRole
              .from('profiles')
              .select('id, first_name, last_name, email, phone, rut')
              .ilike('rut', searchPattern)
              .limit(20),
            supabaseServiceRole
              .from('profiles')
              .select('id, first_name, last_name, email, phone, rut')
              .ilike('rut', normalizedPattern)
              .limit(20),
            supabaseServiceRole
              .from('profiles')
              .select('id, first_name, last_name, email, phone, rut')
              .ilike('rut', formattedPattern)
              .limit(20)
          );
        } else {
          // For non-RUT searches, still try RUT field with original pattern
          queries.push(
            supabaseServiceRole
              .from('profiles')
              .select('id, first_name, last_name, email, phone, rut')
              .ilike('rut', searchPattern)
              .limit(20)
          );
        }
        
        const results = await Promise.all(queries);
        
        // Combine results from queries
        results.forEach(result => {
          if (result.data) {
            allCustomers.push(...result.data);
          }
        });
        
        // Remove duplicates by id and combine with existing customers from RUT function
        const existingIds = new Set(customers.map(c => c.id));
        allCustomers.forEach((customer: any) => {
          if (!existingIds.has(customer.id)) {
            customers.push(customer);
            existingIds.add(customer.id);
          }
        });
        
        // Limit to 20 total results
        customers = customers.slice(0, 20);
        console.log(`✅ Found ${customers.length} customers using fallback method`);
      } catch (fallbackError: any) {
        console.error('❌ Fallback search also failed:', fallbackError);
        error = fallbackError;
      }
    }
    
    if (error) {
      console.error('Error searching customers:', error);
      return NextResponse.json({ 
        error: 'Failed to search customers',
        details: error.message 
      }, { status: 500 });
    }
    
    console.log(`✅ Found ${customers.length} customers`);

    return NextResponse.json({
      customers: customers || []
    });

  } catch (error: any) {
    console.error('Error in customer search API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}
