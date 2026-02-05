# Implementación de Impresión Automática de Boletas/Facturas en el POS

Este documento detalla el plan de implementación para automatizar la impresión de comprobantes de venta (boletas o facturas) inmediatamente después de procesar un pago exitoso en el Punto de Venta (POS).

## 1. Objetivos

- Automatizar la generación del comprobante en formato térmico (80mm) o A4 según la configuración de la sucursal.
- Garantizar que solo se imprima un comprobante válido tras la confirmación exitosa del backend.
- Incluir todos los datos legales y comerciales necesarios (logo, RUT, items, detalle de impuestos).

## 2. Requerimientos Técnicos

- **Componente de Impresión**: Crear `POSReceipt.tsx` para renderizar el contenido.
- **Gestión de Estados**: Utilizar los datos devueltos por la API `/api/admin/pos/process-sale`.
- **Estilos de Impresión**: Configurar reglas `@media print` para ocultar la interfaz administrativa y mostrar solo el ticket.

## 3. Guía Paso a Paso

### Paso 1: Crear el Componente `POSReceipt`

Se ubicará en `src/components/admin/POS/POSReceipt.tsx`. Este componente se encargará de:

- Recibir los datos de la orden (`order`), la organización (`org`) y la configuración de facturación (`settings`).
- Configurar el ancho dinámicamente según si es "Térmica" (80mm) o "A4".
- Renderizar el logo (si existe), encabezados, cuerpo (items) y pie de página.

### Paso 2: Integración en `POSPage` (`src/app/admin/pos/page.tsx`)

1.  **Estado para Impresión**: Añadir un estado `lastOrderData` que almacene la respuesta del servidor tras la venta.
2.  **Referencia de Impresión**: Usar un `useRef` para capturar el contenedor del recibo.
3.  **Lógica Post-Pago**:

    ```typescript
    // Después de recibir 'result' de la API
    setLastOrderData(result.order);

    // Disparar la impresión automáticamente después de que el DOM se actualice
    setTimeout(() => {
      window.print();
    }, 500);
    ```

### Paso 3: Configuración de CSS en `globals.css`

Añadir reglas globales para controlar la visibilidad durante la impresión:

```css
@media print {
  body * {
    visibility: hidden;
  }
  #pos-receipt-print,
  #pos-receipt-print * {
    visibility: visible;
  }
  #pos-receipt-print {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }
}
```

### Paso 4: Pruebas y Validación

- **Venta con Boleta**: Verificar que cargue los datos básicos.
- **Venta con Factura**: Verificar que incluya el RUT y Razón Social del cliente.
- **Ancho de Impresora**: Validar que el diseño se ajuste correctamente al seleccionar "Térmica" vs "A4" en la configuración del sistema.

## 4. Estructura de Datos del Recibo

El recibo debe incluir obligatoriamente:

1.  **Encabezado**: Logo, Nombre Empresa, RUT, Sucursal, Fecha/Hora.
2.  **Cliente**: (Si aplica) Nombre/Razaón Social, RUT.
3.  **Detalle**: Tabla de productos (Cantidad, Nombre, Precio Unitario, Total).
4.  **Totales**: Subtotal, IVA (19%), Total Final.
5.  **Pie de Página**: Mensaje personalizado y términos configurados.

## 5. Consideraciones de Seguridad y Rendimiento

- La impresión solo se dispara si la API responde con éxito.
- Se recomienda deshabilitar los encabezados/pies de página predeterminados del navegador en la configuración de impresión del usuario.
