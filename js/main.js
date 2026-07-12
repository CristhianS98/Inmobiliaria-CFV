$(function () {
    "use strict";

    // --- CONFIGURACIÓN GLOBAL ---
    const API_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ4dg7f_kOO8kpWFw3J1qXp2k6tEENE2pJ0sOZ0kalCUHfMwetZ-KhoM3eQVQcCOkt3XsYy48KxzemI/pub?gid=0&single=true&output=csv";
    const WHATSAPP_NUMERO = "51912830351";
    
    // Estado de la aplicación (Datos de la API + Filtros Activos)
    let listaProyectosGlobal = [];
    let filtroPrecioMin = 0;
    let filtroPrecioMax = 300000;
    let limitePrecioMax = 300000;

    // --- FUNCIÓN DE SEGURIDAD (ANTI-XSS) ---
    function escapeHTML(str) {
        if (str === null || str === undefined) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // --- CAROUSELS Y COMPONENTES ESTÁTICOS INICIALES ---
    if ($('.featured-carousel').length > 0) {
        $('.featured-carousel').owlCarousel({
            loop: true, margin: 10, responsiveClass: true, autoplay: true, autoplayTimeout: 5000, autoplaySpeed: 1100, autoplayHoverPause: true, dots: true,
            navText: ["<i class='bx bx-left-arrow-alt'></i>", "<i class='bx bx-right-arrow-alt'></i>"],
            responsive: { 0: { items: 1, nav: true }, 600: { items: 3, nav: false }, 1000: { items: 3, nav: true, loop: true } }
        });
    }

    if ($(".testimonial-area .owl-carousel").length > 0) {
        $(".testimonial-area .owl-carousel").owlCarousel({
            loop: true, margin: 10, responsiveClass: true, autoplay: true, autoplayTimeout: 5000, autoplayHoverPause: true, dots: true,
            navText: ["<i class='bx bx-left-arrow-alt'></i>", "<i class='bx bx-right-arrow-alt'></i>"],
            responsive: { 0: { items: 1, nav: true }, 600: { items: 3, nav: false }, 1000: { items: 1, nav: true, loop: true } }
        });
    }

    if ($(".odometer").length > 0) {
        $(window).on("scroll", function() {
            if ($(this).scrollTop() > 700) {
                $(".odometer").each(function () {
                    $(this).html($(this).attr("data-value"));
                });
            }
        });
    }

    if ($("select").length > 0) {
        $("select").niceSelect();
    }

    // Inicialización del Slider de Precios con rangos dinámicos
    if ($("#price-range").length > 0) {
        $("#price-range").slider({
            step: 500, range: true, min: 0, max: 300000, values:[0, 300000],
            slide: function (event, ui) { 
                $("#priceRange").val(ui.values[0] + " - " + ui.values[1]); 
                filtroPrecioMin = ui.values[0];
                filtroPrecioMax = ui.values[1];
                ejecutarFiltradoDinamico(); // Filtrado reactivo al mover el slider
            }
        });
        $("#priceRange").val($("#price-range").slider("values", 0) + " - " + $("#price-range").slider("values", 1));
        filtroPrecioMin = $("#price-range").slider("values", 0);
        filtroPrecioMax = $("#price-range").slider("values", 1);
    }

    if ($('.popular-slider').length > 0) {
        $('.popular-slider').slick({ centerMode: true, centerPadding: '60px', slidesToShow: 1, dots: true });
    }

    $("a[data-rel]").lightcase();
    $("[data-bs-toggle='tooltip']").tooltip();

    $(window).on("mousemove", function (e) {
        $(".cursor").css({ left: `${e.clientX}px`, top: `${e.clientY}px` });
    });

    // --- PROCESAMIENTO Y PARSEO DE LA API (GOOGLE SHEETS) ---
    function cargarBaseDeDatos() {
        fetch(API_SHEET_URL)
            .then(response => response.text())
            .then(csvTexto => {
                listaProyectosGlobal = parsearCSV(csvTexto);
                limitePrecioMax = Math.max(300000, ...listaProyectosGlobal.map(obtenerPrecio));
                if ($("#price-range").length > 0) {
                    $("#price-range").slider("option", "max", limitePrecioMax);
                    $("#price-range").slider("values", [0, limitePrecioMax]);
                    $("#priceRange").val(`0 - ${limitePrecioMax}`);
                    filtroPrecioMin = 0;
                    filtroPrecioMax = limitePrecioMax;
                }
                
                // Una vez cargados los datos globales, calculamos los contadores fijos del sidebar
                actualizarSidebarContadores();
                
                // Renderizado inicial completo
                inyectarDatosEnPantallas();
                
            })
            .catch(error => console.error("Error conectando con la API de Google Sheets:", error));
    }

    function parsearCSV(texto) {
        const lineas = texto.replace(/\r/g, "").split("\n");
        const resultado = [];
        if (lineas.length <= 1) return resultado;
        
        const encabezados = lineas[0].split(",").map(h => h.trim().replace(/"/g, ''));

        for (let i = 1; i < lineas.length; i++) {
            if (!lineas[i].trim()) continue;
            
            const celdas = [];
            let currentCell = '';
            let inQuotes = false;
            
            for (let j = 0; j < lineas[i].length; j++) {
                const char = lineas[i][j];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    celdas.push(currentCell);
                    currentCell = '';
                } else {
                    currentCell += char;
                }
            }
            celdas.push(currentCell);

            const objeto = {};
            encabezados.forEach((encabezado, index) => {
                let valor = celdas[index] ? celdas[index].trim() : "";
                if (valor.startsWith('"') && valor.endsWith('"')) {
                    valor = valor.substring(1, valor.length - 1);
                }
                objeto[encabezado] = valor;
            });
            // Campos calculados usados por el buscador; no cambian los datos originales.
            objeto.precio_numerico_limpio = obtenerPrecio(objeto);
            objeto.amenidades_array = (objeto.amenidades || "")
                .split(",")
                .map(amenidad => normalizar(amenidad))
                .filter(Boolean);
            resultado.push(objeto);
        }
        return resultado;
    }

    function convertirEnlaceDriveAImagen(url) {
        if (!url || url.trim() === "") return "images/image-4.jpg";
        let urlLimpia = url.trim();
        let idArchivo = null;
       
        if (urlLimpia.includes("/file/d/")) {
            idArchivo = urlLimpia.split("/file/d/")[1].split("/")[0];
        } else if (urlLimpia.includes("open?id=")) {
            idArchivo = urlLimpia.split("open?id=")[1].split("&")[0];
        } else if (urlLimpia.includes("id=")) {
            idArchivo = urlLimpia.split("id=")[1].split("&")[0];
        }

        if (idArchivo) {
            return `https://images.weserv.nl/?url=drive.google.com/uc?export=view%26id=${idArchivo}`;
        }
        return urlLimpia;
    }

    // --- LÓGICA DE FILTRADO DINÁMICO ---
    function normalizar(valor) {
        return (valor || "")
            .toString()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();
    }

    function obtenerPrecio(proyecto) {
        return parseInt((proyecto.precio || "").toString().replace(/\D/g, ""), 10) || 0;
    }

    function valoresMarcados(nombre) {
        return $(`input[name="${nombre}"]:checked`)
            .map(function () { return normalizar(this.value); })
            .get();
    }

    function ejecutarFiltradoDinamico() {
        if ($("#grid-proyectos-dinamico, .filter-results-area").length === 0) return;

        const tipos = valoresMarcados("tipo_propiedad");
        const amenidades = valoresMarcados("amenidades");
        const presupuestos = valoresMarcados("rango_presupuesto");
        const habitaciones = valoresMarcados("habitaciones_conteo").map(Number);
        const estados = valoresMarcados("estado_proyecto");
        const texto = normalizar($("#search-keyword").val());
        const orden = $("#sort").val();

        const proyectosFiltrados = listaProyectosGlobal.filter(proyecto => {
            const tipo = normalizar(proyecto.tipo_propiedad);
            const estado = normalizar(proyecto.estado);
            const precio = obtenerPrecio(proyecto);
            const numeroHabitaciones = parseInt((proyecto.habitaciones || "").toString().replace(/\D/g, ""), 10) || 0;
            const contenido = normalizar([
                proyecto.titulo, proyecto.descripcion, proyecto.ciudad,
                proyecto.direccion_comercial, proyecto.tipo_propiedad,
                proyecto.estado, proyecto.amenidades
            ].join(" "));

            if (tipos.length && !tipos.some(filtro => tipo.includes(filtro))) return false;
            if (amenidades.length && !amenidades.every(filtro => proyecto.amenidades_array.includes(filtro))) return false;
            if (estados.length && !estados.some(filtro => estado.includes(filtro))) return false;
            if (habitaciones.length && !habitaciones.some(cantidad => cantidad >= 3 ? numeroHabitaciones >= cantidad : numeroHabitaciones === cantidad)) return false;
            if (texto && !contenido.includes(texto)) return false;
            if (precio < filtroPrecioMin || precio > filtroPrecioMax) return false;

            if (presupuestos.length) {
                return presupuestos.some(rango => {
                    if (rango === "economico") return precio >= 50000 && precio < 100000;
                    if (rango === "medio") return precio >= 100000 && precio <= 300000;
                    return rango === "premium" && precio > 300000;
                });
            }

            return true;
        });

        if (orden === "precio_bajo") proyectosFiltrados.sort((a, b) => obtenerPrecio(a) - obtenerPrecio(b));
        if (orden === "precio_alto") proyectosFiltrados.sort((a, b) => obtenerPrecio(b) - obtenerPrecio(a));

        renderizarGrillaBuscador(proyectosFiltrados);
        actualizarContadoresFiltros(proyectosFiltrados);
    }

    // --- INYECCIÓN Y RENDERIZADO EN PANTALLAS ---
    function inyectarDatosEnPantallas() {
        // 1. Carrusel Estático de Inicio (Index)
        if ($('.featured-carousel').length > 0) {
            const $carrusel = $('.featured-carousel');
            if ($carrusel.hasClass('owl-loaded')) { $carrusel.owlCarousel('destroy'); }
            
            let carruselHTML = '';
            listaProyectosGlobal.forEach(proyecto => {
                const fotosRaw = proyecto.renders_galeria ? proyecto.renders_galeria : "";
                const fotos = fotosRaw.split(",");
                const urlImagenDirecta = convertirEnlaceDriveAImagen(fotos[0]);

                carruselHTML += `
                    <div class="featured-list-card h-100 position-relative">
                        <div class="card-image">
                            <img src="${urlImagenDirecta}" alt="${escapeHTML(proyecto.titulo)}" style="height:250px; object-fit:cover; width:100%;">
                            <span style="white-space: normal !important; width: auto !important; max-width: none !important;">Estado: ${escapeHTML(proyecto.estado)}</span>
                            <div class="location-gallery">
                                <div class="location"><i class="bx bx-map-alt"></i> ${escapeHTML(proyecto.ciudad)}</div>
                                <div class="gallery"><i class="bx bx-camera"></i> ${fotos[0].trim() !== "" ? fotos.length : 0}</div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="p-4 pt-0">
                                <span class="price">${escapeHTML(proyecto.precio_texto)}</span>
                                <h6 style="white-space: normal !important; overflow: visible !important; height: auto !important; min-height: 44px; display: block;">
                                    <a href="single.html?id=${escapeHTML(proyecto.id)}" class="stretched-link">${escapeHTML(proyecto.titulo)}</a>
                                </h6>
                                <p>${escapeHTML((proyecto.descripcion || "").substring(0, 110))}...</p>
                                <ul class="nav">
                                    <li class="border-end pe-3 me-3 text-center">
                                        <span class="d-block fw-bold">${escapeHTML(proyecto.habitaciones)}</span>
                                        <i class="bx bx-bed"></i> Hab.
                                    </li>
                                    <li class="border-end pe-3 me-3 text-center">
                                        <span class="d-block fw-bold">${escapeHTML(proyecto.banos)}</span>
                                        <i class="bx bx-shower"></i> Baños
                                    </li>
                                    <li class="text-center">
                                        <span class="d-block fw-bold">${escapeHTML(proyecto.metraje)}</span>
                                        <i class="bx bx-area"></i> M²
                                    </li>
                                </ul>
                            </div>
                            <div class="align-items-center d-flex estate-agents justify-content-between pt-4 bg-light p-3">
                                <div class="d-flex">
                                    <div class="flex-shrink-0 me-3"><img src="images/service_icon_1.png" class="rounded-circle" width="48" height="48" alt="Asesor"></div>
                                    <div class="flex-grow-1"><span class="fw-semibold d-block">Asesor Comercial</span><small class="text-muted">Contacto Directo</small></div>
                                </div>
                                <div class="card-actions position-relative" style="z-index: 5;">
                                    <a href="https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent('Hola, me interesa el proyecto ' + proyecto.titulo)}" target="_blank" class="btn btn-sm btn-success rounded-circle d-flex align-items-center justify-content-center p-0" style="width:35px; height:35px; background-color:#25D366; border:none;"><i class="bx bxl-whatsapp fs-5 text-white"></i></a>
                                </div>
                            </div>
                        </div>
                    </div>`;
            });

            $carrusel.html(carruselHTML);
            $carrusel.owlCarousel({
                loop: listaProyectosGlobal.length > 3, margin: 10, responsiveClass: true, autoplay: true, autoplayTimeout: 5000, autoplaySpeed: 1100, autoplayHoverPause: true, dots: true,
                navText: ["<i class='bx bx-left-arrow-alt'></i>", "<i class='bx bx-right-arrow-alt'></i>"],
                responsive: { 0: { items: 1, nav: true }, 600: { items: 3, nav: false }, 1000: { items: 3, nav: true, loop: true } }
            });
        }

        // 2. Grilla Inicial del Buscador (Muestra todo al cargar por primera vez)
        if ($(".filter-results-area").length > 0) {
            renderizarGrillaBuscador(listaProyectosGlobal);
            actualizarContadoresFiltros(listaProyectosGlobal);
        }
        
        // 3. Ficha Técnica Única
        inyectarFichaTecnicaYWidgets();
    }

    // Encapsulado de renderizado reutilizable por los filtros dinámicos
    function renderizarGrillaBuscador(proyectos) {
        const $grilla = $("#grid-proyectos-dinamico").length
            ? $("#grid-proyectos-dinamico")
            : $(".filter-results-area .row");
        let grillaHTML = '';
        
        // Actualizar el contador dinámico de resultados encontrados en tu cabecera
        $("#total-proyectos-conteo").text(proyectos.length);

        if (proyectos.length === 0) {
            $grilla.html('<div class="col-12 text-center py-5"><p class="text-muted fs-5">No se encontraron proyectos que coincidan con los filtros seleccionados.</p></div>');
            return;
        }

        proyectos.forEach(proyecto => {
            const fotosRaw = proyecto.renders_galeria ? proyecto.renders_galeria : "";
            const fotos = fotosRaw.split(",");
            const urlImagenDirecta = convertirEnlaceDriveAImagen(fotos[0]);

            grillaHTML += `
                <div class="col-12 col-md-6 mb-4">
                    <div class="featured-list-card h-100 position-relative border rounded overflow-hidden shadow-sm">
                        <div class="card-image">
                            <img src="${urlImagenDirecta}" alt="${escapeHTML(proyecto.titulo)}" style="height:230px; object-fit:cover; width:100%;">
                            <span style="white-space: normal !important; width: auto !important; max-width: none !important;">Estado: ${escapeHTML(proyecto.estado)}</span>
                            <div class="location-gallery">
                                <div class="location"><i class="bx bx-map-alt"></i> ${escapeHTML(proyecto.ciudad)}</div>
                                <div class="gallery"><i class="bx bx-camera"></i> ${fotos[0].trim() !== "" ? fotos.length : 0}</div>
                            </div>
                        </div>
                        <div class="card-body bg-white">
                            <div class="p-3">
                                <span class="price d-block text-danger fw-bold h5 mb-1">${escapeHTML(proyecto.precio_texto)}</span>
                                <h6 class="fw-bold" style="white-space: normal !important; overflow: visible !important; height: auto !important;">
                                    <a href="single.html?id=${escapeHTML(proyecto.id)}" class="stretched-link text-decoration-none text-dark">${escapeHTML(proyecto.titulo)}</a>
                                </h6>
                                <p class="text-muted small">${escapeHTML((proyecto.descripcion || "").substring(0, 95))}...</p>
                                <ul class="nav small justify-content-between border-top pt-2 mt-2 list-unstyled">
                                    <li>${escapeHTML(proyecto.habitaciones)} <i class="bx bx-bed text-muted"></i> Hab.</li>
                                    <li>${escapeHTML(proyecto.banos)} <i class="bx bx-shower text-muted"></i> Baños</li>
                                    <li>${escapeHTML(proyecto.metraje)} <i class="bx bx-area text-muted"></i> m²</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>`;
        });
        
        $grilla.html(grillaHTML);
    }

    function actualizarContadoresFiltros(proyectos) {
        const grupos = {
            tipo_propiedad: ["Departamento", "Casa", "Dúplex", "Local"],
            amenidades: ["Estacionamiento Privado", "Piscina", "Sistemas Inteligentes", "Clósets / Roperos Empotrados", "Zonas Comerciales Cercanas", "Área Infantil / Recreativa"],
            estado: ["En Construcción", "En Preventa", "Listo para Entregar"]
        };

        grupos.tipo_propiedad.forEach(valor => {
            const total = proyectos.filter(p => normalizar(p.tipo_propiedad).includes(normalizar(valor))).length;
            $(`[data-count="tipo_propiedad_${valor}"]`).text(total);
        });
        grupos.amenidades.forEach(valor => {
            const total = proyectos.filter(p => p.amenidades_array.includes(normalizar(valor))).length;
            $(`[data-count="amenidades_${valor}"]`).text(total);
        });
        grupos.estado.forEach(valor => {
            const total = proyectos.filter(p => normalizar(p.estado).includes(normalizar(valor))).length;
            $(`[data-count="estado_${valor}"]`).text(total);
        });
        [1, 2, 3, 5].forEach(valor => {
            const total = proyectos.filter(p => {
                const habitaciones = parseInt((p.habitaciones || "").toString().replace(/\D/g, ""), 10) || 0;
                return valor >= 3 ? habitaciones >= valor : habitaciones === valor;
            }).length;
            $(`[data-count="habitaciones_${valor}"]`).text(total);
        });
    }

    // --- VISTA DETALLE (SINGLE.HTML) ---
    function inyectarFichaTecnicaYWidgets() {
        if ($(".property-info-content").length > 0) {
            const parametrosUrl = new URLSearchParams(window.location.search);
            const idProyectoUrl = parametrosUrl.get('id');
            const proyecto = listaProyectosGlobal.find(p => p.id === idProyectoUrl) || listaProyectosGlobal[0];

            if (proyecto) {
                document.title = `${escapeHTML(proyecto.titulo)} - CFV Ingenieros`;
                $(".property-info-content h2").text(proyecto.titulo);
                $("#proyecto-referencia").val(proyecto.titulo || "");
                $(".meta-location").html(`<i class="bx bx-map"></i> ${escapeHTML(proyecto.direccion_comercial)}, ${escapeHTML(proyecto.ciudad)}, Perú`);
                $(".property-info-content p").first().text(proyecto.descripcion);
                $(".meta-category.bg-orange").text(proyecto.estado);

                const fichaTecnicaHtml = `
                    <ul>
                        <li><label>ID Proyecto:</label> <span>CFV-${escapeHTML(proyecto.id).toUpperCase()}</span></li>
                        <li><label>Área:</label> <span>${escapeHTML(proyecto.metraje)} m²</span></li>
                        <li><label>Ambientes:</label> <span>${escapeHTML(proyecto.ambientes)}</span></li>
                        <li><label>Baños:</label> <span>${escapeHTML(proyecto.banos)}</span></li>
                        <li><label>Año de Entrega:</label> <span>2026</span></li>
                    </ul>
                    <ul>
                        <li><label>Niveles:</label> <span>${escapeHTML(proyecto.niveles)}</span></li>
                        <li><label>Dormitorios:</label> <span>${escapeHTML(proyecto.habitaciones)}</span></li>
                        <li><label>Precio:</label> <span>${escapeHTML(proyecto.precio_texto)}</span></li>
                        <li><label>Cochera:</label> <span>${escapeHTML(proyecto.cochera)}</span></li>
                        <li><label>Estado Obra:</label> <span>${escapeHTML(proyecto.estado)}</span></li>
                    </ul>`;
                $(".property-detail-info-list").html(fichaTecnicaHtml);

                // Galería exclusiva de single.html: una imagen completa por vez, sin deformarla.
                const $galeriaPrincipal = $('#single-property-slider');
                const $contadorGaleria = $('#single-gallery-counter');
                if ($galeriaPrincipal.length > 0) {
                    if ($galeriaPrincipal.hasClass('slick-initialized')) $galeriaPrincipal.slick('unslick');
                    $galeriaPrincipal.off('afterChange.singleGallery');

                    const fotos = (proyecto.renders_galeria || '')
                        .split(',')
                        .map(foto => foto.trim())
                        .filter(Boolean)
                        .map(convertirEnlaceDriveAImagen);
                    let principalHTML = '';

                    fotos.forEach((urlImagen, indice) => {
                        principalHTML += `
                            <a href="${urlImagen}" data-rel="lightcase:galeria-proyecto" aria-label="Abrir imagen ${indice + 1}">
                                <img src="${urlImagen}" class="gallery-main-image" alt="${escapeHTML(proyecto.titulo)} - imagen ${indice + 1}">
                            </a>`;
                    });

                    $galeriaPrincipal.html(principalHTML);
                    $contadorGaleria.text(fotos.length ? `1 / ${fotos.length}` : '0 / 0');

                    if (fotos.length > 0) {
                        $galeriaPrincipal.slick({
                            slidesToShow: 1,
                            slidesToScroll: 1,
                            arrows: true,
                            fade: false,
                            speed: 300,
                            adaptiveHeight: true,
                            infinite: fotos.length > 1,
                            prevArrow: $('.single-gallery-prev'),
                            nextArrow: $('.single-gallery-next')
                        });
                        $galeriaPrincipal.on('afterChange.singleGallery', function (evento, slick, indiceActual) {
                            $contadorGaleria.text(`${indiceActual + 1} / ${slick.slideCount}`);
                        });
                        $galeriaPrincipal.find('a[data-rel]').lightcase({ type: 'image' });
                    }
                }
                inyectarMediaAdicionalSingle(proyecto);
                renderizarSidebarSingle(proyecto);
            }
        }
    }

    // Widgets exclusivos de single.html: destacados, categorías y referencia de cotización.
    function renderizarSidebarSingle(proyectoActual) {
        if (!$(".property-info-content").length) return;

        const obtenerValoracion = proyecto => {
            const valor = proyecto.valoracion || proyecto.rating || proyecto.puntuacion || 0;
            return parseFloat(String(valor).replace(",", ".")) || 0;
        };
        const destacados = listaProyectosGlobal
            .filter(proyecto => proyecto.id !== proyectoActual.id)
            .sort((a, b) => obtenerValoracion(b) - obtenerValoracion(a))
            .slice(0, 3);

        const destacadosHtml = destacados.length
            ? destacados.map(proyecto => {
                const foto = convertirEnlaceDriveAImagen((proyecto.renders_galeria || "").split(",")[0]);
                return `
                    <div class="d-flex mb-3 align-items-center">
                        <a href="single.html?id=${encodeURIComponent(proyecto.id || "")}" class="flex-shrink-0 me-3">
                            <img src="${foto}" alt="${escapeHTML(proyecto.titulo)}" width="76" height="76" style="object-fit:cover; border-radius:4px;">
                        </a>
                        <div class="flex-grow-1">
                            <h6 class="mb-1"><a href="single.html?id=${encodeURIComponent(proyecto.id || "")}" class="text-decoration-none text-dark">${escapeHTML(proyecto.titulo)}</a></h6>
                            <small class="d-block text-muted"><i class="bx bx-map-alt"></i> ${escapeHTML(proyecto.ciudad)}</small>
                            <span class="text-main-color fw-semibold">${escapeHTML(proyecto.precio_texto)}</span>
                        </div>
                    </div>`;
            }).join("")
            : '<p class="text-muted mb-0">Próximamente mostraremos más desarrollos.</p>';

        $("#contenedor-destacados").html(destacadosHtml);

        const categorias = [
            ["Departamento", "#total-cat-departamentos"],
            ["Casa", "#total-cat-casas"],
            ["Dúplex", "#total-cat-duplex"],
            ["Local", "#total-cat-locales"]
        ];
        categorias.forEach(([categoria, selector]) => {
            const total = listaProyectosGlobal.filter(proyecto =>
                normalizar(proyecto.tipo_propiedad).includes(normalizar(categoria))
            ).length;
            $(selector).text(total);
        });
    }

    function inyectarMediaAdicionalSingle(proyecto) {
        if (proyecto.mapa_url) {
            $("#mapa-iframe").attr("src", proyecto.mapa_url);
            $("#link-mapa-real").attr("href", proyecto.mapa_url);
        }

        if (proyecto.brochure_pdf) {
            let urlDescarga = proyecto.brochure_pdf;
            let idArchivo = null;

            if (urlDescarga.includes("/file/d/")) {
                idArchivo = urlDescarga.split("/file/d/")[1].split("/")[0];
            } else if (urlDescarga.includes("open?id=")) {
                idArchivo = urlDescarga.split("open?id=")[1].split("&")[0];
            } else if (urlDescarga.includes("id=")) {
                idArchivo = urlDescarga.split("id=")[1].split("&")[0];
            }

            if (idArchivo) {
                let cacheBuster = new Date().getTime();
                urlDescarga = `https://drive.google.com/uc?export=download&id=${idArchivo}&t=${cacheBuster}`;
            }
            
            let nombreLimpio = proyecto.titulo ? `Brochure_${proyecto.titulo.replace(/\s+/g, '_')}.pdf` : "Brochure.pdf";
            
            $("#btn-descargar-brochure").attr("href", urlDescarga).attr("download", escapeHTML(nombreLimpio)).removeAttr("target");
        } else {
            $("#btn-descargar-brochure").closest('.col-12').hide();
        }

        if (proyecto.amenidades) {
            let amenidadesHTML = '';
            const amenidadesMarcadas = proyecto.amenidades.split(",");
            amenidadesMarcadas.forEach(amenidad => {
                if (amenidad.trim()) {
                    amenidadesHTML += `<li class="w-50 float-start mb-2"><i class="bx bx-check-double text-main-color me-2"></i>${escapeHTML(amenidad.trim())}</li>`;
                }
            });
            $("#lista-amenidades").html(amenidadesHTML);
        }
    }

    function actualizarSidebarContadores() {
        if ($(".sidebar").length === 0) return;
        let depts = 0, casas = 0, duplex = 0, locales = 0;
        listaProyectosGlobal.forEach(p => {
            if (p.tipo_propiedad && p.tipo_propiedad.includes("Departamento")) depts++;
            if (p.tipo_propiedad && p.tipo_propiedad.includes("Casa")) casas++;
            if (p.tipo_propiedad && p.tipo_propiedad.includes("Dúplex")) duplex++;
            if (p.tipo_propiedad && p.tipo_propiedad.includes("Local")) locales++;
        });
        $("#total-cat-departamentos").text(`(${depts.toString().padStart(2, '0')})`);
        $("#total-cat-casas").text(`(${casas.toString().padStart(2, '0')})`);
        $("#total-cat-duplex").text(`(${duplex.toString().padStart(2, '0')})`);
        $("#total-cat-locales").text(`(${locales.toString().padStart(2, '0')})`);
    }

    // Eventos exclusivos del buscador. No modifican la plantilla de las tarjetas.
    $(document).on("click", "#btn-aplicar-filtros, #btn-buscar-texto", ejecutarFiltradoDinamico);
    $(document).on("change", "#form-filtros-avanzados input, #sort", ejecutarFiltradoDinamico);
    $(document).on("input", "#search-keyword", ejecutarFiltradoDinamico);
    $(document).on("submit", "#form-busqueda-texto", function (evento) {
        evento.preventDefault();
        ejecutarFiltradoDinamico();
    });
    $(document).on("click", "#btn-limpiar-filtros", function () {
        const formularioFiltros = $("#form-filtros-avanzados")[0];
        const formularioTexto = $("#form-busqueda-texto")[0];
        if (formularioFiltros) formularioFiltros.reset();
        if (formularioTexto) formularioTexto.reset();
        $("#sort").val("predeterminado");
        if ($("#sort").next(".nice-select").length) $("#sort").niceSelect("update");
        if ($("#price-range").length) {
            $("#price-range").slider("values", [0, limitePrecioMax]);
            $("#priceRange").val(`0 - ${limitePrecioMax}`);
        }
        filtroPrecioMin = 0;
        filtroPrecioMax = limitePrecioMax;
        ejecutarFiltradoDinamico();
    });

    // --- FORMULARIO DE COTIZACIÓN VÍA WHATSAPP ---
    $(document).on("submit", "#form-cotizacion-whatsapp", function (e) {
        e.preventDefault();
        const nombre = $("#cotizar-nombre").val();
        const correo = $("#cotizar-correo").val();
        const mensaje = $("#cotizar-mensaje").val();
        const tituloProyecto = $("#proyecto-referencia").val() || "un proyecto de CFV";
        const textoMensaje = `Hola CFV Inmobiliaria, mi nombre es *${nombre}* (${correo}). Deseo solicitar una cotización formal y asesoría personalizada sobre el proyecto *${tituloProyecto}*. Mi consulta es: ${mensaje}`;
        
        window.open(`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(textoMensaje)}`, '_blank');
    });

    cargarBaseDeDatos();
});

