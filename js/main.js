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
});
