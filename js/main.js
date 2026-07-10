$(function () {
    "use strict";

    $("section.about-us-area").on("mousemove", function (e) {
        $("section.about-us-area img:nth-child(1)").css({
            transform: `translateX(${e.clientX / 50}px) translateY(${e.clientY / 50}px)`
        })
        $("section.about-us-area img:nth-child(2)").css({
            transform: `translateX(${e.clientX / 20}px) translateY(${e.clientY / 20}px)`
        })
    });


    // SEGURO DE CONTROL: Evita que Owl Carousel colapse el navegador si hay menos tarjetas de las esperadas
    if ($('.featured-carousel').length > 0) {
        $('.featured-carousel').owlCarousel({
            loop: true,
            margin: 10,
            responsiveClass: true,
            autoplay: true,
            autoplayTimeout: 5000,       // MODIFICACIÓN: Espera 5 segundos quieto antes de avanzar
            autoplaySpeed: 1100,         // MODIFICACIÓN: Deslizamiento suave de 1.1 segundos
            autoplayHoverPause: true,    // MODIFICACIÓN: Se congela si el usuario pone el mouse encima
            dots: true,
            navText: [
                "<i class='bx bx-left-arrow-alt' ></i>", "<i class='bx bx-right-arrow-alt' ></i>"
            ],
            responsive: {
                0: {
                    items: 1,
                    nav: true
                },
                600: {
                    items: 3,
                    nav: false
                },
                1000: {
                    items: 3,
                    nav: true,
                    loop: true
                }
            }
        });
    }
    // SEGURO DE CONTROL: Evita que el scroll colapse matemáticamente en páginas que se acortaron verticalmente
    if ($(".odometer").length > 0) {
        $(window).on("scroll", function(e) {
            if ($(this).scrollTop() > 700) {
                $(".odometer").each(function () {
                    $(this).html($(this).attr("data-value"));
                });
            }
        });
    }

    // SEGURO DE CONTROL: Evita que el carrusel de testimonios rompa la carga si no se encuentra en la vista actual
    if ($(".testimonial-area .owl-carousel").length > 0) {
        $(".testimonial-area .owl-carousel").owlCarousel({
            loop: true,
            margin: 10,
            responsiveClass: true,
            autoplay: true,
            autoplayTimeout: 5000,       // MODIFICACIÓN: Sincronizado a 5 segundos también para testimonios
            autoplayHoverPause: true,
            dots: true,
            navText: [
                "<i class='bx bx-left-arrow-alt' ></i>", "<i class='bx bx-right-arrow-alt' ></i>"
            ],
            responsive: {
                0: {
                    items: 1,
                    nav: true
                },
                600: {
                    items: 3,
                    nav: false
                },
                1000: {
                    items: 1,
                    nav: true,
                    loop: true
                }
            }
        });
    }

    // SEGURO DE CONTROL: Inicializa selectores estilizados solo si existen en la página
    if ($("select").length > 0) {
        $("select").niceSelect();
    }
    // SEGURO DE CONTROL: Blindaje del deslizador de precios (Si estás en index.html se salta esta línea en lugar de crashear)
    if ($("#price-range").length > 0) {
        $("#price-range").slider({
            step: 500,
            range: true,
            min: 0,
            max: 300000,
            values:[0, 30000],
            slide: function (event, ui) { $("#priceRange").val(ui.values[0] + " - " + ui.values[1]); }
        });

        $("#priceRange").val($("#price-range").slider("values", 0) + " - " + $("#price-range").slider("values", 1));
    }

    // SEGURO DE CONTROL: Evita fallas en la galería de fotos detalladas de single.html
    if ($('.property-gallery').length > 0) {
        $('.property-gallery').slick({
            centerMode: true,
            centerPadding: '60px',
            arrows: true,
            slidesToShow: 3,
            slidesToScroll: 1,
            prevArrow: $('.prev'),
            nextArrow: $('.next'),
            responsive: [
                {
                    breakpoint: 576,
                    settings: {
                        slidesToShow: 1,
                        slidesToScroll: 1
                    }
                },
            ]
        });
    }

    if ($('.popular-slider').length > 0) {
        $('.popular-slider').slick({
            centerMode: true,
            centerPadding: '60px',
            slidesToShow: 1,
            dots: true,
        });
    }

    $("a[data-rel]").lightcase();

    $("[data-bs-toggle='tooltip']").tooltip();

    $(window).on("mousemove", function (e) {
        $(".cursor").css({
            left: `${e.clientX}px`,
            top: `${e.clientY}px`,
        })
    });
    // =========================================================================
    // INTEGRACIÓN DE GOOGLE SHEETS EN VIVO - CFV INMOBILIARIA
    // =========================================================================
    const API_SHEET_URL = "https://google.com";
    let listaProyectosGlobal = [];

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
        const lineas = texto.split("\n");
        const resultado = [];
        if (lineas.length <= 1) return resultado;
        const encabezados = lineas[0].split(",").map(h => h.trim().replace(/"/g, ''));

        for (let i = 1; i < lineas.length; i++) {
            if (!lineas[i].trim()) continue;
            const celdas = lineas[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lineas[i].split(",");
            const objeto = {};
            encabezados.forEach((encabezado, index) => {
                let valor = celdas[index] ? celdas[index].trim() : "";
                if (valor.startsWith('"') && valor.endsWith('"')) { valor = valor.substring(1, valor.length - 1); }
                objeto[encabezado] = valor;
            });
            resultado.push(objeto);
        }
        return resultado;
    }
    function inyectarDatosEnPantallas() {
        // A. LÓGICA PORTADA (INDEX.HTML)
        if ($('.featured-carousel').length > 0) {
            const $carrusel = $('.featured-carousel');
            if ($carrusel.hasClass('owl-loaded')) { $carrusel.owlCarousel('destroy'); }
            $carrusel.empty();

            listaProyectosGlobal.forEach(proyecto => {
                const fotos = proyecto.renders_galeria ? proyecto.renders_galeria.split(",") : ["images/image-4.jpg"];
                const fotoPrincipal = fotos[0].trim();
                $carrusel.append(`
                    <div class="featured-list-card h-100 position-relative"> 
                        <div class="card-image">
                            <img src="${fotoPrincipal}" alt="${proyecto.titulo}" style="height:250px; object-fit:cover; width:100%;">
                            <span>${proyecto.estado}</span>
                            <div class="location-gallery">
                                <div class="location"><i class="bx bx-map-alt"></i> ${proyecto.ciudad}</div>
                                <div class="gallery"><i class="bx bx-camera"></i> ${fotos.length}</div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="p-4 pt-0">
                                <span class="price">${proyecto.precio_texto}</span>
                                <h6><a href="single.html?id=${proyecto.id}" class="stretched-link">${proyecto.titulo}</a></h6>
                                <p>${proyecto.descripcion.substring(0, 110)}...</p>
                                <ul class="nav">
                                    <li class="border-end pe-3 me-3"><span class="d-block">${proyecto.habitaciones} <i class="bx bx-bed"></i></span>Habitaciones</li>
                                    <li class="border-end pe-3 me-3"><span class="d-block">${proyecto.banos} <i class="bx bx-shower"></i></span>Baños</li>
                                    <li><span class="d-block">${proyecto.metraje} <i class="bx bx-area"></i></span>M²</li>
                                </ul>
                            </div>
                            <div class="align-items-center d-flex estate-agents justify-content-between pt-4 bg-light p-3">
                                <div class="d-flex">
                                    <div class="flex-shrink-0 me-3"><img src="images/service_icon_1.png" class="rounded-circle" width="48" height="48" alt="Asesor"></div>
                                    <div class="flex-grow-1"><span class="fw-semibold d-block">Asesor Comercial</span><small class="text-muted">Contacto Directo</small></div>
                                </div>
                                <div class="card-actions position-relative" style="z-index: 5;">
                                    <a href="https://wa.me{encodeURIComponent(proyecto.titulo)}." target="_blank" class="btn btn-sm btn-success rounded-circle d-flex align-items-center justify-content-center p-0" style="width:35px; height:35px; background-color:#25D366; border:none;"><i class="bx bxl-whatsapp fs-5 text-white"></i></a>
                                </div>
                            </div>
                        </div>
                    </div>`);
            });

            $carrusel.owlCarousel({
                loop: listaProyectosGlobal.length > 3, margin: 10, responsiveClass: true, autoplay: true, autoplayTimeout: 5000, autoplaySpeed: 1100, autoplayHoverPause: true, dots: true,
                navText: ["<i class='bx bx-left-arrow-alt' ></i>", "<i class='bx bx-right-arrow-alt' ></i>"],
                responsive: { 0: { items: 1, nav: true }, 600: { items: 3, nav: false }, 1000: { items: 3, nav: true, loop: true } }
            });
        }

        // B. LÓGICA CATÁLOGO (SEARCH.HTML)
        if ($(".filter-results-area").length > 0) {
            const $grilla = $(".filter-results-area .row"); $grilla.empty();
            $("#total-proyectos-conteo").text(listaProyectosGlobal.length);
            listaProyectosGlobal.forEach(proyecto => {
                const fotos = proyecto.renders_galeria ? proyecto.renders_galeria.split(",") : ["images/image-4.jpg"];
                const fotoPrincipal = fotos[0].trim();
                $grilla.append(`
                    <div class="col-12 col-md-6 mb-4">
                        <div class="featured-list-card h-100 position-relative border rounded overflow-hidden shadow-sm"> 
                            <div class="card-image">
                                <img src="${fotoPrincipal}" alt="${proyecto.titulo}" style="height:230px; object-fit:cover; width:100%;">
                                <span>${proyecto.estado}</span>
                                <div class="location-gallery">
                                    <div class="location"><i class="bx bx-map-alt"></i> ${proyecto.ciudad}</div>
                                    <div class="gallery"><i class="bx bx-camera"></i> ${fotos.length}</div>
                                </div>
                            </div>
                            <div class="card-body bg-white">
                                <div class="p-3">
                                    <span class="price d-block text-danger fw-bold h5 mb-1">${proyecto.precio_texto}</span>
                                    <h6 class="fw-bold"><a href="single.html?id=${proyecto.id}" class="stretched-link text-decoration-none text-dark">${proyecto.titulo}</a></h6>
                                    <p class="text-muted small">${proyecto.descripcion.substring(0, 95)}...</p>
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
    function inyectarFichaTecnicaYWidgets() {
        // C. LÓGICA DETALLES (SINGLE.HTML)
        if ($(".property-info-content").length > 0) {
            const parametrosUrl = new URLSearchParams(window.location.search);
            const idProyectoUrl = parametrosUrl.get('id');
            const proyecto = listaProyectosGlobal.find(p => p.id === idProyectoUrl) || listaProyectosGlobal[0];

            if (proyecto) {
                document.title = `${proyecto.titulo} - CFV Ingenieros`;
                $(".property-info-content h2").text(proyecto.titulo);
                $(".meta-location").html(`<i class="bx bx-map"></i> ${proyecto.direccion_completa}, ${proyecto.ciudad}, Perú`);
                $(".property-info-content p").first().text(proyecto.descripcion);
                $(".meta-category.bg-orange").text(proyecto.estado);

                const fichaTecnicaHtml = `
                    <ul>
                        <li><label>ID Proyecto:</label> <span>CFV-${proyecto.id.toUpperCase()}</span></li>
                        <li><label>Área Construida:</label> <span>${proyecto.metraje}</span></li>
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

                const $galeriaSlick = $('.property-gallery');
                if ($galeriaSlick.length > 0) {
                    if ($galeriaSlick.hasClass('slick-initialized')) { $galeriaSlick.slick('unslick'); }
                    $galeriaSlick.empty();
                    const fotos = proyecto.renders_galeria ? proyecto.renders_galeria.split(",") : [];
                    fotos.forEach(fotoUrl => {
                        if (fotoUrl.trim()) {
                            $galeriaSlick.append(`<a href="${fotoUrl.trim()}" data-rel="lightcase:myCollection:slideshow"><img src="${fotoUrl.trim()}" style="height:320px; object-fit:cover; width:100%; padding:4px; border-radius:6px;"></a>`);
                        }
                    });
                    $('.property-gallery').slick({
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
        if (proyecto.mapa_url) {
            $(".mapa-contenedor-dinamico").remove();
            $(".property-info-content").append(`<div class="mapa-contenedor-dinamico"><h6 class="section-title mt-5">Ubicación del Proyecto</h6><div class="ratio ratio-21x9 rounded overflow-hidden shadow-sm border mb-4" style="height: 350px;"><iframe src="${proyecto.mapa_url}" style="border:0; width:100%; height:100%;" allowfullscreen="" loading="lazy"></iframe></div></div>`);
        }
        if (proyecto.brochure_pdf) {
            $(".brochure-contenedor-dinamico").remove();
            $(".property-info-content").append(`<div class="brochure-contenedor-dinamico mt-4 p-4 border rounded bg-light d-flex align-items-center justify-content-between"><div><h6 class="fw-bold mb-1">Dossier Técnico Comercial Oficial</h6><small class="text-muted">Descarga los planos de arquitectura.</small></div><a href="${proyecto.brochure_pdf}" target="_blank" class="btn btn-danger btn-sm px-4 fw-semibold"><i class="bx bx-file-pdf me-2"></i>Descargar Brochure</a></div>`);
        }
        if (proyecto.amenidades) {
            const $listaAmenidades = $("#lista-amenidades"); $listaAmenidades.empty();
            const amenidadesMarcadas = proyecto.amenidades.split(",");
            amenidadesMarcadas.forEach(amenidad => {
                if (amenidad.trim()) { $listaAmenidades.append(`<li class="w-50 float-start mb-2"><i class="bx bx-check-double text-main-color me-2"></i>${amenidad.trim()}</li>`); }
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
    $(document).on("submit", "#form-cotizacion-whatsapp", function (e) {
        e.preventDefault();
        const nombre = $("#cotizar-nombre").val();
        const correo = $("#cotizar-correo").val();
        const mensaje = $("#cotizar-mensaje").val();
        const tituloProyecto = $(".property-info-content h2").text() || "un proyecto de CFV";
        const textoMensaje = `Hola CFV Inmobiliaria, mi nombre es *${nombre}* (${correo}). Deseo solicitar una cotización formal y asesoría personalizada sobre el proyecto *${tituloProyecto}*. Mi consulta es: ${mensaje}`;
        window.open(`https://wa.me{encodeURIComponent(textoMensaje)}`, '_blank');
    });

    // ENCENDER EL MOTOR DE DATOS EN LA NUBE DE GOOGLE SHEETS AL ABRIR LA WEB
    cargarBaseDeDatos();
});
