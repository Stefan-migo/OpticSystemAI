"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { ArrowLeft, Package, Save, AlertTriangle, Plus, X } from 'lucide-react';
import Link from 'next/link';
import RichTextEditor from '@/components/ui/RichTextEditor';
import ImageUpload from '@/components/ui/ImageUpload';
import { useProductOptions } from '@/hooks/useProductOptions';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const { options: productOptions, loading: optionsLoading } = useProductOptions();

  // Helper function to get options from database or fallback to defaults
  const getOptions = (fieldKey: string, fallback: any[] = []) => {
    if (optionsLoading) return fallback;
    const dbOptions = productOptions[fieldKey];
    if (dbOptions && dbOptions.length > 0) {
      return dbOptions.map(opt => ({ value: opt.value, label: opt.label }));
    }
    return fallback;
  };

  // Optical product options
  const productTypes = getOptions('product_type', [
    { value: 'frame', label: 'Armazón' },
    { value: 'lens', label: 'Lente' },
    { value: 'accessory', label: 'Accesorio' },
    { value: 'service', label: 'Servicio' }
  ]);

  const opticalCategories = getOptions('optical_category', [
    { value: 'sunglasses', label: 'Lentes de Sol' },
    { value: 'prescription_glasses', label: 'Lentes con Receta' },
    { value: 'reading_glasses', label: 'Lentes de Lectura' },
    { value: 'safety_glasses', label: 'Lentes de Seguridad' },
    { value: 'contact_lenses', label: 'Lentes de Contacto' },
    { value: 'accessories', label: 'Accesorios' },
    { value: 'services', label: 'Servicios' }
  ]);

  const frameTypes = getOptions('frame_type', [
    { value: 'full_frame', label: 'Marco Completo' },
    { value: 'half_frame', label: 'Media Montura' },
    { value: 'rimless', label: 'Sin Marco' },
    { value: 'semi_rimless', label: 'Semi Sin Marco' },
    { value: 'browline', label: 'Browline' },
    { value: 'cat_eye', label: 'Ojo de Gato' },
    { value: 'aviator', label: 'Aviador' },
    { value: 'round', label: 'Redondo' },
    { value: 'square', label: 'Cuadrado' },
    { value: 'rectangular', label: 'Rectangular' },
    { value: 'oval', label: 'Oval' },
    { value: 'geometric', label: 'Geométrico' }
  ]);

  const frameMaterials = getOptions('frame_material', [
    { value: 'acetate', label: 'Acetato' },
    { value: 'metal', label: 'Metal' },
    { value: 'titanium', label: 'Titanio' },
    { value: 'stainless_steel', label: 'Acero Inoxidable' },
    { value: 'aluminum', label: 'Aluminio' },
    { value: 'carbon_fiber', label: 'Fibra de Carbono' },
    { value: 'wood', label: 'Madera' },
    { value: 'horn', label: 'Cuerno' },
    { value: 'plastic', label: 'Plástico' },
    { value: 'tr90', label: 'TR90' },
    { value: 'monel', label: 'Monel' },
    { value: 'beta_titanium', label: 'Beta Titanio' }
  ]);

  const frameShapes = getOptions('frame_shape', [
    { value: 'round', label: 'Redondo' },
    { value: 'square', label: 'Cuadrado' },
    { value: 'rectangular', label: 'Rectangular' },
    { value: 'oval', label: 'Oval' },
    { value: 'cat_eye', label: 'Ojo de Gato' },
    { value: 'aviator', label: 'Aviador' },
    { value: 'browline', label: 'Browline' },
    { value: 'geometric', label: 'Geométrico' },
    { value: 'shield', label: 'Escudo' },
    { value: 'wrap', label: 'Wrap' },
    { value: 'sport', label: 'Deportivo' }
  ]);

  const frameGenders = getOptions('frame_gender', [
    { value: 'mens', label: 'Hombre' },
    { value: 'womens', label: 'Mujer' },
    { value: 'unisex', label: 'Unisex' },
    { value: 'kids', label: 'Niños' },
    { value: 'youth', label: 'Juvenil' }
  ]);

  const frameSizes = getOptions('frame_size', [
    { value: 'narrow', label: 'Estrecho' },
    { value: 'medium', label: 'Mediano' },
    { value: 'wide', label: 'Ancho' },
    { value: 'extra_wide', label: 'Extra Ancho' }
  ]);

  const frameFeatures = productOptions['frame_features']?.map(opt => opt.value) || [
    'spring_hinges',
    'adjustable_nose_pads',
    'flexible_temples',
    'lightweight',
    'durable',
    'sports_ready',
    'memory_metal'
  ];

  const lensTypes = getOptions('lens_type', [
    { value: 'single_vision', label: 'Monofocal' },
    { value: 'bifocal', label: 'Bifocal' },
    { value: 'trifocal', label: 'Trifocal' },
    { value: 'progressive', label: 'Progresivo' },
    { value: 'reading', label: 'Lectura' },
    { value: 'computer', label: 'Computadora' },
    { value: 'driving', label: 'Conducción' },
    { value: 'sports', label: 'Deportivo' },
    { value: 'photochromic', label: 'Fotocromático' },
    { value: 'polarized', label: 'Polarizado' }
  ]);

  const lensMaterials = getOptions('lens_material', [
    { value: 'cr39', label: 'CR-39' },
    { value: 'polycarbonate', label: 'Policarbonato' },
    { value: 'high_index_1_67', label: 'Alto Índice 1.67' },
    { value: 'high_index_1_74', label: 'Alto Índice 1.74' },
    { value: 'trivex', label: 'Trivex' },
    { value: 'glass', label: 'Vidrio' },
    { value: 'photochromic', label: 'Fotocromático' }
  ]);

  const lensCoatings = productOptions['lens_coatings']?.map(opt => opt.value) || [
    'anti_reflective',
    'blue_light_filter',
    'uv_protection',
    'scratch_resistant',
    'anti_fog',
    'mirror',
    'tint',
    'polarized'
  ];

  const uvProtectionLevels = getOptions('uv_protection', [
    { value: 'none', label: 'Ninguno' },
    { value: 'uv400', label: 'UV400' },
    { value: 'uv380', label: 'UV380' },
    { value: 'uv350', label: 'UV350' }
  ]);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    short_description: '',
    description: '',
    price: '',
    compare_at_price: '',
    category_id: '',
    featured_image: '',
    gallery: [] as string[],
    inventory_quantity: '',
    is_featured: false,
    status: 'active',
    // Optical product fields
    product_type: 'frame',
    optical_category: '',
    sku: '',
    barcode: '',
    brand: '',
    manufacturer: '',
    model_number: '',
    // Frame fields
    frame_type: '',
    frame_material: '',
    frame_shape: '',
    frame_color: '',
    frame_colors: [] as string[],
    frame_brand: '',
    frame_model: '',
    frame_sku: '',
    frame_gender: '',
    frame_age_group: '',
    frame_size: '',
    frame_features: [] as string[],
    frame_measurements: {
      lens_width: '',
      bridge_width: '',
      temple_length: '',
      lens_height: '',
      total_width: ''
    },
    // Lens fields
    lens_type: '',
    lens_material: '',
    lens_index: '',
    lens_coatings: [] as string[],
    lens_tint_options: [] as string[],
    uv_protection: '',
    blue_light_filter: false,
    blue_light_filter_percentage: '',
    photochromic: false,
    prescription_available: false,
    prescription_range: {
      sph_min: '',
      sph_max: '',
      cyl_min: '',
      cyl_max: '',
      add_min: '',
      add_max: ''
    },
    requires_prescription: false,
    is_customizable: false,
    warranty_months: '',
    warranty_details: '',
  });

  // Form protection state
  const [hasChanges, setHasChanges] = useState(false);
  const [initialData, setInitialData] = useState<any>(null);

  // Update form data with change detection
  const updateFormData = (updates: any) => {
    setFormData(prev => {
      const newData = { ...prev, ...updates };

      // Check if there are changes
      if (initialData) {
        const hasFormChanges = JSON.stringify(newData) !== JSON.stringify(initialData);
        setHasChanges(hasFormChanges);
      }

      return newData;
    });
  };

  // Fetch product data and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch product data including archived products for admin editing
        const productResponse = await fetch(`/api/admin/products/${productId}?include_archived=true`);
        if (!productResponse.ok) {
          throw new Error('Failed to fetch product');
        }
        const productData = await productResponse.json();

        // Fetch categories
        const categoriesResponse = await fetch('/api/categories');
        if (!categoriesResponse.ok) {
          throw new Error('Failed to fetch categories');
        }
        const categoriesData = await categoriesResponse.json();

        // Set form data with product values
        const product = productData.product;
        const initialFormData = {
          name: product.name || '',
          slug: product.slug || '',
          short_description: product.short_description || '',
          description: product.description || '',
          price: product.price?.toString() || '',
          compare_at_price: product.compare_at_price?.toString() || '',
          category_id: product.category_id || '',
          featured_image: product.featured_image || '',
          gallery: product.gallery || [],
          inventory_quantity: product.inventory_quantity?.toString() || '',
          is_featured: product.is_featured || false,
          status: product.status || 'active',
          // Optical product fields
          product_type: product.product_type || 'frame',
          optical_category: product.optical_category || '',
          sku: product.sku || '',
          barcode: product.barcode || '',
          brand: product.brand || '',
          manufacturer: product.manufacturer || '',
          model_number: product.model_number || '',
          // Frame fields
          frame_type: product.frame_type || '',
          frame_material: product.frame_material || '',
          frame_shape: product.frame_shape || '',
          frame_color: product.frame_color || '',
          frame_colors: product.frame_colors || [],
          frame_brand: product.frame_brand || '',
          frame_model: product.frame_model || '',
          frame_sku: product.frame_sku || '',
          frame_gender: product.frame_gender || '',
          frame_age_group: product.frame_age_group || '',
          frame_size: product.frame_size || '',
          frame_features: product.frame_features || [],
          frame_measurements: product.frame_measurements || {
            lens_width: '',
            bridge_width: '',
            temple_length: '',
            lens_height: '',
            total_width: ''
          },
          // Lens fields
          lens_type: product.lens_type || '',
          lens_material: product.lens_material || '',
          lens_index: product.lens_index?.toString() || '',
          lens_coatings: product.lens_coatings || [],
          lens_tint_options: product.lens_tint_options || [],
          uv_protection: product.uv_protection || '',
          blue_light_filter: product.blue_light_filter || false,
          blue_light_filter_percentage: product.blue_light_filter_percentage?.toString() || '',
          photochromic: product.photochromic || false,
          prescription_available: product.prescription_available || false,
          prescription_range: product.prescription_range || {
            sph_min: '',
            sph_max: '',
            cyl_min: '',
            cyl_max: '',
            add_min: '',
            add_max: ''
          },
          requires_prescription: product.requires_prescription || false,
          is_customizable: product.is_customizable || false,
          warranty_months: product.warranty_months?.toString() || '',
          warranty_details: product.warranty_details || '',
        };
        
        // Convert frame_measurements numbers to strings for form inputs
        if (initialFormData.frame_measurements && typeof initialFormData.frame_measurements === 'object') {
          initialFormData.frame_measurements = {
            lens_width: initialFormData.frame_measurements.lens_width?.toString() || '',
            bridge_width: initialFormData.frame_measurements.bridge_width?.toString() || '',
            temple_length: initialFormData.frame_measurements.temple_length?.toString() || '',
            lens_height: initialFormData.frame_measurements.lens_height?.toString() || '',
            total_width: initialFormData.frame_measurements.total_width?.toString() || ''
          };
        }
        
        // Convert prescription_range numbers to strings for form inputs
        if (initialFormData.prescription_range && typeof initialFormData.prescription_range === 'object') {
          initialFormData.prescription_range = {
            sph_min: initialFormData.prescription_range.sph_min?.toString() || '',
            sph_max: initialFormData.prescription_range.sph_max?.toString() || '',
            cyl_min: initialFormData.prescription_range.cyl_min?.toString() || '',
            cyl_max: initialFormData.prescription_range.cyl_max?.toString() || '',
            add_min: initialFormData.prescription_range.add_min?.toString() || '',
            add_max: initialFormData.prescription_range.add_max?.toString() || ''
          };
        }

        setFormData(initialFormData);
        setInitialData(initialFormData);

        setCategories(categoriesData.categories || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchData();
    }
  }, [productId]);

  const handleInputChange = (field: string, value: any) => {
    updateFormData({
      [field]: value
    });
  };

  const addToArray = (field: string, value: string) => {
    const currentArray = formData[field as keyof typeof formData] as string[];
    if (!currentArray.includes(value)) {
    updateFormData({
        [field]: [...currentArray, value]
    });
    }
  };

  const removeFromArray = (field: string, value: string) => {
    const currentArray = formData[field as keyof typeof formData] as string[];
    updateFormData({
      [field]: currentArray.filter(item => item !== value)
    });
  };

  const updateFrameMeasurement = (field: string, value: string) => {
    updateFormData({
      frame_measurements: {
        ...formData.frame_measurements,
      [field]: value
      }
    });
  };

  const updatePrescriptionRange = (field: string, value: string) => {
    updateFormData({
      prescription_range: {
        ...formData.prescription_range,
        [field]: value
      }
    });
  };

  const handleSubmit = async (e?: React.FormEvent, status?: string) => {
    if (e && e.preventDefault) e.preventDefault();
    setSaving(true);

    try {
      // Prepare frame measurements - convert empty strings to null
      const frameMeasurements = formData.frame_measurements.lens_width || 
        formData.frame_measurements.bridge_width || 
        formData.frame_measurements.temple_length ? {
          lens_width: formData.frame_measurements.lens_width ? parseInt(formData.frame_measurements.lens_width) : null,
          bridge_width: formData.frame_measurements.bridge_width ? parseInt(formData.frame_measurements.bridge_width) : null,
          temple_length: formData.frame_measurements.temple_length ? parseInt(formData.frame_measurements.temple_length) : null,
          lens_height: formData.frame_measurements.lens_height ? parseInt(formData.frame_measurements.lens_height) : null,
          total_width: formData.frame_measurements.total_width ? parseInt(formData.frame_measurements.total_width) : null,
        } : null;

      // Prepare prescription range
      const prescriptionRange = formData.prescription_available && (
        formData.prescription_range.sph_min || formData.prescription_range.sph_max ||
        formData.prescription_range.cyl_min || formData.prescription_range.cyl_max ||
        formData.prescription_range.add_min || formData.prescription_range.add_max
      ) ? {
        sph_min: formData.prescription_range.sph_min ? parseFloat(formData.prescription_range.sph_min) : null,
        sph_max: formData.prescription_range.sph_max ? parseFloat(formData.prescription_range.sph_max) : null,
        cyl_min: formData.prescription_range.cyl_min ? parseFloat(formData.prescription_range.cyl_min) : null,
        cyl_max: formData.prescription_range.cyl_max ? parseFloat(formData.prescription_range.cyl_max) : null,
        add_min: formData.prescription_range.add_min ? parseFloat(formData.prescription_range.add_min) : null,
        add_max: formData.prescription_range.add_max ? parseFloat(formData.prescription_range.add_max) : null,
      } : null;

      const productData = {
        ...formData,
        status: status || formData.status,
        price: parseFloat(formData.price),
        compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
        inventory_quantity: parseInt(formData.inventory_quantity),
        // Optical fields
        frame_measurements: frameMeasurements,
        prescription_range: prescriptionRange,
        lens_index: formData.lens_index ? parseFloat(formData.lens_index) : null,
        warranty_months: formData.warranty_months ? parseInt(formData.warranty_months) : null,
        blue_light_filter_percentage: formData.blue_light_filter_percentage ? parseInt(formData.blue_light_filter_percentage) : null,
        // Remove cosmetics fields that don't apply
        skin_type: undefined,
        benefits: undefined,
        certifications: undefined,
        ingredients: undefined,
        usage_instructions: undefined,
        precautions: undefined,
        package_characteristics: undefined,
      };

      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        toast.success('Producto actualizado exitosamente');
        router.push('/admin/products');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error al actualizar el producto');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar el producto');
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/products">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Productos
            </Link>
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-600 mb-2">Error al cargar producto</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header with changes indicator */}
      <div className="flex justify-between items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-azul-profundo" />
          <h1 className="text-2xl font-bold text-azul-profundo">Editar Producto</h1>
          {hasChanges && (
            <span className="px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded-full border border-amber-200">
              Cambios sin guardar
            </span>
          )}
        </div>
        <Link href="/admin/products">
          <Button className="group btn-enhanced px-6 py-3 lg:px-8 lg:py-4 text-white font-semibold text-sm lg:text-base w-full sm:w-auto">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Productos
          </Button>
        </Link>
      </div>

      {/* Product Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className='bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]'>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nombre del Producto *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Ej: Ray-Ban RB2140 Wayfarer"
                  required
                  className='border-black/20'
                />
              </div>
              <div>
                <Label htmlFor="slug">URL (slug)</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  placeholder="Se genera automáticamente"
                  className='border-black/20'
                />
              </div>
            </div>

            <div>
              <Label htmlFor="short_description">Descripción Corta</Label>
              <RichTextEditor
                value={formData.short_description}
                onChange={(value) => handleInputChange('short_description', value)}
                placeholder="Descripción breve para listados"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="description">Descripción Completa</Label>
              <RichTextEditor
                value={formData.description}
                onChange={(value) => handleInputChange('description', value)}
                placeholder="Descripción detallada del producto..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card className='bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]'>
          <CardHeader>
            <CardTitle>Precios e Inventario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price">Precio (ARS) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="15000"
                  required
                  className='border-black/20'
                />
              </div>
              <div>
                <Label htmlFor="compare_at_price">Precio Anterior (ARS)</Label>
                <Input
                  id="compare_at_price"
                  type="number"
                  step="0.01"
                  value={formData.compare_at_price}
                  onChange={(e) => handleInputChange('compare_at_price', e.target.value)}
                  placeholder="18000"
                  className='border-black/20'
                />
              </div>
              <div>
                <Label htmlFor="inventory_quantity">Stock *</Label>
                <Input
                  id="inventory_quantity"
                  type="number"
                  value={formData.inventory_quantity}
                  onChange={(e) => handleInputChange('inventory_quantity', e.target.value)}
                  placeholder="50"
                  required
                  className='border-black/20'
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Type & Category */}
        <Card className='bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]'>
          <CardHeader>
            <CardTitle>Tipo de Producto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="product_type">Tipo de Producto *</Label>
                <Select value={formData.product_type} onValueChange={(value) => handleInputChange('product_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {productTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="optical_category">Categoría Óptica</Label>
                <Select value={formData.optical_category} onValueChange={(value) => handleInputChange('optical_category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {opticalCategories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Categoría General</Label>
                <Select value={formData.category_id} onValueChange={(value) => handleInputChange('category_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Estado</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Estado del producto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="draft">Borrador</SelectItem>
                    <SelectItem value="archived">Archivado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Brand & Model Information */}
        <Card className='bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]'>
          <CardHeader>
            <CardTitle>Marca y Modelo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="brand">Marca</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => handleInputChange('brand', e.target.value)}
                  placeholder="Ej: Ray-Ban"
                  className='border-black/20'
                />
              </div>
              <div>
                <Label htmlFor="manufacturer">Fabricante</Label>
                <Input
                  id="manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                  placeholder="Ej: Luxottica"
                  className='border-black/20'
                />
              </div>
              <div>
                <Label htmlFor="model_number">Número de Modelo</Label>
                <Input
                  id="model_number"
                  value={formData.model_number}
                  onChange={(e) => handleInputChange('model_number', e.target.value)}
                  placeholder="Ej: RB2140"
                  className='border-black/20'
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => handleInputChange('sku', e.target.value)}
                  placeholder="Código SKU"
                  className='border-black/20'
                />
              </div>
              <div>
                <Label htmlFor="barcode">Código de Barras</Label>
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) => handleInputChange('barcode', e.target.value)}
                  placeholder="Código de barras"
                  className='border-black/20'
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]'>
          <CardHeader>
            <CardTitle>Imágenes del Producto</CardTitle>
            <p className="text-sm text-gray-600">Sube imágenes para el producto (máximo 5 imágenes)</p>
          </CardHeader>
          <CardContent className="space-y-6">
              <div>
                <Label htmlFor="featured_image">Imagen Principal</Label>
                <ImageUpload
                  value={formData.featured_image}
                  onChange={(url) => handleInputChange('featured_image', url)}
                  placeholder="Seleccionar imagen principal del producto"
                />
              </div>

              <div>
                <Label htmlFor="gallery">Galería de Imágenes</Label>
                <p className="text-sm text-gray-500 mb-3">
                  Puedes subir hasta 4 imágenes adicionales (máximo 5 en total)
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: 4 }, (_, index) => (
                    <div key={index} className="relative">
                      <ImageUpload
                        value={formData.gallery[index] || ''}
                        onChange={(url) => {
                          const newGallery = [...formData.gallery];
                          newGallery[index] = url;
                          handleInputChange('gallery', newGallery);
                        }}
                        placeholder={`Imagen ${index + 2}`}
                      />
                      {formData.gallery[index] && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 p-0"
                          onClick={() => {
                            const newGallery = [...formData.gallery];
                            newGallery[index] = '';
                            handleInputChange('gallery', newGallery);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_featured"
                checked={formData.is_featured}
                onCheckedChange={(checked) => handleInputChange('is_featured', checked)}
              />
              <Label htmlFor="is_featured">Producto Destacado</Label>
            </div>
          </CardContent>
        </Card>

        {/* Frame Specifications - Only show if product_type is 'frame' */}
        {formData.product_type === 'frame' && (
        <Card className='bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]'>
          <CardHeader>
              <CardTitle>Especificaciones del Armazón</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <Label>Tipo de Armazón</Label>
                  <Select value={formData.frame_type} onValueChange={(value) => handleInputChange('frame_type', value)}>
                  <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                      {frameTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                  <Label>Material del Armazón</Label>
                  <Select value={formData.frame_material} onValueChange={(value) => handleInputChange('frame_material', value)}>
                  <SelectTrigger>
                      <SelectValue placeholder="Seleccionar material" />
                  </SelectTrigger>
                  <SelectContent>
                      {frameMaterials.map((material) => (
                        <SelectItem key={material.value} value={material.value}>
                          {material.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
                <div>
                  <Label>Forma del Armazón</Label>
                  <Select value={formData.frame_shape} onValueChange={(value) => handleInputChange('frame_shape', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar forma" />
                    </SelectTrigger>
                    <SelectContent>
                      {frameShapes.map((shape) => (
                        <SelectItem key={shape.value} value={shape.value}>
                          {shape.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
            </div>
            <div>
                  <Label>Género</Label>
                  <Select value={formData.frame_gender} onValueChange={(value) => handleInputChange('frame_gender', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar género" />
                    </SelectTrigger>
                    <SelectContent>
                      {frameGenders.map((gender) => (
                        <SelectItem key={gender.value} value={gender.value}>
                          {gender.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tamaño</Label>
                  <Select value={formData.frame_size} onValueChange={(value) => handleInputChange('frame_size', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tamaño" />
                    </SelectTrigger>
                    <SelectContent>
                      {frameSizes.map((size) => (
                        <SelectItem key={size.value} value={size.value}>
                          {size.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Color Principal</Label>
              <Input
                    value={formData.frame_color}
                    onChange={(e) => handleInputChange('frame_color', e.target.value)}
                    placeholder="Ej: Negro"
                    className='border-black/20'
              />
            </div>
              </div>

              {/* Frame Measurements */}
              <div>
                <Label className="mb-2 block">Medidas del Armazón (mm)</Label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <Label className="text-xs">Ancho de Lente</Label>
                  <Input
                      type="number"
                      value={formData.frame_measurements.lens_width}
                      onChange={(e) => updateFrameMeasurement('lens_width', e.target.value)}
                      placeholder="52"
                      className='border-black/20'
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Puente</Label>
                  <Input
                    type="number"
                      value={formData.frame_measurements.bridge_width}
                      onChange={(e) => updateFrameMeasurement('bridge_width', e.target.value)}
                      placeholder="18"
                      className='border-black/20'
                    />
                </div>
                  <div>
                    <Label className="text-xs">Largo de Varilla</Label>
                    <Input
                      type="number"
                      value={formData.frame_measurements.temple_length}
                      onChange={(e) => updateFrameMeasurement('temple_length', e.target.value)}
                      placeholder="140"
                      className='border-black/20'
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Alto de Lente</Label>
                    <Input
                      type="number"
                      value={formData.frame_measurements.lens_height}
                      onChange={(e) => updateFrameMeasurement('lens_height', e.target.value)}
                      placeholder="40"
                      className='border-black/20'
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Ancho Total</Label>
                    <Input
                      type="number"
                      value={formData.frame_measurements.total_width}
                      onChange={(e) => updateFrameMeasurement('total_width', e.target.value)}
                      placeholder="140"
                      className='border-black/20'
                    />
                  </div>
                </div>
              </div>

              {/* Frame Features */}
              <div>
                <Label>Características del Armazón</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.frame_features.map((feature) => (
                    <Badge key={feature} variant="secondary" className="flex items-center gap-1">
                      {feature.replace(/_/g, ' ')}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeFromArray('frame_features', feature)} />
                    </Badge>
                  ))}
                </div>
                <Select onValueChange={(value) => addToArray('frame_features', value)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Agregar característica" />
                  </SelectTrigger>
                  <SelectContent>
                    {frameFeatures.filter(f => !formData.frame_features.includes(f)).map((feature) => (
                      <SelectItem key={feature} value={feature}>
                        {feature.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Lens Specifications - Only show if product_type is 'lens' */}
        {formData.product_type === 'lens' && (
        <Card className='bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]'>
          <CardHeader>
              <CardTitle>Especificaciones del Lente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                  <Label>Tipo de Lente</Label>
                  <Select value={formData.lens_type} onValueChange={(value) => handleInputChange('lens_type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {lensTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Material del Lente</Label>
                  <Select value={formData.lens_material} onValueChange={(value) => handleInputChange('lens_material', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar material" />
                    </SelectTrigger>
                    <SelectContent>
                      {lensMaterials.map((material) => (
                        <SelectItem key={material.value} value={material.value}>
                          {material.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Índice de Refracción</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.lens_index}
                    onChange={(e) => handleInputChange('lens_index', e.target.value)}
                    placeholder="Ej: 1.67"
                    className='border-black/20'
                  />
                </div>
                <div>
                  <Label>Protección UV</Label>
                  <Select value={formData.uv_protection} onValueChange={(value) => handleInputChange('uv_protection', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar nivel" />
                    </SelectTrigger>
                    <SelectContent>
                      {uvProtectionLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
            </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="blue_light_filter"
                    checked={formData.blue_light_filter}
                    onChange={(e) => handleInputChange('blue_light_filter', e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="blue_light_filter">Filtro de Luz Azul</Label>
                </div>
                {formData.blue_light_filter && (
            <div>
                    <Label>Porcentaje de Filtro (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.blue_light_filter_percentage}
                      onChange={(e) => handleInputChange('blue_light_filter_percentage', e.target.value)}
                      placeholder="Ej: 40"
                      className='border-black/20'
              />
            </div>
                )}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="photochromic"
                    checked={formData.photochromic}
                    onChange={(e) => handleInputChange('photochromic', e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="photochromic">Fotocromático (Transitions)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="prescription_available"
                    checked={formData.prescription_available}
                    onChange={(e) => handleInputChange('prescription_available', e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="prescription_available">Disponible con Receta</Label>
                </div>
              </div>

              {/* Lens Coatings */}
              <div>
                <Label>Tratamientos y Recubrimientos</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.lens_coatings.map((coating) => (
                    <Badge key={coating} variant="secondary" className="flex items-center gap-1">
                      {coating.replace(/_/g, ' ')}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeFromArray('lens_coatings', coating)} />
                    </Badge>
                  ))}
                </div>
                <Select onValueChange={(value) => addToArray('lens_coatings', value)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Agregar tratamiento" />
                  </SelectTrigger>
                  <SelectContent>
                    {lensCoatings.filter(c => !formData.lens_coatings.includes(c)).map((coating) => (
                      <SelectItem key={coating} value={coating}>
                        {coating.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Prescription Range */}
              {formData.prescription_available && (
                <div>
                  <Label className="mb-2 block">Rango de Receta Soportado</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs">SPH Mínimo</Label>
                      <Input
                        type="number"
                        step="0.25"
                        value={formData.prescription_range.sph_min}
                        onChange={(e) => updatePrescriptionRange('sph_min', e.target.value)}
                        placeholder="-10.00"
                        className='border-black/20'
                      />
                    </div>
                    <div>
                      <Label className="text-xs">SPH Máximo</Label>
                      <Input
                        type="number"
                        step="0.25"
                        value={formData.prescription_range.sph_max}
                        onChange={(e) => updatePrescriptionRange('sph_max', e.target.value)}
                        placeholder="+6.00"
                        className='border-black/20'
                      />
                    </div>
                    <div>
                      <Label className="text-xs">CIL Mínimo</Label>
                      <Input
                        type="number"
                        step="0.25"
                        value={formData.prescription_range.cyl_min}
                        onChange={(e) => updatePrescriptionRange('cyl_min', e.target.value)}
                        placeholder="-4.00"
                        className='border-black/20'
                      />
                    </div>
                    <div>
                      <Label className="text-xs">CIL Máximo</Label>
                      <Input
                        type="number"
                        step="0.25"
                        value={formData.prescription_range.cyl_max}
                        onChange={(e) => updatePrescriptionRange('cyl_max', e.target.value)}
                        placeholder="+4.00"
                        className='border-black/20'
                      />
                    </div>
                    <div>
                      <Label className="text-xs">ADD Mínimo</Label>
                      <Input
                        type="number"
                        step="0.25"
                        value={formData.prescription_range.add_min}
                        onChange={(e) => updatePrescriptionRange('add_min', e.target.value)}
                        placeholder="0.00"
                        className='border-black/20'
                      />
                    </div>
                    <div>
                      <Label className="text-xs">ADD Máximo</Label>
                      <Input
                        type="number"
                        step="0.25"
                        value={formData.prescription_range.add_max}
                        onChange={(e) => updatePrescriptionRange('add_max', e.target.value)}
                        placeholder="+4.00"
                        className='border-black/20'
                      />
                    </div>
                  </div>
                </div>
              )}
          </CardContent>
        </Card>
        )}

        {/* Warranty & Additional Info */}
        <Card className='bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]'>
          <CardHeader>
            <CardTitle>Garantía e Información Adicional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="warranty_months">Garantía (meses)</Label>
                <Input
                  id="warranty_months"
                  type="number"
                  value={formData.warranty_months}
                  onChange={(e) => handleInputChange('warranty_months', e.target.value)}
                  placeholder="Ej: 12"
                  className='border-black/20'
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="requires_prescription"
                  checked={formData.requires_prescription}
                  onChange={(e) => handleInputChange('requires_prescription', e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="requires_prescription">Requiere Receta</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_customizable"
                  checked={formData.is_customizable}
                  onChange={(e) => handleInputChange('is_customizable', e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="is_customizable">Personalizable</Label>
            </div>
            </div>
            <div>
              <Label htmlFor="warranty_details">Detalles de Garantía</Label>
              <RichTextEditor
                value={formData.warranty_details}
                onChange={(value) => handleInputChange('warranty_details', value)}
                placeholder="Detalles de la garantía, condiciones, etc."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <Link href="/admin/products">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>

          <Button
            type="button"
            variant="secondary"
            disabled={saving}
            onClick={() => handleSubmit(undefined, 'draft')}
            className="flex items-center gap-2 text-white"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Guardando...' : 'Guardar como Borrador'}
          </Button>

          <Button type="submit" disabled={saving} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </div>
  );
}

