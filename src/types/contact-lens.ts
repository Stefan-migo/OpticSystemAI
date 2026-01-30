/**
 * Types for Contact Lens System
 *
 * This module defines TypeScript types for contact lenses, following the same
 * pattern as the optical lens system but adapted for contact lens-specific
 * characteristics.
 */

export type ContactLensUseType =
  | "daily"
  | "bi_weekly"
  | "monthly"
  | "extended_wear";
export type ContactLensModality =
  | "spherical"
  | "toric"
  | "multifocal"
  | "cosmetic";
export type ContactLensMaterial =
  | "silicone_hydrogel"
  | "hydrogel"
  | "rigid_gas_permeable";
export type ContactLensPackaging = "box_30" | "box_6" | "box_3" | "bottle";

export interface ContactLensFamily {
  id: string;
  name: string;
  brand?: string;
  description?: string;
  use_type: ContactLensUseType;
  modality: ContactLensModality;
  material?: ContactLensMaterial;
  packaging: ContactLensPackaging;
  base_curve?: number;
  diameter?: number;
  organization_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContactLensPriceMatrix {
  id: string;
  contact_lens_family_id: string;
  sphere_min: number;
  sphere_max: number;
  cylinder_min: number;
  cylinder_max: number;
  axis_min: number;
  axis_max: number;
  addition_min: number;
  addition_max: number;
  base_price: number;
  cost: number;
  organization_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContactLensRx {
  sphere: number;
  cylinder?: number;
  axis?: number;
  addition?: number;
  base_curve?: number;
  diameter?: number;
}

export interface ContactLensPriceCalculation {
  price: number;
  cost: number;
  base_curve?: number;
  diameter?: number;
}
