$(function () {
    "use strict";

    // --- CONFIGURACIÓN GLOBAL ---
    const API_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ4dg7f_kOO8kpWFw3J1qXp2k6tEENE2pJ0sOZ0kalCUHfMwetZ-KhoM3eQVQcCOkt3XsYy48KxzemI/pub?gid=0&single=true&output=csv";
    const WHATSAPP_NUMERO = "519XXXXXXXX"; // TODO: Reemplaza las X con el número real de CFV Ingenieros (sin el símbolo +)
    let listaProyectosGlobal = [];

    // --- CAROUSELS Y SLIDERS ESTÁTICOS INICIALES ---
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

    if ($("#price-range").length > 0) {
        $("#price-range").slider({
            step: 500, range: true, min: 0, max: 300000, values:[0, 30000],
            slide: function (event, ui) { $("#priceRange").val(ui.values[0] + " - " + ui.values[1]); }
        });
        $("#priceRange").val($("#price-range").slider("values", 0) + " - " + $("#price-range").slider("values", 1));
    }

    if ($('.popular-slider').length > 0) {
        $('.popular-slider').slick({ centerMode: true, centerPadding: '60px', slidesToShow: 1, dots: true });
    }

    $("a[data-rel]").lightcase();
    $("[data-bs-toggle='tooltip']").tooltip();

    $(window).on("mousemove", function (e) {
        $(".cursor").css({ left: `${e.clientX}px`, top: `${e.clientY}px` });
    });

    // --- PROCESAMIENTO DE DATOS (GOOGLE SHEETS) ---
    function cargarBaseDeDatos() {
        fetch(API_SHEET_URL)
            .then(response => response.text())
            .then(csvTexto => {
                listaProyectosGlobal = parsearCSV(csvTexto);
                inyectarDatosEnPantallas();
            })
            .catch(error => console.error("Error conectando con Google Sheets:", error));
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

    // --- INYECCIÓN EN PANTALLAS ---
    function inyectarDatosEnPantallas() {
        // 1. Carrusel de Inicio (.featured-carousel)
        if ($('.featured-carousel').length > 0) {
            const $carrusel = $('.featured-carousel');
            if ($carrusel.hasClass('owl-loaded')) { $carrusel.owlCarousel('destroy'); }
            $carrusel.empty();

            listaProyectosGlobal.forEach(proyecto => {
                const fotosRaw = proyecto.renders_galeria ? proyecto.renders_galeria : "";
                const fotos = fotosRaw.split(",");
                const urlImagenDirecta = convertirEnlaceDriveAImagen(fotos[0]);

                $carrusel.append(`
                    <div class="featured-list-card h-100 position-relative">
                        <div class="card-image">
                            <img src="${urlImagenDirecta}" alt="${proyecto.titulo}" style="height:250px; object-fit:cover; width:100%;">
                            <span style="white-space: normal !important; width: auto !important; max-width: none !important;">Estado: ${proyecto.estado}</span>
                            <div class="location-gallery">
                                <div class="location"><i class="bx bx-map-alt"></i> ${proyecto.ciudad}</div>
                                <div class="gallery"><i class="bx bx-camera"></i> ${fotos[0].trim() !== "" ? fotos.length : 0}</div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="p-4 pt-0">
                                <span class="price">${proyecto.precio_texto}</span>
                                <h6 style="white-space: normal !important; overflow: visible !important; height: auto !important; min-height: 44px; display: block;">
                                    <a href="single.html?id=${proyecto.id}" class="stretched-link">${proyecto.titulo}</a>
                                </h6>
                                <p>${(proyecto.descripcion || "").substring(0, 110)}...</p>
                                <ul class="nav">
                                    <li class="border-end pe-3 me-3 text-center">
                                        <span class="d-block fw-bold">${proyecto.habitaciones}</span>
                                        <i class="bx bx-bed"></i> Hab.
                                    </li>
                                    <li class="border-end pe-3 me-3 text-center">
                                        <span class="d-block fw-bold">${proyecto.banos}</span>
                                        <i class="bx bx-shower"></i> Baños
                                    </li>
                                    <li class="text-center">
                                        <span class="d-block fw-bold">${proyecto.metraje}</span>
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
                    </div>`);
            });

            $carrusel.owlCarousel({
                loop: listaProyectosGlobal.length > 3, margin: 10, responsiveClass: true, autoplay: true, autoplayTimeout: 5000, autoplaySpeed: 1100, autoplayHoverPause: true, dots: true,
                navText: ["<i class='bx bx-left-arrow-alt'></i>", "<i class='bx bx-right-arrow-alt'></i>"],
                responsive: { 0: { items: 1, nav: true }, 600: { items: 3, nav: false }, 1000: { items: 3, nav: true, loop: true } }
            });
        }

        // 2. Grilla de Buscador (.filter-results-area)
        if ($(".filter-results-area").length > 0) {
            const $grilla = $(".filter-results-area .row"); 
            $grilla.empty();
            $("#total-proyectos-conteo").text(listaProyectosGlobal.length);

            listaProyectosGlobal.forEach(proyecto => {
                const fotosRaw = proyecto.renders_galeria ? proyecto.renders_galeria : "";
                const fotos = fotosRaw.split(",");
                const urlImagenDirecta = convertirEnlaceDriveAImagen(fotos[0]);

                $grilla.append(`
                    <div class="col-12 col-md-6 mb-4">
                        <div class="featured-list-card h-100 position-relative border rounded overflow-hidden shadow-sm">
                            <div class="card-image">
                                <img src="${urlImagenDirecta}" alt="${proyecto.titulo}" style="height:230px; object-fit:cover; width:100%;">
                                <span style="white-space: normal !important; width: auto !important; max-width: none !important;">Estado: ${proyecto.estado}</span>
                                <div class="location-gallery">
                                    <div class="location"><i class="bx bx-map-alt"></i> ${proyecto.ciudad}</div>
                                    <div class="gallery"><i class="bx bx-camera"></i> ${fotos[0].trim() !== "" ? fotos.length : 0}</div>
                                </div>
                            </div>
                            <div class="card-body bg-white">
                                <div class="p-3">
                                    <span class="price d-block text-danger fw-bold h5 mb-1">${proyecto.precio_texto}</span>
                                    <h6 class="fw-bold" style="white-space: normal !important; overflow: visible !important; height: auto !important;">
                                        <a href="single.html?id=${proyecto.id}" class="stretched-link text-decoration-none text-dark">${proyecto.titulo}</a>
                                    </h6>
                                    <p class="text-muted small">${(proyecto.descripcion || "").substring(0, 95)}...</p>
                                    <ul class="nav small justify-content-between border-top pt-2 mt-2 list-unstyled">
                                        <li>${proyecto.habitaciones} <i class="bx bx-bed text-muted"></i> Hab.</li>
                                        <li>${proyecto.banos} <i class="bx bx-shower text-muted"></i> Baños</li>
                                        <li>${proyecto.metraje} <i class="bx bx-area text-muted"></i> m²</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>`);
            });
        }
        inyectarFichaTecnicaYWidgets();
    }

    // --- VISTA DETALLE (SINGLE.HTML) ---
    function inyectarFichaTecnicaYWidgets() {
        if ($(".property-info-content").length > 0) {
            const parametrosUrl = new URLSearchParams(window.location.search);
            const idProyectoUrl = parametrosUrl.get('id');
            const proyecto = listaProyectosGlobal.find(p => p.id === idProyectoUrl) || listaProyectosGlobal[0];

            if (proyecto) {
                document.title = `${proyecto.titulo} - CFV Ingenieros`;
                $(".property-info-content h2").text(proyecto.titulo);
                $(".meta-location").html(`<i class="bx bx-map"></i> ${proyecto.direccion_comercial}, ${proyecto.ciudad}, Perú`);
                $(".property-info-content p").first().text(proyecto.descripcion);
                $(".meta-category.bg-orange").text(proyecto.estado);

                const fichaTecnicaHtml = `
                    <ul>
                        <li><label>ID Proyecto:</label> <span>CFV-${proyecto.id.toUpperCase()}</span></li>
                        <li><label>Área:</label> <span>${proyecto.metraje} m²</span></span></li>
                        <li><label>Ambientes:</label> <span>${proyecto.ambientes}</span></li>
                        <li><label>Baños:</label> <span>${proyecto.banos}</span></li>
                        <li><label>Año de Entrega:</label> <span>2026</span></li>
                    </ul>
                    <ul>
                        <li><label>Niveles:</label> <span>${proyecto.niveles}</span></li>
                        <li><label>Dormitorios:</label> <span>${proyecto.habitaciones}</span></li>
                        <li><label>Precio:</label> <span>${proyecto.precio_texto}</span></li>
                        <li><label>Cochera:</label> <span>${proyecto.cochera}</span></li>
                        <li><label>Estado Obra:</label> <span>${proyecto.estado}</span></li>
                    </ul>`;
                $(".property-detail-info-list").html(fichaTecnicaHtml);

                // Galería Slick Dinámica
                const $galeriaSlick = $('.property-gallery');
                if ($galeriaSlick.length > 0) {
                    if ($galeriaSlick.hasClass('slick-initialized')) { $galeriaSlick.slick('unslick'); }
                    $galeriaSlick.empty();
                    const fotos = proyecto.renders_galeria ? proyecto.renders_galeria.split(",") : [];
                    
                    fotos.forEach(fotoUrl => {
                        if (fotoUrl.trim()) {
                            const urlImagenDirecta = convertirEnlaceDriveAImagen(fotoUrl.trim());
                            $galeriaSlick.append(`
                                <a href="${urlImagenDirecta}" data-rel="lightcase:myCollection:slideshow">
                                    <img src="${urlImagenDirecta}" style="height:320px; object-fit:cover; width:100%; padding:4px; border-radius:6px;">
                                </a>`);
                        }
                    });
                    
                    $galeriaSlick.slick({
                        centerMode: true, centerPadding: '60px', arrows: true, slidesToShow: 3, slidesToScroll: 1, prevArrow: $('.prev'), nextArrow: $('.next'),
                        responsive: [{ breakpoint: 576, settings: { slidesToShow: 1, slidesToScroll: 1 } }]
                    });
                    $("a[data-rel]").lightcase();
                }
                inyectarMediaAdicionalSingle(proyecto);
            }
        }
        actualizarSidebarYFormularios();
    }

    function inyectarMediaAdicionalSingle(proyecto) {
        // 1. Actualizar el Mapa
        if (proyecto.mapa_url) {
            $("#mapa-iframe").attr("src", proyecto.mapa_url);
            $("#link-mapa-real").attr("href", proyecto.mapa_url);
        }

        // 2. Actualizar el Brochure
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
                // TRUCO: Creamos un número único basado en la hora actual
                let cacheBuster = new Date().getTime();
                // Se lo pegamos al final de la URL (&t=...) para engañar a la caché de Google
                urlDescarga = `https://drive.google.com/uc?export=download&id=${idArchivo}&t=${cacheBuster}`;
            }
            
            // También forzamos el atributo HTML5 'download' como capa extra de seguridad
            let nombreLimpio = proyecto.titulo ? `Brochure_${proyecto.titulo.replace(/\s+/g, '_')}.pdf` : "Brochure.pdf";
            
            $("#btn-descargar-brochure")
                .attr("href", urlDescarga)
                .attr("download", nombreLimpio)
                .removeAttr("target");
        } else {
            $("#btn-descargar-brochure").closest('.col-12').hide();
        }

        // 3. Amenidades
        if (proyecto.amenidades) {
            const $listaAmenidades = $("#lista-amenidades");
            $listaAmenidades.empty();
            const amenidadesMarcadas = proyecto.amenidades.split(",");
            amenidadesMarcadas.forEach(amenidad => {
                if (amenidad.trim()) {
                    $listaAmenidades.append(`<li class="w-50 float-start mb-2"><i class="bx bx-check-double text-main-color me-2"></i>${amenidad.trim()}</li>`);
                }
            });
        }
    }

    function actualizarSidebarYFormularios() {
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

    // --- FORMULARIO DE COTIZACIÓN VÍA WHATSAPP ---
    $(document).on("submit", "#form-cotizacion-whatsapp", function (e) {
        e.preventDefault();
        const nombre = $("#cotizar-nombre").val();
        const correo = $("#cotizar-correo").val();
        const mensaje = $("#cotizar-mensaje").val();
        const tituloProyecto = $(".property-info-content h2").text() || "un proyecto de CFV";
        const textoMensaje = `Hola CFV Inmobiliaria, mi nombre es *${nombre}* (${correo}). Deseo solicitar una cotización formal y asesoría personalizada sobre el proyecto *${tituloProyecto}*. Mi consulta es: ${mensaje}`;
        
        // Ahora se incluye la variable global con el número de teléfono corporativo
        window.open(`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(textoMensaje)}`, '_blank');
    });

    cargarBaseDeDatos();
});