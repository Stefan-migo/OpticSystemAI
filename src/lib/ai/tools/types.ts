import type { SupabaseClient } from "@supabase/supabase-js";

export interface ToolExecutionContext {
  userId: string;
  organizationId: string;
  supabase: SupabaseClient<any>;
}

export interface ToolResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ToolError {
  code: string;
  message: string;
  details?: any;
}

export type ToolFunction<TParams = any, TResult = any> = (
  params: TParams,
  context: ToolExecutionContext,
) => Promise<ToolResult<TResult>>;

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: ToolFunction;
  requiresConfirmation?: boolean;
  category?: string;
}
