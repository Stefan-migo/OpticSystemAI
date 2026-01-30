/**
 * Type definitions for Supabase RPC (Remote Procedure Call) functions
 *
 * This file contains type-safe definitions for all RPC functions used in the application.
 * These types replace the use of `any` when calling Supabase RPC functions.
 *
 * @see https://supabase.com/docs/guides/database/functions
 */

/**
 * RPC function: is_admin
 *
 * Checks if a user has admin privileges.
 *
 * @param user_id - The UUID of the user to check
 * @returns boolean - true if user is an admin, false otherwise
 */
export interface IsAdminParams {
  user_id: string;
}

export type IsAdminResult = boolean;

/**
 * RPC function: get_admin_role
 *
 * Gets the admin role for a user.
 *
 * @param user_id - The UUID of the user
 * @returns string - The admin role (e.g., 'admin', 'superadmin')
 */
export interface GetAdminRoleParams {
  user_id: string;
}

export type GetAdminRoleResult = string | null;

/**
 * RPC function: is_super_admin
 *
 * Checks if a user has super admin privileges.
 *
 * @param user_id - The UUID of the user to check
 * @returns boolean - true if user is a super admin, false otherwise
 */
export interface IsSuperAdminParams {
  user_id: string;
}

export type IsSuperAdminResult = boolean;

/**
 * RPC function: is_root_user
 *
 * Checks if a user has root or dev role for SaaS management access.
 *
 * @param user_id - The UUID of the user to check (defaults to auth.uid())
 * @returns boolean - true if user is root or dev, false otherwise
 */
export interface IsRootUserParams {
  user_id: string;
}

export type IsRootUserResult = boolean;

/**
 * RPC function: is_employee
 *
 * Checks if a user has employee role (operational access only).
 *
 * @param user_id - The UUID of the user to check (defaults to auth.uid())
 * @returns boolean - true if user is employee, false otherwise
 */
export interface IsEmployeeParams {
  user_id: string;
}

export type IsEmployeeResult = boolean;

/**
 * RPC function: log_admin_activity
 *
 * Logs an admin activity for audit purposes.
 *
 * @param p_action - The action performed (e.g., 'create_product', 'update_order')
 * @param p_resource_type - The type of resource affected (e.g., 'product', 'order')
 * @param p_resource_id - The ID of the resource (optional)
 * @param p_details - Additional details as JSON string (optional)
 * @returns void
 */
export interface LogAdminActivityParams {
  p_action: string;
  p_resource_type: string;
  p_resource_id?: string | null;
  p_details?: string | null;
}

export type LogAdminActivityResult = void;

/**
 * RPC function: check_appointment_availability
 *
 * Checks if a time slot is available for an appointment.
 *
 * @param p_date - The date of the appointment (ISO date string)
 * @param p_time - The time of the appointment (HH:MM format)
 * @param p_duration_minutes - Duration of the appointment in minutes
 * @param p_appointment_id - ID of existing appointment to exclude from check (optional)
 * @param p_staff_id - ID of staff member (optional)
 * @param p_branch_id - ID of branch (required for non-super admins)
 * @returns boolean - true if available, false otherwise
 */
export interface CheckAppointmentAvailabilityParams {
  p_date: string;
  p_time: string;
  p_duration_minutes: number;
  p_appointment_id?: string | null;
  p_staff_id?: string | null;
  p_branch_id: string | null;
}

export type CheckAppointmentAvailabilityResult = boolean | string; // PostgreSQL may return 't'/'f' as string

/**
 * RPC function: get_available_time_slots
 *
 * Gets available time slots for appointments on a given date.
 *
 * @param p_date - The date to check (ISO date string)
 * @param p_duration_minutes - Duration of appointments in minutes
 * @param p_staff_id - ID of staff member (optional)
 * @param p_branch_id - ID of branch (optional)
 * @returns Array of time slot objects
 */
export interface GetAvailableTimeSlotsParams {
  p_date: string;
  p_duration_minutes: number;
  p_staff_id?: string | null;
  p_branch_id?: string | null;
}

export interface TimeSlot {
  time_slot: string; // HH:MM format
  available: boolean | string; // PostgreSQL may return 't'/'f' as string
}

export type GetAvailableTimeSlotsResult = TimeSlot[] | null;

/**
 * Type-safe RPC function call helper types
 *
 * These types can be used to create a type-safe wrapper for Supabase RPC calls.
 */
export type RPCFunctionMap = {
  is_admin: {
    params: IsAdminParams;
    result: IsAdminResult;
  };
  get_admin_role: {
    params: GetAdminRoleParams;
    result: GetAdminRoleResult;
  };
  is_super_admin: {
    params: IsSuperAdminParams;
    result: IsSuperAdminResult;
  };
  is_root_user: {
    params: IsRootUserParams;
    result: IsRootUserResult;
  };
  is_employee: {
    params: IsEmployeeParams;
    result: IsEmployeeResult;
  };
  log_admin_activity: {
    params: LogAdminActivityParams;
    result: LogAdminActivityResult;
  };
  check_appointment_availability: {
    params: CheckAppointmentAvailabilityParams;
    result: CheckAppointmentAvailabilityResult;
  };
  get_available_time_slots: {
    params: GetAvailableTimeSlotsParams;
    result: GetAvailableTimeSlotsResult;
  };
};

/**
 * Helper type to extract RPC function parameters
 */
export type RPCParams<T extends keyof RPCFunctionMap> =
  RPCFunctionMap[T]["params"];

/**
 * Helper type to extract RPC function result
 */
export type RPCResult<T extends keyof RPCFunctionMap> =
  RPCFunctionMap[T]["result"];
