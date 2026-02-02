# 📘 Opttius Design System & UI/UX Guidelines

Versión: 1.0 | Enfoque: Moderno, Limpio, Tecnológico y Confiable.

Esta guía define los principios visuales y de interacción para el desarrollo de la plataforma Opttius. El objetivo es mantener una coherencia entre la landing page y el software de gestión, priorizando la legibilidad, la jerarquía visual y una sensación de "tecnología avanzada pero accesible".

## 1. Filosofía Visual

- **Minimalismo Funcional**: Menos es más. Utilizamos espacios en blanco generosos (white-space) para evitar la fatiga visual, crucial en software de gestión.
- **Jerarquía por Contraste**: No usamos líneas divisorias pesadas. Separamos el contenido mediante sombras suaves, colores de fondo sutiles y tipografía.
- **Tecnología Humana**: Aunque es un sistema con IA, la interfaz debe sentirse amigable. Usamos formas redondeadas y colores tranquilos.

## 2. Paleta de Colores (Theme Colors)

Utilizamos la paleta de Tailwind CSS (familia Slate y Blue) para mantener consistencia.

### Colores Primarios (Marca y Acción)

- **Opttius Blue (`bg-blue-600`)**: Para botones principales (CTA), enlaces activos, estados de "focus" y elementos de marca.
- **Hover Blue (`bg-blue-700`)**: Estado hover de elementos interactivos.
- **Light Blue (`bg-blue-50` / `bg-blue-100`)**: Fondos de íconos, tarjetas seleccionadas o áreas de énfasis sutil.

### Colores Neutros (Estructura y Texto)

- **Canvas (`bg-slate-50`)**: Color de fondo general de la aplicación. Evitar el blanco puro (#FFFFFF) para fondos generales para reducir el brillo ocular.
- **Surface (`bg-white`)**: Para tarjetas, paneles, modales y áreas de contenido.
- **Text Primary (`text-slate-900`)**: Títulos y datos importantes.
- **Text Secondary (`text-slate-600`)**: Párrafos, etiquetas de formularios y descripciones.
- **Borders (`border-slate-200`)**: Para líneas divisorias sutiles.

### Semántica (Estados del Sistema)

- **Éxito**: `text-green-600` / `bg-green-100` (Ej: Guardado correctamente, Stock óptimo).
- **Error/Destructivo**: `text-red-600` / `bg-red-100` (Ej: Eliminar, Error de conexión).
- **Alerta/Atención**: `text-amber-500` / `bg-amber-100` (Ej: Stock bajo).

## 3. Tipografía

- **Familia**: Inter (Sans-serif). Optimizada para pantallas e interfaces.
- **Encabezados (H1, H2, H3)**: `font-bold` o `font-extrabold`. Tracking ajustado (`tracking-tight`) para dar un look moderno y compacto.
- **Cuerpo**: `font-normal`. `text-sm` o `text-base`.
- **Números/Datos**: Usar `font-semibold` o `font-bold` para resaltar cifras (precios, stock) dentro de tablas o tarjetas.
- **Legibilidad**: Mantener un `leading-relaxed` (altura de línea) en bloques de texto para facilitar la lectura.

## 4. Componentes de UI (Look & Feel)

### Botones

- **Forma**: "Pill shape" o completamente redondeados (`rounded-full`) para acciones principales. `rounded-lg` para botones dentro de barras de herramientas o tablas densas.
- **Variantes**:
  - **Primario**: Azul sólido, texto blanco, sombra suave (`shadow-lg shadow-blue-600/30`).
  - **Secundario/Outline**: Fondo transparente, borde `slate-300`, texto `slate-700`.
  - **Ghost**: Sin borde, solo cambio de color al hover (ideal para acciones secundarias en tablas).

### Tarjetas (Cards) y Contenedores

- **Bordes**: Redondeados generosos (`rounded-2xl` o `rounded-3xl` para contenedores grandes, `rounded-xl` para elementos internos).
- **Elevación**: Sombras muy suaves (`shadow-sm` por defecto, `shadow-lg` al hacer hover).
- **Bordes sutiles**: `border border-slate-100` o `border-slate-200`. Evitar bordes negros o grises oscuros.

### Glassmorphism (Cristal)

Utilizar efectos de cristal (`backdrop-blur-md`, `bg-white/70`) solo para elementos flotantes o sticky:

- Barras de navegación (Sticky Headers).
- Modales o overlays.
- Alertas flotantes (Toasts).

## 5. Iconografía

- **Librería**: Lucide React.
- **Estilo**: Íconos de línea (stroke), grosor medio.
- **Uso**: Acompañar siempre acciones críticas o encabezados de sección.
- **Contenedores de Íconos**: Usar un fondo suave (`bg-blue-50`) con el ícono en color primario (`text-blue-600`) para darles peso visual sin ser agresivos.

## 6. Principios de Experiencia de Usuario (UX)

### Feedback y Micro-interacciones

- **Hover**: Todos los elementos interactivos deben reaccionar al cursor. No solo cambiar de color, considerar transformaciones sutiles (ej: `hover:-translate-y-1`) para sugerir "clicabilidad".
- **Carga**: Usar "Skeletons" (esqueletos de carga en gris pulsante) en lugar de spinners genéricos cuando se cargan datos en tablas o dashboards.

### Formularios (Inputs)

- **Estilo**: `bg-slate-50`, borde `slate-200`.
- **Focus**: Al hacer clic, anillo azul (`ring-2 ring-blue-100 border-blue-500`).
- **Etiquetas**: Claras, `text-sm`, `font-medium`, `text-slate-700`.

### Visualización de Datos (Dashboards)

- Dado que Opttius maneja métricas (IA, Stock), los gráficos deben ser limpios.
- Usar degradados (gradients) en las áreas de los gráficos para que se sientan modernos, no colores planos sólidos.
- Tooltips oscuros (`bg-slate-800`, texto blanco) para alto contraste al inspeccionar datos.

> [!TIP]
> **Resumen para el Desarrollador**: "Si tienes dudas, añade más espacio en blanco (p-6, gap-4), redondea las esquinas (rounded-xl) y suaviza el color del texto (text-slate-600). La interfaz debe respirar."
