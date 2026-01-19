"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Receipt,
  User,
  X,
  Check,
  Loader2,
  ShoppingCart,
  Calculator,
  Printer,
  AlertCircle,
  FileText,
  CheckCircle2,
  Eye,
  Package,
  ChevronDown,
  ChevronUp,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { formatRUT } from "@/lib/utils/rut";
import {
  calculateSubtotal,
  calculateTotalTax,
  calculateTotal,
} from "@/lib/utils/tax";
import { getTaxPercentage } from "@/lib/utils/tax-config";
import { useBranch } from "@/hooks/useBranch";
import { getBranchHeader } from "@/lib/utils/branch";
import { BranchSelector } from "@/components/admin/BranchSelector";

interface Product {
  id: string;
  name: string;
  price: number;
  price_includes_tax?: boolean;
  inventory_quantity: number;
  sku?: string;
  barcode?: string;
  featured_image?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  priceIncludesTax: boolean;
}

interface Customer {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  rut?: string;
  business_name?: string;
  address?: string;
  phone?: string;
}

interface Quote {
  id: string;
  quote_number: string;
  total_amount: number;
  status: string;
  created_at: string;
  frame_name?: string;
  frame_product_id?: string;
  frame_price?: number;
  frame_sku?: string;
  lens_type?: string;
  lens_material?: string;
  lens_cost?: number;
  lens_treatments?: string[];
  treatments_cost?: number;
  labor_cost?: number;
}

type PaymentMethod = "cash" | "debit_card" | "credit_card" | "installments";

export default function POSPage() {
  const {
    currentBranchId,
    isSuperAdmin,
    branches,
    isLoading: branchLoading,
  } = useBranch();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [installmentsCount, setInstallmentsCount] = useState<number>(1);
  const [siiInvoiceType, setSiiInvoiceType] = useState<
    "boleta" | "factura" | "none"
  >("boleta");
  const [customerRUT, setCustomerRUT] = useState<string>("");
  const [customerBusinessName, setCustomerBusinessName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [selectedProductIndex, setSelectedProductIndex] = useState<number>(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Customer search states
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [customerSearchResults, setCustomerSearchResults] = useState<
    Customer[]
  >([]);
  const [searchingCustomers, setSearchingCustomers] = useState(false);
  const [selectedCustomerIndex, setSelectedCustomerIndex] =
    useState<number>(-1);
  const customerSearchInputRef = useRef<HTMLInputElement>(null);
  const customerSuggestionsRef = useRef<HTMLDivElement>(null);

  // Quote loading states
  const [customerQuotes, setCustomerQuotes] = useState<Quote[]>([]);
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  // Complete order form states
  const [quoteSettings, setQuoteSettings] = useState<any>(null);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [frameSearch, setFrameSearch] = useState("");
  const [frameResults, setFrameResults] = useState<any[]>([]);
  const [selectedFrame, setSelectedFrame] = useState<any>(null);
  const [searchingFrames, setSearchingFrames] = useState(false);
  const [orderFormData, setOrderFormData] = useState({
    frame_name: "",
    frame_brand: "",
    frame_model: "",
    frame_color: "",
    frame_size: "",
    frame_sku: "",
    frame_price: 0,
    lens_type: "",
    lens_material: "",
    lens_index: null as number | null,
    lens_treatments: [] as string[],
    lens_tint_color: "",
    lens_tint_percentage: 0,
    frame_cost: 0,
    lens_cost: 0,
    treatments_cost: 0,
    labor_cost: 0,
    discount_percentage: 0,
  });

  // Tax percentage state
  const [taxPercentage, setTaxPercentage] = useState<number>(19.0);

  // Fetch tax percentage on mount
  useEffect(() => {
    getTaxPercentage(19.0).then(setTaxPercentage);
  }, []);

  // Calculate totals with tax consideration
  const itemsForTaxCalculation = cart.map((item) => ({
    price: item.unitPrice * item.quantity, // Total price for the quantity
    includesTax: item.priceIncludesTax,
  }));

  const subtotal = calculateSubtotal(itemsForTaxCalculation, taxPercentage);
  const taxAmount = calculateTotalTax(itemsForTaxCalculation, taxPercentage);
  const total = calculateTotal(itemsForTaxCalculation, taxPercentage);
  const change = cashReceived - total;

  // Focus search on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Search customers - intelligent search from 1 character
  useEffect(() => {
    const searchCustomers = async () => {
      if (customerSearchTerm.trim().length === 0) {
        setCustomerSearchResults([]);
        setSelectedCustomerIndex(-1);
        setSearchingCustomers(false);
        return;
      }

      setSearchingCustomers(true);
      try {
        const headers: HeadersInit = {
          ...getBranchHeader(currentBranchId),
        };
        const searchUrl = `/api/admin/customers/search?q=${encodeURIComponent(customerSearchTerm)}`;
        console.log("🔍 POS: Searching customers:", searchUrl);

        const response = await fetch(searchUrl, { headers });
        const data = await response.json();

        console.log("📦 POS: Search response:", {
          ok: response.ok,
          status: response.status,
          customersCount: data.customers?.length || 0,
          error: data.error,
        });

        if (response.ok) {
          const customers = (data.customers || []).map((c: any) => ({
            ...c,
            name:
              `${c.first_name || ""} ${c.last_name || ""}`.trim() ||
              c.email ||
              "Sin nombre",
          }));
          console.log("✅ POS: Found customers:", customers.length);
          setCustomerSearchResults(customers);
          setSelectedCustomerIndex(-1);
        } else {
          console.error("❌ POS: Search failed:", data.error || data.details);
          toast.error(data.error || "Error al buscar clientes");
          setCustomerSearchResults([]);
        }
      } catch (error: any) {
        console.error("❌ POS: Error searching customers:", error);
        toast.error("Error al buscar clientes");
        setCustomerSearchResults([]);
      } finally {
        setSearchingCustomers(false);
      }
    };

    const debounce = setTimeout(searchCustomers, 200);
    return () => clearTimeout(debounce);
  }, [customerSearchTerm, currentBranchId]);

  // Fetch customer quotes when customer is selected
  const fetchCustomerQuotes = async (customerId: string) => {
    setLoadingQuotes(true);
    try {
      const response = await fetch(
        `/api/admin/quotes?customer_id=${customerId}&status=all&limit=10`,
      );
      if (response.ok) {
        const data = await response.json();
        // Get all quotes (including expired, converted, etc.) for the dropdown
        const allQuotes = data.quotes || [];
        setCustomerQuotes(allQuotes);

        // Filter active quotes for auto-loading
        const activeQuotes = allQuotes.filter(
          (q: Quote) =>
            q.status !== "expired" &&
            q.status !== "converted_to_work" &&
            q.status !== "accepted",
        );

        // If there's exactly one active quote, load it automatically into cart
        if (activeQuotes.length === 1) {
          toast.info(
            `Presupuesto encontrado: ${activeQuotes[0].quote_number}. Cargando automáticamente...`,
          );
          await handleLoadQuoteToForm(activeQuotes[0]);
        }
        // If there are multiple active quotes, load the most recent one automatically
        else if (activeQuotes.length > 1) {
          // Sort by created_at descending and load the most recent
          const sortedQuotes = [...activeQuotes].sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          );
          toast.info(
            `Presupuesto encontrado: ${sortedQuotes[0].quote_number}. Cargando automáticamente...`,
          );
          await handleLoadQuoteToForm(sortedQuotes[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching customer quotes:", error);
    } finally {
      setLoadingQuotes(false);
    }
  };

  // Load quote data into the form (not cart)
  const handleLoadQuoteToForm = async (quote: Quote) => {
    try {
      // Fetch full quote details
      const response = await fetch(`/api/admin/quotes/${quote.id}`);
      if (!response.ok) {
        throw new Error("Error al cargar el presupuesto");
      }

      const data = await response.json();
      const fullQuote = data.quote;

      console.log("📋 Loading quote to form:", fullQuote);

      // Set selected quote
      setSelectedQuote(fullQuote);

      // Reset frame selection first
      setSelectedFrame(null);

      // Load frame data - try to fetch product if frame_product_id exists
      if (fullQuote.frame_product_id) {
        try {
          const productResponse = await fetch(
            `/api/admin/products/${fullQuote.frame_product_id}`,
          );
          if (productResponse.ok) {
            const productData = await productResponse.json();
            setSelectedFrame(productData.product);
            console.log("✅ Frame product loaded:", productData.product);
          } else {
            console.log("⚠️ Frame product not found, using manual frame data");
          }
        } catch (error) {
          console.error("Error fetching frame product:", error);
        }
      }

      // Load form data from quote - ensure all values are loaded
      const formData = {
        frame_name: fullQuote.frame_name || "",
        frame_brand: fullQuote.frame_brand || "",
        frame_model: fullQuote.frame_model || "",
        frame_color: fullQuote.frame_color || "",
        frame_size: fullQuote.frame_size || "",
        frame_sku: fullQuote.frame_sku || "",
        frame_price: fullQuote.frame_price || 0,
        lens_type: fullQuote.lens_type || "",
        lens_material: fullQuote.lens_material || "",
        lens_index: fullQuote.lens_index || null,
        lens_treatments: Array.isArray(fullQuote.lens_treatments)
          ? fullQuote.lens_treatments
          : [],
        lens_tint_color: fullQuote.lens_tint_color || "",
        lens_tint_percentage: fullQuote.lens_tint_percentage || 0,
        frame_cost: fullQuote.frame_cost || 0,
        lens_cost: fullQuote.lens_cost || 0,
        treatments_cost: fullQuote.treatments_cost || 0,
        labor_cost: fullQuote.labor_cost || 0,
        discount_percentage: fullQuote.discount_percentage || 0,
      };

      console.log("📝 Form data loaded:", formData);

      setOrderFormData(formData);

      // If frame_price is set but no frame product, ensure we can still add it manually
      if (formData.frame_price > 0 && !fullQuote.frame_product_id) {
        console.log("📦 Manual frame detected (no product_id)");
      }

      // Load prescription if exists
      if (fullQuote.prescription_id) {
        // Fetch prescriptions if not already loaded
        if (prescriptions.length === 0 && fullQuote.customer_id) {
          await fetchCustomerPrescriptions(fullQuote.customer_id);
        }
        // Wait a bit for prescriptions to load, then set
        setTimeout(() => {
          const prescription = prescriptions.find(
            (p) => p.id === fullQuote.prescription_id,
          );
          if (prescription) {
            setSelectedPrescription(prescription);
          }
        }, 500);
      }

      toast.success(
        `Presupuesto ${fullQuote.quote_number} cargado en el formulario`,
      );
    } catch (error: any) {
      console.error("Error loading quote to form:", error);
      toast.error(error.message || "Error al cargar el presupuesto");
    }
  };

  // Search products - now searches from 1 character
  useEffect(() => {
    const searchProducts = async () => {
      if (searchTerm.trim().length === 0) {
        setProducts([]);
        setSelectedProductIndex(-1);
        setSearching(false);
        return;
      }

      setSearching(true);
      try {
        const headers: HeadersInit = {
          ...getBranchHeader(currentBranchId),
        };
        const response = await fetch(
          `/api/admin/products/search?q=${encodeURIComponent(searchTerm)}&limit=20`,
          { headers },
        );
        if (response.ok) {
          const data = await response.json();
          setProducts(data.products || []);
          setSelectedProductIndex(-1); // Reset selection when new results arrive
        }
      } catch (error) {
        console.error("Error searching products:", error);
        setProducts([]);
      } finally {
        setSearching(false);
      }
    };

    const debounce = setTimeout(searchProducts, 200); // Reduced debounce for faster response
    return () => clearTimeout(debounce);
  }, [searchTerm, currentBranchId]);

  // Handle keyboard navigation in search
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (selectedProductIndex >= 0 && products[selectedProductIndex]) {
        addToCart(products[selectedProductIndex]);
      } else if (products.length > 0) {
        addToCart(products[0]);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedProductIndex((prev) =>
        prev < products.length - 1 ? prev + 1 : prev,
      );
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedProductIndex((prev) => (prev > 0 ? prev - 1 : -1));
      return;
    }

    if (e.key === "Escape") {
      setProducts([]);
      setSearchTerm("");
      setSelectedProductIndex(-1);
      searchInputRef.current?.blur();
    }
  };

  // Scroll selected product into view
  useEffect(() => {
    if (selectedProductIndex >= 0 && suggestionsRef.current) {
      const selectedElement = suggestionsRef.current.children[
        selectedProductIndex
      ] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [selectedProductIndex]);

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.product.id === product.id);

    if (existingItem) {
      updateCartQuantity(existingItem.product.id, existingItem.quantity + 1);
    } else {
      setCart([
        ...cart,
        {
          product,
          quantity: 1,
          unitPrice: product.price,
          subtotal: product.price,
          priceIncludesTax: product.price_includes_tax || false,
        },
      ]);
    }

    setSearchTerm("");
    searchInputRef.current?.focus();
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(
      cart.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity,
              subtotal: item.unitPrice * quantity,
            }
          : item,
      ),
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCashReceived(0);
    setSelectedCustomer(null);
    setCustomerRUT("");
    setCustomerBusinessName("");
    setSiiInvoiceType("boleta");
    setCustomerQuotes([]);
    setCustomerSearchTerm("");
    setCustomerSearchResults([]);
    setSelectedPrescription(null);
    setPrescriptions([]);
    setSelectedFrame(null);
    setFrameSearch("");
    setFrameResults([]);
    setSelectedQuote(null);
    setOrderFormData({
      frame_name: "",
      frame_brand: "",
      frame_model: "",
      frame_color: "",
      frame_size: "",
      frame_sku: "",
      frame_price: 0,
      lens_type: "",
      lens_material: "",
      lens_index: null,
      lens_treatments: [],
      lens_tint_color: "",
      lens_tint_percentage: 0,
      frame_cost: 0,
      lens_cost: 0,
      treatments_cost: 0,
      labor_cost: quoteSettings?.default_labor_cost || 15000,
      discount_percentage: 0,
    });
  };

  const handleSelectCustomer = async (customer: Customer) => {
    setSelectedCustomer(customer);
    // Format RUT if it exists
    const formattedRUT = customer.rut ? formatRUT(customer.rut) : "";
    setCustomerRUT(formattedRUT);
    setCustomerBusinessName(customer.business_name || "");
    setCustomerSearchTerm(customer.name || customer.email);
    setCustomerSearchResults([]);
    setShowCustomerDialog(false);

    // Reset form when changing customer
    setSelectedQuote(null);
    setSelectedFrame(null);
    setOrderFormData({
      frame_name: "",
      frame_brand: "",
      frame_model: "",
      frame_color: "",
      frame_size: "",
      frame_sku: "",
      frame_price: 0,
      lens_type: "",
      lens_material: "",
      lens_index: null,
      lens_treatments: [],
      lens_tint_color: "",
      lens_tint_percentage: 0,
      frame_cost: 0,
      lens_cost: 0,
      treatments_cost: 0,
      labor_cost: quoteSettings?.default_labor_cost || 15000,
      discount_percentage: 0,
    });

    // Fetch customer quotes and prescriptions
    await Promise.all([
      fetchCustomerQuotes(customer.id),
      fetchCustomerPrescriptions(customer.id),
    ]);
  };

  // Fetch customer prescriptions
  const fetchCustomerPrescriptions = async (customerId: string) => {
    try {
      const response = await fetch(
        `/api/admin/customers/${customerId}/prescriptions`,
      );
      if (response.ok) {
        const data = await response.json();
        setPrescriptions(data.prescriptions || []);
      }
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
    }
  };

  // Fetch quote settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/admin/quote-settings");
        if (response.ok) {
          const data = await response.json();
          setQuoteSettings(data.settings);
          if (data.settings?.default_labor_cost) {
            setOrderFormData((prev) => ({
              ...prev,
              labor_cost: data.settings.default_labor_cost,
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching quote settings:", error);
      }
    };
    fetchSettings();
  }, []);

  // Search frames for complete order
  useEffect(() => {
    const searchFrames = async () => {
      if (frameSearch.trim().length < 2) {
        setFrameResults([]);
        return;
      }
      setSearchingFrames(true);
      try {
        const headers: HeadersInit = {
          ...getBranchHeader(currentBranchId),
        };
        const response = await fetch(
          `/api/admin/products/search?q=${encodeURIComponent(frameSearch)}&type=frame&limit=10`,
          { headers },
        );
        if (response.ok) {
          const data = await response.json();
          setFrameResults(data.products || []);
        }
      } catch (error) {
        console.error("Error searching frames:", error);
      } finally {
        setSearchingFrames(false);
      }
    };
    const debounce = setTimeout(searchFrames, 300);
    return () => clearTimeout(debounce);
  }, [frameSearch, currentBranchId]);

  // Lens types and materials
  const lensTypes = [
    { value: "single_vision", label: "Visión Simple" },
    { value: "bifocal", label: "Bifocal" },
    { value: "trifocal", label: "Trifocal" },
    { value: "progressive", label: "Progresivo" },
    { value: "reading", label: "Lectura" },
    { value: "computer", label: "Computadora" },
    { value: "sports", label: "Deportivo" },
  ];

  const lensMaterials = [
    { value: "cr39", label: "CR-39" },
    { value: "polycarbonate", label: "Policarbonato" },
    { value: "high_index_1_67", label: "Alto Índice 1.67" },
    { value: "high_index_1_74", label: "Alto Índice 1.74" },
    { value: "trivex", label: "Trivex" },
    { value: "glass", label: "Vidrio" },
  ];

  // Available treatments
  const availableTreatments = quoteSettings
    ? [
        {
          value: "anti_reflective",
          label: "Anti-reflejante",
          cost: quoteSettings.treatment_prices?.anti_reflective || 15000,
        },
        {
          value: "blue_light_filter",
          label: "Filtro Luz Azul",
          cost: quoteSettings.treatment_prices?.blue_light_filter || 20000,
        },
        {
          value: "uv_protection",
          label: "Protección UV",
          cost: quoteSettings.treatment_prices?.uv_protection || 10000,
        },
        {
          value: "scratch_resistant",
          label: "Anti-rayas",
          cost: quoteSettings.treatment_prices?.scratch_resistant || 12000,
        },
        {
          value: "anti_fog",
          label: "Anti-empañamiento",
          cost: quoteSettings.treatment_prices?.anti_fog || 8000,
        },
        {
          value: "photochromic",
          label: "Fotocromático",
          cost: quoteSettings.treatment_prices?.photochromic || 35000,
        },
        {
          value: "polarized",
          label: "Polarizado",
          cost: quoteSettings.treatment_prices?.polarized || 25000,
        },
        {
          value: "tint",
          label: "Tinte",
          cost: quoteSettings.treatment_prices?.tint || 15000,
        },
      ]
    : [
        { value: "anti_reflective", label: "Anti-reflejante", cost: 15000 },
        { value: "blue_light_filter", label: "Filtro Luz Azul", cost: 20000 },
        { value: "uv_protection", label: "Protección UV", cost: 10000 },
        { value: "scratch_resistant", label: "Anti-rayas", cost: 12000 },
        { value: "anti_fog", label: "Anti-empañamiento", cost: 8000 },
        { value: "photochromic", label: "Fotocromático", cost: 35000 },
        { value: "polarized", label: "Polarizado", cost: 25000 },
        { value: "tint", label: "Tinte", cost: 15000 },
      ];

  // Calculate lens cost based on type and material
  const calculateLensCost = (type: string, material: string) => {
    if (!type || !material) return 0;

    const costs = quoteSettings?.lens_type_base_costs || {
      single_vision: 30000,
      bifocal: 45000,
      trifocal: 55000,
      progressive: 60000,
      reading: 25000,
      computer: 35000,
      sports: 40000,
    };

    const multipliers = quoteSettings?.lens_material_multipliers || {
      cr39: 1.0,
      polycarbonate: 1.2,
      high_index_1_67: 1.5,
      high_index_1_74: 2.0,
      trivex: 1.3,
      glass: 0.9,
    };

    const baseCost = costs[type] || 30000;
    const multiplier = multipliers[material] || 1.0;
    return baseCost * multiplier;
  };

  // Update lens cost when type or material changes
  useEffect(() => {
    if (orderFormData.lens_type && orderFormData.lens_material) {
      const cost = calculateLensCost(
        orderFormData.lens_type,
        orderFormData.lens_material,
      );
      setOrderFormData((prev) => ({ ...prev, lens_cost: cost }));
    }
  }, [orderFormData.lens_type, orderFormData.lens_material, quoteSettings]);

  // Handle treatment toggle
  const handleTreatmentToggle = (
    treatment: (typeof availableTreatments)[0],
  ) => {
    const isSelected = orderFormData.lens_treatments.includes(treatment.value);
    let newTreatments = [...orderFormData.lens_treatments];
    let treatmentsCost = orderFormData.treatments_cost;

    if (isSelected) {
      newTreatments = newTreatments.filter((t) => t !== treatment.value);
      treatmentsCost -= treatment.cost;
    } else {
      newTreatments.push(treatment.value);
      treatmentsCost += treatment.cost;
    }

    setOrderFormData((prev) => ({
      ...prev,
      lens_treatments: newTreatments,
      treatments_cost: treatmentsCost,
    }));
  };

  // Handle frame select for complete order
  const handleFrameSelectForOrder = (frame: any) => {
    setSelectedFrame(frame);
    setOrderFormData((prev) => ({
      ...prev,
      frame_name: frame.name,
      frame_brand: frame.frame_brand || "",
      frame_model: frame.frame_model || "",
      frame_color: frame.frame_color || "",
      frame_size: frame.frame_size || "",
      frame_sku: frame.sku || "",
      frame_price: frame.price || 0,
      frame_cost: frame.price || 0,
    }));
    setFrameSearch("");
    setFrameResults([]);
  };

  // Add complete order to cart (individual items, don't clear cart)
  const handleAddCompleteOrderToCart = () => {
    if (!orderFormData.lens_type || !orderFormData.lens_material) {
      toast.error("Selecciona tipo y material de lente");
      return;
    }

    console.log("🛒 Adding complete order to cart");
    console.log("📋 Order form data:", orderFormData);
    console.log("🖼️ Selected frame:", selectedFrame);

    let itemsAdded = 0;
    const baseTimestamp = Date.now();
    const itemsToAdd: Product[] = [];

    // Add frame - use frame_cost (which is the actual price) or frame_price as fallback
    const framePrice =
      orderFormData.frame_cost > 0
        ? orderFormData.frame_cost
        : orderFormData.frame_price || 0;

    if (orderFormData.frame_name || framePrice > 0) {
      let frameProduct: Product;

      if (
        selectedFrame &&
        selectedFrame.id &&
        !selectedFrame.id.startsWith("frame-manual-")
      ) {
        // Frame from product catalog - use unique ID to avoid conflicts
        frameProduct = {
          id: `${selectedFrame.id}-${baseTimestamp}`,
          name: orderFormData.frame_name || selectedFrame.name,
          price: framePrice,
          inventory_quantity: selectedFrame.inventory_quantity || 0,
          sku: orderFormData.frame_sku || selectedFrame.sku || "FRAME",
          barcode: selectedFrame.barcode,
          featured_image: selectedFrame.featured_image,
        };
      } else {
        // Manual frame entry (no product in catalog)
        const frameName =
          orderFormData.frame_name ||
          (orderFormData.frame_brand && orderFormData.frame_model
            ? `${orderFormData.frame_brand} ${orderFormData.frame_model}`
            : "Marco");
        frameProduct = {
          id: `frame-manual-${baseTimestamp}-1`,
          name: frameName,
          price: framePrice,
          inventory_quantity: 999,
          sku: orderFormData.frame_sku || "FRAME-MANUAL",
        };
      }

      itemsToAdd.push(frameProduct);
      itemsAdded++;
      console.log("✅ Frame prepared:", frameProduct);
    }

    // Add lens - always add if lens_type and lens_material exist
    if (orderFormData.lens_type && orderFormData.lens_material) {
      const lensName = `Lente ${orderFormData.lens_type} ${orderFormData.lens_material}`;
      const lensProduct: Product = {
        id: `lens-${baseTimestamp}-2`,
        name: lensName,
        price: orderFormData.lens_cost || 0,
        inventory_quantity: 999,
        sku: `LENS-${orderFormData.lens_type?.toUpperCase()}-${orderFormData.lens_material?.toUpperCase()}`,
      };
      itemsToAdd.push(lensProduct);
      itemsAdded++;
      console.log("✅ Lens prepared:", lensProduct);
    }

    // Add treatments - add if treatments exist
    if (
      orderFormData.lens_treatments &&
      Array.isArray(orderFormData.lens_treatments) &&
      orderFormData.lens_treatments.length > 0
    ) {
      const treatmentLabels = orderFormData.lens_treatments.map((t: string) => {
        const treatment = availableTreatments.find((at) => at.value === t);
        return treatment ? treatment.label : t;
      });
      const treatmentProduct: Product = {
        id: `treatments-${baseTimestamp}-3`,
        name: `Tratamientos: ${treatmentLabels.join(", ")}`,
        price: orderFormData.treatments_cost || 0,
        inventory_quantity: 999,
        sku: "TREATMENTS",
      };
      itemsToAdd.push(treatmentProduct);
      itemsAdded++;
      console.log("✅ Treatments prepared:", treatmentProduct);
    }

    // Add labor - always add if labor_cost > 0
    if (orderFormData.labor_cost > 0) {
      const laborProduct: Product = {
        id: `labor-${baseTimestamp}-4`,
        name: "Mano de obra (montaje)",
        price: orderFormData.labor_cost,
        inventory_quantity: 999,
        sku: "LABOR",
      };
      itemsToAdd.push(laborProduct);
      itemsAdded++;
      console.log("✅ Labor prepared:", laborProduct);
    }

    // Calculate discount amount
    const orderSubtotal =
      framePrice +
      orderFormData.lens_cost +
      orderFormData.treatments_cost +
      orderFormData.labor_cost;
    const discountAmount =
      orderSubtotal * (orderFormData.discount_percentage / 100);

    // Add all items to cart at once using a single state update
    if (itemsToAdd.length > 0) {
      console.log(`🛒 Adding ${itemsToAdd.length} items to cart`);
      itemsToAdd.forEach((product, index) => {
        console.log(
          `  ${index + 1}. Adding: ${product.name} - $${product.price}`,
        );
      });

      if (discountAmount > 0) {
        console.log(
          `  💰 Discount: ${orderFormData.discount_percentage}% = -$${discountAmount}`,
        );
      }

      // Use a single setCart call to add all items at once
      setCart((prevCart) => {
        const newCart = [...prevCart];

        itemsToAdd.forEach((product) => {
          // Check if item already exists (by ID)
          const existingIndex = newCart.findIndex(
            (item) => item.product.id === product.id,
          );

          if (existingIndex >= 0) {
            // Update quantity if exists
            newCart[existingIndex] = {
              ...newCart[existingIndex],
              quantity: newCart[existingIndex].quantity + 1,
              subtotal:
                newCart[existingIndex].unitPrice *
                (newCart[existingIndex].quantity + 1),
            };
          } else {
            // Add new item
            newCart.push({
              product,
              quantity: 1,
              unitPrice: product.price,
              subtotal: product.price,
            });
          }
        });

        // Add discount as a negative item if discount exists
        if (discountAmount > 0) {
          const discountProduct: Product = {
            id: `discount-${baseTimestamp}`,
            name: `Descuento (${orderFormData.discount_percentage}%)`,
            price: -discountAmount,
            inventory_quantity: 999,
            sku: "DISCOUNT",
          };

          // Check if discount already exists
          const discountIndex = newCart.findIndex(
            (item) => item.product.id === discountProduct.id,
          );
          if (discountIndex >= 0) {
            // Update discount amount
            newCart[discountIndex] = {
              product: discountProduct,
              quantity: 1,
              unitPrice: -discountAmount,
              subtotal: -discountAmount,
            };
          } else {
            // Add discount
            newCart.push({
              product: discountProduct,
              quantity: 1,
              unitPrice: -discountAmount,
              subtotal: -discountAmount,
            });
          }
        }

        console.log(`✅ Cart updated with ${newCart.length} items`);
        return newCart;
      });

      toast.success(
        `${itemsAdded} elemento(s) agregado(s) al carrito${discountAmount > 0 ? ` con descuento del ${orderFormData.discount_percentage}%` : ""}`,
      );
    } else {
      toast.warning(
        "No hay elementos para agregar. Verifica que el formulario esté completo.",
      );
    }
  };

  const handleLoadQuote = async (quote: Quote) => {
    try {
      // Fetch full quote details
      const response = await fetch(`/api/admin/quotes/${quote.id}`);
      if (!response.ok) {
        throw new Error("Error al cargar el presupuesto");
      }

      const data = await response.json();
      const fullQuote = data.quote;

      // Clear current cart
      setCart([]);

      // Add frame as a product if it exists
      if (fullQuote.frame_product_id && fullQuote.frame_price > 0) {
        // Try to fetch the product
        try {
          const productResponse = await fetch(
            `/api/admin/products/${fullQuote.frame_product_id}`,
          );
          if (productResponse.ok) {
            const productData = await productResponse.json();
            const frameProduct = productData.product;

            addToCart({
              id: frameProduct.id,
              name: fullQuote.frame_name || frameProduct.name || "Marco",
              price: fullQuote.frame_price,
              inventory_quantity: frameProduct.inventory_quantity || 0,
              sku: fullQuote.frame_sku || frameProduct.sku,
              barcode: frameProduct.barcode,
              featured_image: frameProduct.featured_image,
            });
          }
        } catch (error) {
          console.error("Error fetching frame product:", error);
          // Add as a custom item if product not found
          toast.warning("Marco agregado como item personalizado");
        }
      }

      // Add lens as a custom item (since lenses are not regular products)
      if (fullQuote.lens_type) {
        const lensName = `Lente ${fullQuote.lens_type} ${fullQuote.lens_material || ""}`;
        const lensPrice = fullQuote.lens_cost || 0;

        if (lensPrice > 0) {
          // Create a virtual product for the lens
          const lensProduct: Product = {
            id: `lens-${fullQuote.id}`,
            name: lensName,
            price: lensPrice,
            inventory_quantity: 999, // Lenses are made to order
            sku: `LENS-${fullQuote.lens_type?.toUpperCase()}`,
          };

          addToCart(lensProduct);
        }
      }

      // Add treatments as items if they have cost
      if (
        fullQuote.treatments_cost > 0 &&
        fullQuote.lens_treatments &&
        fullQuote.lens_treatments.length > 0
      ) {
        const treatmentProduct: Product = {
          id: `treatments-${fullQuote.id}`,
          name: `Tratamientos: ${fullQuote.lens_treatments.join(", ")}`,
          price: fullQuote.treatments_cost,
          inventory_quantity: 999,
          sku: "TREATMENTS",
        };

        addToCart(treatmentProduct);
      }

      // Add labor cost if exists
      if (fullQuote.labor_cost > 0) {
        const laborProduct: Product = {
          id: `labor-${fullQuote.id}`,
          name: "Mano de obra (montaje)",
          price: fullQuote.labor_cost,
          inventory_quantity: 999,
          sku: "LABOR",
        };

        addToCart(laborProduct);
      }

      toast.success(`Presupuesto ${quote.quote_number} cargado al carrito`);
      setShowQuoteDialog(false);
      setShowCompleteOrderForm(false); // Hide form when quote is loaded
    } catch (error: any) {
      console.error("Error loading quote:", error);
      toast.error(error.message || "Error al cargar el presupuesto");
    }
  };

  const processPayment = async () => {
    if (cart.length === 0) {
      toast.error("El carrito está vacío");
      return;
    }

    if (paymentMethod === "cash" && cashReceived < total) {
      toast.error("El monto recibido es menor al total");
      return;
    }

    if (siiInvoiceType !== "none" && !customerRUT) {
      toast.error("Se requiere RUT para generar factura/boleta");
      return;
    }

    setProcessingPayment(true);

    try {
      const orderData = {
        is_pos_sale: true,
        email: selectedCustomer?.email || "venta@pos.local",
        payment_method_type: paymentMethod,
        payment_status: paymentMethod === "cash" ? "paid" : "pending",
        status: "delivered", // POS sales are immediately fulfilled
        subtotal: subtotal,
        tax_amount: taxAmount,
        total_amount: total,
        currency: "CLP", // Chilean Peso
        installments_count:
          paymentMethod === "installments" ? installmentsCount : 1,
        sii_invoice_type: siiInvoiceType,
        sii_rut: customerRUT || null,
        sii_business_name: customerBusinessName || null,
        items: cart.map((item) => ({
          product_id:
            item.product.id.startsWith("lens-") ||
            item.product.id.startsWith("treatments-") ||
            item.product.id.startsWith("labor-")
              ? null
              : item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.subtotal,
        })),
        cash_received: paymentMethod === "cash" ? cashReceived : null,
        change_amount: paymentMethod === "cash" ? change : 0,
      };

      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...getBranchHeader(currentBranchId),
      };

      const response = await fetch("/api/admin/pos/process-sale", {
        method: "POST",
        headers,
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al procesar la venta");
      }

      const result = await response.json();

      toast.success(`Venta procesada: ${result.order.order_number}`);

      // Print receipt (if printer available)
      if (result.order.sii_invoice_number) {
        toast.info(`Factura: ${result.order.sii_invoice_number}`);
      }

      // Clear cart and reset
      clearCart();
      setShowPaymentDialog(false);
    } catch (error: any) {
      console.error("Error processing payment:", error);
      toast.error(error.message || "Error al procesar el pago");
    } finally {
      setProcessingPayment(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Punto de Venta (POS)
          </h1>
          <p className="text-sm text-gray-600">
            {!currentBranchId && isSuperAdmin
              ? "Sistema de ventas - Todas las sucursales"
              : "Sistema de ventas"}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {isSuperAdmin && (
            <BranchSelector
              branches={branches}
              currentBranchId={currentBranchId}
            />
          )}
          <Link href="/admin/cash-register">
            <Button variant="outline">
              <DollarSign className="h-4 w-4 mr-2" />
              Caja
            </Button>
          </Link>
          <Badge variant="outline" className="text-lg px-4 py-2">
            {formatCurrency(total)}
          </Badge>
          <Button
            variant="outline"
            onClick={clearCart}
            disabled={cart.length === 0}
          >
            <X className="h-4 w-4 mr-2" />
            Limpiar
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Customer & Order Form */}
        <div className="w-2/3 flex flex-col border-r bg-gray-50 overflow-hidden">
          {/* Scrollable Content - Customer & Order Form */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Customer Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Cliente</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCustomerDialog(true)}
                  >
                    <User className="h-4 w-4 mr-1" />
                    {selectedCustomer ? "Cambiar" : "Seleccionar"}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedCustomer ? (
                  <div>
                    <div className="font-medium">
                      {selectedCustomer.name || selectedCustomer.email}
                    </div>
                    {selectedCustomer.rut && (
                      <div className="text-sm text-gray-600">
                        RUT: {selectedCustomer.rut}
                      </div>
                    )}
                    {customerQuotes.length > 0 && (
                      <div className="mt-2 text-xs text-green-600">
                        {customerQuotes.length} presupuesto(s) cargado(s) en el
                        carrito
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    Cliente no seleccionado
                  </div>
                )}

                {/* SII Invoice Type */}
                <div>
                  <Label>Tipo de Documento</Label>
                  <Select
                    value={siiInvoiceType}
                    onValueChange={(v: any) => setSiiInvoiceType(v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="boleta">Boleta</SelectItem>
                      <SelectItem value="factura">Factura</SelectItem>
                      <SelectItem value="none">Sin Documento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {siiInvoiceType !== "none" && (
                  <div>
                    <Label>RUT Cliente *</Label>
                    <Input
                      placeholder="123456789"
                      value={customerRUT}
                      onChange={(e) => {
                        const formatted = formatRUT(e.target.value);
                        setCustomerRUT(formatted);
                      }}
                      maxLength={12}
                    />
                  </div>
                )}

                {siiInvoiceType === "factura" && (
                  <div>
                    <Label>Razón Social</Label>
                    <Input
                      placeholder="Nombre de la empresa"
                      value={customerBusinessName}
                      onChange={(e) => setCustomerBusinessName(e.target.value)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Complete Order Form - Always visible */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <span className="flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Crear Orden Completa
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Selected Customer Display (read-only) */}
                <div>
                  <Label>Cliente</Label>
                  {selectedCustomer ? (
                    <div className="mt-1 p-2 border rounded bg-gray-50">
                      <div className="font-medium text-sm">
                        {selectedCustomer.name || selectedCustomer.email}
                      </div>
                      {selectedCustomer.rut && (
                        <div className="text-xs text-gray-600 mt-1">
                          RUT: {selectedCustomer.rut}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-1 p-2 border rounded bg-gray-50 text-sm text-gray-500">
                      Selecciona un cliente en el card superior
                    </div>
                  )}
                </div>

                {/* Quote Selection */}
                <div>
                  <Label>Presupuesto</Label>
                  {!selectedCustomer ? (
                    <div className="text-sm text-gray-500 py-2">
                      Selecciona un cliente para ver sus presupuestos
                    </div>
                  ) : loadingQuotes ? (
                    <div className="text-sm text-gray-500 py-2 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Cargando presupuestos...
                    </div>
                  ) : customerQuotes.length === 0 ? (
                    <div className="text-sm text-gray-500 py-2">
                      Este cliente no tiene presupuestos. Puedes crear una orden
                      manualmente.
                    </div>
                  ) : (
                    <Select
                      value={selectedQuote?.id || ""}
                      onValueChange={async (value) => {
                        const quote = customerQuotes.find(
                          (q) => q.id === value,
                        );
                        if (quote) {
                          await handleLoadQuoteToForm(quote);
                        } else {
                          setSelectedQuote(null);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un presupuesto" />
                      </SelectTrigger>
                      <SelectContent>
                        {customerQuotes.map((quote) => (
                          <SelectItem key={quote.id} value={quote.id}>
                            {quote.quote_number} -{" "}
                            {new Date(quote.created_at).toLocaleDateString(
                              "es-CL",
                            )}
                            {quote.status && ` (${quote.status})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Frame Selection */}
                <div>
                  <Label>Marco</Label>
                  {selectedFrame ? (
                    <div className="flex items-center justify-between p-2 border rounded mt-1">
                      <div>
                        <div className="font-medium text-sm">
                          {selectedFrame.name}
                        </div>
                        <div className="text-xs text-gray-600">
                          {formatCurrency(orderFormData.frame_price)}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedFrame(null);
                          setOrderFormData((prev) => ({
                            ...prev,
                            frame_price: 0,
                            frame_cost: 0,
                          }));
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="relative mt-1">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Buscar marco..."
                        value={frameSearch}
                        onChange={(e) => setFrameSearch(e.target.value)}
                        className="pl-8 h-9 text-sm"
                      />
                      {frameSearch.length >= 2 && frameResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                          {frameResults.map((frame) => (
                            <div
                              key={frame.id}
                              className="p-2 hover:bg-gray-100 cursor-pointer border-b text-sm"
                              onClick={() => handleFrameSelectForOrder(frame)}
                            >
                              <div className="font-medium">{frame.name}</div>
                              <div className="text-xs text-gray-600">
                                {formatCurrency(frame.price)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {!selectedFrame && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Nombre marco"
                        value={orderFormData.frame_name}
                        onChange={(e) =>
                          setOrderFormData((prev) => ({
                            ...prev,
                            frame_name: e.target.value,
                          }))
                        }
                        className="h-9 text-sm"
                      />
                      <Input
                        type="number"
                        placeholder="Precio"
                        value={orderFormData.frame_price || ""}
                        onChange={(e) => {
                          const price = parseFloat(e.target.value) || 0;
                          setOrderFormData((prev) => ({
                            ...prev,
                            frame_price: price,
                            frame_cost: price,
                          }));
                        }}
                        className="h-9 text-sm"
                      />
                    </div>
                  )}
                </div>

                {/* Lens Configuration */}
                <div>
                  <Label>Tipo de Lente *</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <Select
                      value={orderFormData.lens_type}
                      onValueChange={(value) => {
                        setOrderFormData((prev) => ({
                          ...prev,
                          lens_type: value,
                        }));
                      }}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {lensTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={orderFormData.lens_material}
                      onValueChange={(value) => {
                        setOrderFormData((prev) => ({
                          ...prev,
                          lens_material: value,
                        }));
                      }}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Material" />
                      </SelectTrigger>
                      <SelectContent>
                        {lensMaterials.map((material) => (
                          <SelectItem
                            key={material.value}
                            value={material.value}
                          >
                            {material.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {orderFormData.lens_cost > 0 && (
                    <div className="text-xs text-gray-600 mt-1">
                      Costo lente: {formatCurrency(orderFormData.lens_cost)}
                    </div>
                  )}
                </div>

                {/* Treatments */}
                <div>
                  <Label>Tratamientos</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {availableTreatments.slice(0, 6).map((treatment) => (
                      <Button
                        key={treatment.value}
                        type="button"
                        variant={
                          orderFormData.lens_treatments.includes(
                            treatment.value,
                          )
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => handleTreatmentToggle(treatment)}
                      >
                        {treatment.label}
                      </Button>
                    ))}
                  </div>
                  {orderFormData.treatments_cost > 0 && (
                    <div className="text-xs text-gray-600 mt-1">
                      Costo tratamientos:{" "}
                      {formatCurrency(orderFormData.treatments_cost)}
                    </div>
                  )}
                </div>

                {/* Labor Cost */}
                <div>
                  <Label>Mano de Obra</Label>
                  <Input
                    type="number"
                    placeholder="15000"
                    value={orderFormData.labor_cost || ""}
                    onChange={(e) =>
                      setOrderFormData((prev) => ({
                        ...prev,
                        labor_cost: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="h-9 text-sm"
                  />
                </div>

                {/* Discount */}
                <div>
                  <Label>Descuento (%)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    min="0"
                    max="100"
                    step="0.01"
                    value={orderFormData.discount_percentage || ""}
                    onChange={(e) =>
                      setOrderFormData((prev) => ({
                        ...prev,
                        discount_percentage: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="h-9 text-sm"
                  />
                </div>

                {/* Order Total Preview */}
                {(orderFormData.frame_cost > 0 ||
                  orderFormData.frame_price > 0 ||
                  orderFormData.lens_cost > 0 ||
                  orderFormData.treatments_cost > 0 ||
                  orderFormData.labor_cost > 0) && (
                  <div className="border-t pt-2 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Marco:</span>
                      <span>
                        {formatCurrency(
                          orderFormData.frame_cost > 0
                            ? orderFormData.frame_cost
                            : orderFormData.frame_price || 0,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Lente:</span>
                      <span>{formatCurrency(orderFormData.lens_cost)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Tratamientos:</span>
                      <span>
                        {formatCurrency(orderFormData.treatments_cost)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Mano de obra:</span>
                      <span>{formatCurrency(orderFormData.labor_cost)}</span>
                    </div>
                    {(() => {
                      const framePrice =
                        orderFormData.frame_cost > 0
                          ? orderFormData.frame_cost
                          : orderFormData.frame_price || 0;
                      const subtotal =
                        framePrice +
                        orderFormData.lens_cost +
                        orderFormData.treatments_cost +
                        orderFormData.labor_cost;
                      const discountAmount =
                        subtotal * (orderFormData.discount_percentage / 100);
                      const subtotalAfterDiscount = subtotal - discountAmount;

                      return (
                        <>
                          <div className="flex justify-between text-xs font-semibold pt-1 border-t">
                            <span>Subtotal:</span>
                            <span>{formatCurrency(subtotal)}</span>
                          </div>
                          {orderFormData.discount_percentage > 0 && (
                            <>
                              <div className="flex justify-between text-xs text-red-600">
                                <span>
                                  Descuento ({orderFormData.discount_percentage}
                                  %):
                                </span>
                                <span>-{formatCurrency(discountAmount)}</span>
                              </div>
                              <div className="flex justify-between text-xs font-semibold">
                                <span>Subtotal con descuento:</span>
                                <span>
                                  {formatCurrency(subtotalAfterDiscount)}
                                </span>
                              </div>
                            </>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* Add to Cart Button */}
                <Button
                  type="button"
                  onClick={handleAddCompleteOrderToCart}
                  disabled={
                    !orderFormData.lens_type || !orderFormData.lens_material
                  }
                  className="w-full"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Orden al Carrito
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Panel - Cart, Payment Summary & Payment Method */}
        <div className="w-1/3 flex flex-col bg-white border-l overflow-hidden">
          {/* Scrollable Content - Cart, Summary & Payment */}
          <div className="flex-1 overflow-y-auto">
            {/* Cart */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Carrito de Venta</h2>
                <Badge variant="secondary">{cart.length} productos</Badge>
              </div>

              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <ShoppingCart className="h-24 w-24 mb-4" />
                  <p className="text-lg">El carrito está vacío</p>
                  <p className="text-sm">Busca productos para agregar</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cart.map((item) => (
                    <Card key={item.product.id} className="p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm break-words">
                            {item.product.name}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {formatCurrency(item.unitPrice)} c/u
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="flex items-center gap-1 border rounded-lg">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                updateCartQuantity(
                                  item.product.id,
                                  item.quantity - 1,
                                )
                              }
                              className="h-7 w-7 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-10 text-center font-semibold text-sm">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                updateCartQuantity(
                                  item.product.id,
                                  item.quantity + 1,
                                )
                              }
                              className="h-7 w-7 p-0"
                              disabled={
                                item.quantity >= item.product.inventory_quantity
                              }
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="text-sm font-bold w-24 text-right">
                            {formatCurrency(item.subtotal)}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-red-600 hover:text-red-700 h-7 w-7 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Summary */}
            <Card className="mx-4 mb-4 flex-shrink-0">
              <CardHeader>
                <CardTitle className="text-lg">Resumen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>IVA (19%):</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-green-600">
                    {formatCurrency(total)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card className="mx-4 mb-4 flex-shrink-0">
              <CardHeader>
                <CardTitle className="text-lg">Método de Pago</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={paymentMethod === "cash" ? "default" : "outline"}
                    onClick={() => setPaymentMethod("cash")}
                    className="h-16"
                  >
                    <Banknote className="h-5 w-5 mr-2" />
                    Efectivo
                  </Button>
                  <Button
                    variant={
                      paymentMethod === "debit_card" ? "default" : "outline"
                    }
                    onClick={() => setPaymentMethod("debit_card")}
                    className="h-16"
                  >
                    <CreditCard className="h-5 w-5 mr-2" />
                    Débito
                  </Button>
                  <Button
                    variant={
                      paymentMethod === "credit_card" ? "default" : "outline"
                    }
                    onClick={() => setPaymentMethod("credit_card")}
                    className="h-16"
                  >
                    <CreditCard className="h-5 w-5 mr-2" />
                    Crédito
                  </Button>
                  <Button
                    variant={
                      paymentMethod === "installments" ? "default" : "outline"
                    }
                    onClick={() => setPaymentMethod("installments")}
                    className="h-16"
                  >
                    <Calculator className="h-5 w-5 mr-2" />
                    Cuotas
                  </Button>
                </div>

                {paymentMethod === "cash" && (
                  <div>
                    <Label>Monto Recibido</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={cashReceived || ""}
                      onChange={(e) =>
                        setCashReceived(parseFloat(e.target.value) || 0)
                      }
                      className="text-lg"
                    />
                    {cashReceived > 0 && change >= 0 && (
                      <div className="mt-2 text-sm text-gray-600">
                        Vuelto:{" "}
                        <span className="font-semibold">
                          {formatCurrency(change)}
                        </span>
                      </div>
                    )}
                    {cashReceived > 0 && change < 0 && (
                      <div className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        Faltan {formatCurrency(Math.abs(change))}
                      </div>
                    )}
                  </div>
                )}

                {paymentMethod === "installments" && (
                  <div>
                    <Label>Número de Cuotas</Label>
                    <Select
                      value={installmentsCount.toString()}
                      onValueChange={(v) => setInstallmentsCount(parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[2, 3, 4, 5, 6, 8, 10, 12].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} cuotas
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="mt-2 text-sm text-gray-600">
                      Valor cuota:{" "}
                      <span className="font-semibold">
                        {formatCurrency(total / installmentsCount)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Fixed Process Payment Button */}
          <div className="p-4 border-t bg-white flex-shrink-0">
            <Button
              onClick={() => setShowPaymentDialog(true)}
              disabled={cart.length === 0 || processingPayment}
              className="w-full h-14 text-lg font-semibold bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {processingPayment ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Finalizar Pago
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Payment Confirmation Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Venta</DialogTitle>
            <DialogDescription>
              Revisa los detalles antes de procesar el pago
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-600 mb-2">Total a pagar:</div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(total)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Método de pago:</div>
              <div className="font-medium">
                {paymentMethod === "cash" && "Efectivo"}
                {paymentMethod === "debit_card" && "Tarjeta Débito"}
                {paymentMethod === "credit_card" && "Tarjeta Crédito"}
                {paymentMethod === "installments" &&
                  `${installmentsCount} cuotas`}
              </div>
            </div>
            {paymentMethod === "cash" && cashReceived > 0 && (
              <div>
                <div className="text-sm text-gray-600 mb-1">Vuelto:</div>
                <div className="font-medium">{formatCurrency(change)}</div>
              </div>
            )}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowPaymentDialog(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={processPayment}
                disabled={processingPayment}
                className="flex-1"
              >
                {processingPayment ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Confirmar
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Customer Selection Dialog */}
      <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Seleccionar Cliente</DialogTitle>
            <DialogDescription>
              Busca un cliente por nombre, email, teléfono o RUT
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                ref={customerSearchInputRef}
                placeholder="Buscar cliente (nombre, email, teléfono, RUT)..."
                value={customerSearchTerm}
                onChange={(e) => {
                  setCustomerSearchTerm(e.target.value);
                  setSelectedCustomerIndex(-1);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (
                      selectedCustomerIndex >= 0 &&
                      customerSearchResults[selectedCustomerIndex]
                    ) {
                      handleSelectCustomer(
                        customerSearchResults[selectedCustomerIndex],
                      );
                    } else if (customerSearchResults.length > 0) {
                      handleSelectCustomer(customerSearchResults[0]);
                    }
                  } else if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setSelectedCustomerIndex((prev) =>
                      prev < customerSearchResults.length - 1 ? prev + 1 : prev,
                    );
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setSelectedCustomerIndex((prev) =>
                      prev > 0 ? prev - 1 : -1,
                    );
                  } else if (e.key === "Escape") {
                    setCustomerSearchResults([]);
                    setCustomerSearchTerm("");
                    setSelectedCustomerIndex(-1);
                  }
                }}
                className="pl-10"
                autoComplete="off"
              />
            </div>

            {/* Customer Search Results */}
            {customerSearchTerm.trim().length > 0 && (
              <div className="relative">
                {searchingCustomers && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg border">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  </div>
                )}

                {!searchingCustomers && customerSearchResults.length > 0 && (
                  <div
                    ref={customerSuggestionsRef}
                    className="max-h-80 overflow-y-auto border rounded-lg bg-white shadow-lg"
                  >
                    {customerSearchResults.map((customer, index) => (
                      <button
                        key={customer.id}
                        onClick={() => handleSelectCustomer(customer)}
                        onMouseEnter={() => setSelectedCustomerIndex(index)}
                        className={`w-full p-4 text-left border-b last:border-b-0 flex justify-between items-center transition-colors ${
                          selectedCustomerIndex === index
                            ? "bg-blue-50 border-blue-200"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 truncate">
                            {customer.name}
                          </div>
                          <div className="text-sm text-gray-600 mt-1 flex flex-wrap gap-2">
                            {customer.email && <span>{customer.email}</span>}
                            {customer.phone && (
                              <span>Tel: {customer.phone}</span>
                            )}
                            {customer.rut && <span>RUT: {customer.rut}</span>}
                          </div>
                        </div>
                        {selectedCustomerIndex === index && (
                          <div className="text-xs text-blue-600 ml-2">
                            Presiona Enter
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {!searchingCustomers &&
                  customerSearchTerm.trim().length > 0 &&
                  customerSearchResults.length === 0 && (
                    <div className="border rounded-lg bg-white p-4 text-center text-gray-500">
                      <User className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>No se encontraron clientes</p>
                      <p className="text-sm mt-1">
                        Intenta con otro término de búsqueda
                      </p>
                    </div>
                  )}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedCustomer(null);
                  setCustomerRUT("");
                  setCustomerBusinessName("");
                  setCustomerSearchTerm("");
                  setCustomerSearchResults([]);
                  setShowCustomerDialog(false);
                }}
                className="flex-1"
              >
                Sin Cliente
              </Button>
              <Button
                onClick={() => setShowCustomerDialog(false)}
                className="flex-1"
                variant="outline"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quote Selection Dialog */}
      <Dialog open={showQuoteDialog} onOpenChange={setShowQuoteDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Presupuestos del Cliente</DialogTitle>
            <DialogDescription>
              Este cliente tiene {customerQuotes.length} presupuesto(s)
              disponible(s). ¿Deseas cargar alguno?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {loadingQuotes ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : customerQuotes.length > 0 ? (
              <div className="max-h-96 overflow-y-auto space-y-2">
                {customerQuotes.map((quote) => (
                  <Card
                    key={quote.id}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleLoadQuote(quote)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">
                            Presupuesto {quote.quote_number}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {quote.frame_name && (
                              <span>Marco: {quote.frame_name}</span>
                            )}
                            {quote.lens_type && (
                              <span className="ml-2">
                                Lente: {quote.lens_type}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Creado:{" "}
                            {new Date(quote.created_at).toLocaleDateString(
                              "es-CL",
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            {formatCurrency(quote.total_amount)}
                          </div>
                          <Badge variant="outline" className="mt-1">
                            {quote.status}
                          </Badge>
                        </div>
                        <FileText className="h-5 w-5 ml-4 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No hay presupuestos disponibles</p>
              </div>
            )}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowQuoteDialog(false)}
                className="flex-1"
              >
                Continuar sin Cargar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
