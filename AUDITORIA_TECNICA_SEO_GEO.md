# Auditoría técnica, SEO y GEO — CFV Ingenieros

Fecha: 13 de julio de 2026.

## Alcance revisado

- Vistas: `index.html`, `search.html` y `single.html`.
- Núcleo compartido: `js/main.js`.
- Estilos propios: `css/style.css`.
- Dependencias locales: Bootstrap, jQuery, jQuery UI, Owl, Slick, Nice Select, Lightcase, Odometer y Boxicons.
- Activos locales: imágenes, video y fuentes en `images/` y `libs/`.

No se modificaron las funciones, eventos, conexión a Google Sheets ni la lógica de `main.js`. Los únicos cambios en ese archivo son comentarios de documentación de guardias de DOM.

## Fase 1 — diagnóstico pasivo y depuración

### Aislamiento entre vistas

`main.js` ya utiliza guardias jQuery para los bloques específicos. Se documentaron con el formato `[BLOQUE VISTA: ...]`:

| Vista | Contenedor/guardia | Bloques protegidos |
| --- | --- | --- |
| `index.html` | `.featured-carousel`, `.testimonial-area .owl-carousel`, `.odometer`, `.popular-slider` | Carruseles y contadores. |
| `search.html` | `#price-range`, `.filter-results-area`, `#grid-proyectos-dinamico` | Slider, filtros, contadores y grilla. |
| `single.html` | `.property-info-content`, `#single-property-slider`, `.sidebar` | Ficha, galería, mapa, cotización y destacados. |

Los eventos delegados del buscador y del formulario también son seguros cuando sus elementos no están presentes: no encuentran un objetivo y no modifican las otras vistas. La llamada a Lightcase sobre una colección vacía de jQuery es igualmente segura, y Bootstrap registra su puente jQuery al `DOMContentLoaded` antes del callback de `main.js`.

### Incidencias encontradas y tratadas

| Severidad | Hallazgo | Acción aplicada |
| --- | --- | --- |
| Alta | Las tres vistas cargaban `libs/counterjs/jquery.waypoints.min.js` y `jquery.counterup.min.js`, pero la carpeta no existe. | Referencias conservadas en comentarios de **cuarentena**; elimina los 404 sin borrar trazabilidad. Odometer es el contador usado. |
| Alta en hosting Linux | Las seis referencias usaban `images/logo.png`, pero el archivo real es `images/Logo.png`. | Se corrigió únicamente la capitalización de la ruta. |
| Media | La tarjeta estática de portada apuntaba a `images/image-4.jpg`, inexistente. | Se corrigió a `images/image-4.png`, que existe. |
| Media | Había enlaces a `contacto.html`, archivo que no forma parte del proyecto. | Se sustituyeron por el canal de contacto ya usado en el sitio (WhatsApp). |
| Baja | Los pies de `search.html` y `single.html` tenían `#about-us` en una página sin ese ancla. | Se apuntaron a `index.html#about-us`. |

### Riesgos pendientes, no modificados por límites de la solicitud

1. El fallback de imagen dentro de `main.js` sigue siendo `images/image-4.jpg`. Si Google Sheets entrega un proyecto sin imagen, esa ruta fallará. Corregirlo requiere editar lógica congelada o añadir un archivo JPG equivalente.
2. `search.html?search=...`, `?tipo=...` y los enlaces de etiquetas no se leen al cargar `search.html`; los filtros solo reaccionan a controles del DOM. Es una mejora funcional de `main.js` y queda fuera del alcance autorizado.
3. Las opciones de orden “Más buscados” y “Novedades y lanzamientos” no tienen rama de ordenamiento en el núcleo actual; únicamente los dos órdenes por precio están implementados.

## Fase 2 — optimización móvil solo por CSS

Se añadió una capa al final de `css/style.css` con selectores encapsulados por `body[data-page]` y media queries. No se modificó ninguna regla de escritorio.

- Hasta `767.98px`: contenedores fluidos, cabecera y navegación compactas, tarjetas e imágenes fluidas con `object-fit: cover`, filtros apilados y ancho completo, y ficha con galería, metadatos, detalles y mapa adaptados.
- Entre `768px` y `991.98px`: se reducen solo los rellenos de filtros, sidebar y ficha para tablets.
- Las reglas de cada vista usan `data-page="home"`, `data-page="search"` o `data-page="detail"`; no contaminan otras pantallas.

## Fase 3 — limpieza documentada

- `main.js` contiene comentarios de guardia y bloque de vista para que futuras ediciones preserven el aislamiento sin cambiar la lógica.
- No se eliminó código ni librerías.
- Las dos dependencias obsoletas/no distribuidas se mantienen dentro de comentarios HTML con etiqueta `[CUARENTENA 2026-07-13]`, incluyendo la razón y el componente que las reemplaza.

## Fase 4 — SEO tradicional y GEO

### Semántica y accesibilidad

- Cada página tiene un único landmark `main`; la portada y la ficha incorporaron el que faltaba sin cambiar clases visuales.
- Los contenedores de pie se convirtieron a `footer` conservando la clase `.footer`.
- Se añadieron títulos alternativos de logo, un título de iframe de mapa, etiquetas accesibles de formulario y una descripción accesible del video.

### Metadatos

Las tres vistas incluyen títulos únicos, descripción, robots, canonical, Open Graph, Twitter Cards, locale `es_PE` e imagen social. Se usó el dominio público `https://www.cfvingenieros.com/inmobiliaria` como origen canónico; debe coincidir con la ruta final de publicación antes del despliegue.

### Datos estructurados

- Portada: `RealEstateAgent`, `WebSite`, `WebPage` y `SearchAction`, con área atendida, dirección, contacto, perfiles sociales y temas de conocimiento.
- Buscador: `CollectionPage` e `ItemList`; `js/seo-schema.js` añade cada proyecto de Google Sheets como `ListItem` y `Product` con oferta, precio, categoría, imágenes, ubicación y atributos.
- Ficha: `ItemPage` base; el mismo script añade `Product` y `Residence` del proyecto consultado, con precio USD, disponibilidad, metraje, dormitorios, baños, niveles, cochera, amenidades, dirección, canonical y etiquetas sociales específicas.

El generador de schema es independiente, defensivo y sin salida visual: si el feed remoto no responde, mantiene el JSON-LD base y no registra errores en consola. Para máxima cobertura de rastreadores que no ejecutan JavaScript, la evolución recomendada es renderizar el catálogo y el JSON-LD del inmueble en servidor o durante el build estático.

## Validación ejecutada

1. `node --check js/main.js` y `node --check js/seo-schema.js` sin errores de sintaxis.
2. Se parsearon los tres bloques JSON-LD base con `json.loads` sin errores.
3. Se verificaron recursos locales activos y landmarks: un `main` y un `footer` por página; no quedan rutas locales activas inexistentes.
4. `git diff --check` sin errores de espacios.

La validación visual automatizada local no pudo ejecutarse porque el navegador integrado bloquea URLs `file://` y el servidor local no quedó disponible en su entorno aislado. Los cambios de escritorio están aislados por breakpoints, por lo que la verificación final recomendada antes de publicar es abrir las tres rutas en el hosting real a 375px, 768px y 1440px y validar los JSON-LD con Schema Markup Validator.
