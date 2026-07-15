$(function () {
    "use strict";

    function renderizarExperiencia360() {
        const $contenedor = $("#contenedor-experiencia-360");
        
        if ($contenedor.length === 0) return;
        if (!window.listaProyectosGlobal || window.listaProyectosGlobal.length === 0) return;

        const idProyectoUrl = new URLSearchParams(window.location.search).get('id');
        const proyecto = window.listaProyectosGlobal.find(p => p.id === idProyectoUrl) || window.listaProyectosGlobal[0];

        if (proyecto && proyecto.tressesenta && proyecto.tressesenta.trim() !== "") {
            const url360 = proyecto.tressesenta.trim();
            
            // EL SECRETO ESTÁ AQUÍ: Le pusimos 'col-12' para que Bootstrap sepa que es una caja ordenada
            $contenedor.html(`
                <div class="col-12 mt-4 mb-4">
                    <h4 class="mb-3"><i class="bx bx-cube-alt" style="color: #eb3c3c;"></i> Experiencia 360°</h4>
                    
                    <div style="position: relative; width: 100%; height: 450px; border-radius: 12px; overflow: hidden; border: 1px solid #ddd; background: #f8f9fa;">
                        <iframe 
                            src="${url360}" 
                            scrolling="no"
                            allowfullscreen="true" 
                            allow="accelerometer; gyroscope; magnetometer; xr-spatial-tracking"
                            loading="lazy"
                            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; display: block;">
                        </iframe>
                    </div>
                </div>
            `);
        } else {
            $contenedor.empty();
        }
    }

    $(document).on("datos:cargados", renderizarExperiencia360);

    if (window.listaProyectosGlobal && window.listaProyectosGlobal.length > 0) {
        renderizarExperiencia360();
    }
});