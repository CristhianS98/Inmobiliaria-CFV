/*
 * Capa SEO/GEO aislada. No depende ni modifica main.js, controles ni tarjetas.
 * Su única salida es un bloque JSON-LD y metadatos de la ficha seleccionada.
 */
(function () {
    "use strict";

    const pagina = document.body && document.body.dataset ? document.body.dataset.page : "";
    if (pagina !== "search" && pagina !== "detail" || !window.fetch) return;

    const API_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ4dg7f_kOO8kpWFw3J1qXp2k6tEENE2pJ0sOZ0kalCUHfMwetZ-KhoM3eQVQcCOkt3XsYy48KxzemI/pub?gid=0&single=true&output=csv";
    const URL_PUBLICA = "https://www.cfvingenieros.com/inmobiliaria";
    const ID_SCHEMA = "cfv-schema-dynamic";

    function parsearCSV(texto) {
        const lineas = texto.replace(/\r/g, "").split("\n").filter(linea => linea.trim());
        if (lineas.length < 2) return [];

        const separarLinea = linea => {
            const celdas = [];
            let celda = "";
            let entreComillas = false;

            for (let indice = 0; indice < linea.length; indice += 1) {
                const caracter = linea[indice];
                if (caracter === '"') entreComillas = !entreComillas;
                else if (caracter === "," && !entreComillas) {
                    celdas.push(celda);
                    celda = "";
                } else celda += caracter;
            }
            celdas.push(celda);
            return celdas.map(valor => valor.trim().replace(/^"|"$/g, ""));
        };

        const encabezados = separarLinea(lineas[0]);
        return lineas.slice(1).map(linea => {
            const celdas = separarLinea(linea);
            return encabezados.reduce((proyecto, encabezado, indice) => {
                proyecto[encabezado] = celdas[indice] || "";
                return proyecto;
            }, {});
        });
    }

    function precioNumerico(proyecto) {
        return Number.parseInt(String(proyecto.precio || proyecto.precio_texto || "").replace(/\D/g, ""), 10) || 0;
    }

    function disponibilidad(estado) {
        const valor = String(estado || "").toLowerCase();
        if (valor.includes("listo") || valor.includes("entregar")) return "https://schema.org/InStock";
        if (valor.includes("preventa") || valor.includes("constru")) return "https://schema.org/PreOrder";
        return "https://schema.org/LimitedAvailability";
    }

    function imagenes(proyecto) {
        return String(proyecto.renders_galeria || "")
            .split(",")
            .map(url => url.trim())
            .filter(Boolean)
            .map(convertirImagenDrive);
    }

    function convertirImagenDrive(url) {
        if (!url) return URL_PUBLICA + "/images/image-4.png";
        let idArchivo = "";
        if (url.includes("/file/d/")) idArchivo = url.split("/file/d/")[1].split("/")[0];
        else if (url.includes("open?id=")) idArchivo = url.split("open?id=")[1].split("&")[0];
        else if (url.includes("id=")) idArchivo = url.split("id=")[1].split("&")[0];
        return idArchivo
            ? "https://images.weserv.nl/?url=drive.google.com/uc?export=view%26id=" + encodeURIComponent(idArchivo)
            : url;
    }

    function urlFicha(proyecto) {
        return URL_PUBLICA + "/single.html?id=" + encodeURIComponent(proyecto.id || "");
    }

    function valorPropiedad(nombre, valor, unidad) {
        if (!valor) return null;
        const propiedad = {
            "@type": "PropertyValue",
            "name": nombre,
            "value": String(valor)
        };
        if (unidad) propiedad.unitText = unidad;
        return propiedad;
    }

    function esquemaProyecto(proyecto) {
        const url = urlFicha(proyecto);
        const precio = precioNumerico(proyecto);
        const fotos = imagenes(proyecto);
        const propiedades = [
            valorPropiedad("Área", proyecto.metraje, "m²"),
            valorPropiedad("Dormitorios", proyecto.habitaciones),
            valorPropiedad("Baños", proyecto.banos),
            valorPropiedad("Ambientes", proyecto.ambientes),
            valorPropiedad("Niveles", proyecto.niveles),
            valorPropiedad("Cochera", proyecto.cochera),
            valorPropiedad("Estado del proyecto", proyecto.estado),
            valorPropiedad("Amenidades", proyecto.amenidades)
        ].filter(Boolean);
        const oferta = {
            "@type": "Offer",
            "url": url,
            "priceCurrency": "USD",
            "availability": disponibilidad(proyecto.estado),
            "seller": { "@id": URL_PUBLICA + "#real-estate-agent" }
        };
        if (precio > 0) oferta.price = precio;

        const producto = {
            "@type": "Product",
            "@id": url + "#inmueble",
            "name": proyecto.titulo || "Proyecto inmobiliario CFV Ingenieros",
            "url": url,
            "description": proyecto.descripcion || "Proyecto inmobiliario de CFV Ingenieros en Andahuaylas.",
            "category": proyecto.tipo_propiedad || "Inmueble",
            "sku": proyecto.id ? "CFV-" + proyecto.id : undefined,
            "brand": { "@type": "Brand", "name": "CFV Ingenieros" },
            "offers": oferta,
            "additionalProperty": propiedades,
            "contentLocation": {
                "@type": "Place",
                "name": proyecto.ciudad || "Andahuaylas",
                "address": {
                    "@type": "PostalAddress",
                    "streetAddress": proyecto.direccion_comercial || undefined,
                    "addressLocality": proyecto.ciudad || "Andahuaylas",
                    "addressRegion": "Apurímac",
                    "addressCountry": "PE"
                }
            },
            "mainEntityOfPage": url
        };
        if (fotos.length) producto.image = fotos;
        return producto;
    }

    function insertarSchema(schema) {
        let nodo = document.getElementById(ID_SCHEMA);
        if (!nodo) {
            nodo = document.createElement("script");
            nodo.id = ID_SCHEMA;
            nodo.type = "application/ld+json";
            document.body.appendChild(nodo);
        }
        nodo.textContent = JSON.stringify(schema).replace(/</g, "\\u003c");
    }

    function actualizarMeta(selector, contenido) {
        const nodo = document.querySelector(selector);
        if (nodo && contenido) nodo.setAttribute("content", contenido);
    }

    function generarListado(proyectos) {
        insertarSchema({
            "@context": "https://schema.org",
            "@graph": [{
                "@type": "CollectionPage",
                "@id": URL_PUBLICA + "/search.html#webpage",
                "mainEntity": {
                    "@type": "ItemList",
                    "@id": URL_PUBLICA + "/search.html#listado-proyectos",
                    "name": "Listado de proyectos inmobiliarios de CFV Ingenieros",
                    "numberOfItems": proyectos.length,
                    "itemListOrder": "https://schema.org/ItemListUnordered",
                    "itemListElement": proyectos.map((proyecto, indice) => ({
                        "@type": "ListItem",
                        "position": indice + 1,
                        "url": urlFicha(proyecto),
                        "item": esquemaProyecto(proyecto)
                    }))
                }
            }]
        });
    }

    function generarFicha(proyectos) {
        const parametros = new URLSearchParams(window.location.search);
        const id = parametros.get("id");
        const proyecto = proyectos.find(item => String(item.id) === String(id)) || proyectos[0];
        if (!proyecto) return;

        const url = urlFicha(proyecto);
        const producto = esquemaProyecto(proyecto);
        const residencia = {
            "@type": "Residence",
            "@id": url + "#residencia",
            "name": producto.name,
            "url": url,
            "address": producto.contentLocation.address,
            "numberOfRooms": Number.parseInt(String(proyecto.habitaciones).replace(/\D/g, ""), 10) || undefined,
            "floorSize": proyecto.metraje ? {
                "@type": "QuantitativeValue",
                "value": String(proyecto.metraje).replace(/[^\d.,]/g, ""),
                "unitCode": "MTK"
            } : undefined
        };
        if (producto.image) residencia.image = producto.image;

        insertarSchema({
            "@context": "https://schema.org",
            "@graph": [
                producto,
                residencia,
                {
                    "@type": "ItemPage",
                    "@id": url + "#webpage",
                    "url": url,
                    "name": producto.name + " | CFV Ingenieros",
                    "mainEntity": { "@id": producto["@id"] },
                    "inLanguage": "es-PE"
                }
            ]
        });

        const titulo = producto.name + " | CFV Ingenieros";
        document.title = titulo;
        const descripcion = producto.description;
        const imagen = producto.image && producto.image[0];
        const canonica = document.querySelector('link[rel="canonical"]');
        if (canonica) canonica.setAttribute("href", url);
        actualizarMeta('meta[name="description"]', descripcion);
        actualizarMeta('meta[property="og:title"]', titulo);
        actualizarMeta('meta[property="og:description"]', descripcion);
        actualizarMeta('meta[property="og:url"]', url);
        actualizarMeta('meta[name="twitter:title"]', titulo);
        actualizarMeta('meta[name="twitter:description"]', descripcion);
        if (imagen) {
            actualizarMeta('meta[property="og:image"]', imagen);
            actualizarMeta('meta[name="twitter:image"]', imagen);
        }
    }

    fetch(API_SHEET_URL, { credentials: "omit" })
        .then(respuesta => respuesta.ok ? respuesta.text() : Promise.reject())
        .then(parsearCSV)
        .then(proyectos => {
            if (!proyectos.length) return;
            if (pagina === "search") generarListado(proyectos);
            if (pagina === "detail") generarFicha(proyectos);
        })
        .catch(function () {
            // La ficha visual y el esquema base continúan disponibles sin datos remotos.
        });
}());
