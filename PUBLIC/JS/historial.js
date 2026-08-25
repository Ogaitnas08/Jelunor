console.log(
    "✅ Historial Jelunor cargado"
);


// =====================================================
// ELEMENTOS
// =====================================================

const historyLoading =
    document.getElementById(
        "historyLoading"
    );

const historyApp =
    document.getElementById(
        "historyApp"
    );

const historyBalance =
    document.getElementById(
        "historyBalance"
    );

const historySearch =
    document.getElementById(
        "historySearch"
    );

const historyList =
    document.getElementById(
        "historyList"
    );

const historyResults =
    document.getElementById(
        "historyResults"
    );


// =====================================================
// VARIABLES
// =====================================================

let movimientos = [];

let filtroActual =
    "todos";


// =====================================================
// DINERO
// =====================================================

function formatearDinero(valor) {

    return new Intl.NumberFormat(
        "es-CO",
        {
            style: "currency",
            currency: "COP",
            maximumFractionDigits: 0
        }
    ).format(
        Number(valor) || 0
    );

}


// =====================================================
// CONVERTIR FECHA SQLITE
// =====================================================

function convertirFecha(valor) {

    if (!valor) {
        return null;
    }


    const texto =
        String(valor).trim();


    let fecha;


    // SQLite CURRENT_TIMESTAMP
    // normalmente viene en UTC.

    if (
        /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/
            .test(texto)
    ) {

        fecha =
            new Date(
                texto.replace(
                    " ",
                    "T"
                ) + "Z"
            );

    } else {

        fecha =
            new Date(texto);

    }


    if (
        Number.isNaN(
            fecha.getTime()
        )
    ) {

        return null;

    }


    return fecha;
}


// =====================================================
// FECHA DEL MOVIMIENTO
// =====================================================

function formatearHora(fecha) {

    const fechaJS =
        convertirFecha(fecha);


    if (!fechaJS) {
        return "";
    }


    return fechaJS.toLocaleTimeString(
        "es-CO",
        {
            hour: "numeric",
            minute: "2-digit"
        }
    );

}


// =====================================================
// COMPARAR DÍAS
// =====================================================

function mismoDia(
    fechaA,
    fechaB
) {

    return (
        fechaA.getFullYear() ===
            fechaB.getFullYear() &&

        fechaA.getMonth() ===
            fechaB.getMonth() &&

        fechaA.getDate() ===
            fechaB.getDate()
    );

}


// =====================================================
// NOMBRE DEL GRUPO
// =====================================================

function obtenerNombreDia(fecha) {

    const fechaJS =
        convertirFecha(fecha);


    if (!fechaJS) {
        return "Otros";
    }


    const hoy =
        new Date();


    const ayer =
        new Date();


    ayer.setDate(
        ayer.getDate() - 1
    );


    if (
        mismoDia(
            fechaJS,
            hoy
        )
    ) {

        return "Hoy";

    }


    if (
        mismoDia(
            fechaJS,
            ayer
        )
    ) {

        return "Ayer";

    }


    const texto =
        fechaJS.toLocaleDateString(
            "es-CO",
            {
                weekday: "long",
                day: "numeric",
                month: "long"
            }
        );


    return (
        texto.charAt(0).toUpperCase() +
        texto.slice(1)
    );

}


// =====================================================
// CLAVE DEL DÍA
// =====================================================

function obtenerClaveDia(fecha) {

    const fechaJS =
        convertirFecha(fecha);


    if (!fechaJS) {
        return "otros";
    }


    return [
        fechaJS.getFullYear(),
        String(
            fechaJS.getMonth() + 1
        ).padStart(2, "0"),
        String(
            fechaJS.getDate()
        ).padStart(2, "0")
    ].join("-");

}


// =====================================================
// ENTRADA O SALIDA
// =====================================================

function esEntrada(movimiento) {

    const tipo =
        String(
            movimiento.tipo || ""
        )
            .trim()
            .toLowerCase();


    const entradas = [
        "recarga",
        "ingreso",
        "entrada",
        "transferencia_recibida"
    ];


    const salidas = [
        "pago",
        "salida",
        "egreso",
        "retiro",
        "transferencia_enviada"
    ];


    if (
        entradas.includes(tipo)
    ) {

        return true;

    }


    if (
        salidas.includes(tipo)
    ) {

        return false;

    }


    return Number(
        movimiento.monto
    ) >= 0;
}


// =====================================================
// ICONO
// =====================================================

function obtenerIcono(tipo) {

    const texto =
        String(
            tipo || ""
        ).toLowerCase();


    if (
        texto === "recarga"
    ) {

        return "+";

    }


    if (
        texto ===
        "transferencia_recibida"
    ) {

        return "↓";

    }


    if (
        texto ===
        "transferencia_enviada"
    ) {

        return "↗";

    }


    if (
        texto === "pago"
    ) {

        return "$";

    }


    return "↕";
}


// =====================================================
// SUBTÍTULO
// =====================================================

function obtenerSubtitulo(
    movimiento
) {

    const tipo =
        String(
            movimiento.tipo || ""
        )
            .toLowerCase();


    if (
        tipo === "recarga"
    ) {

        return "Recarga";

    }


    if (
        tipo ===
        "transferencia_recibida"
    ) {

        return "Transferencia recibida";

    }


    if (
        tipo ===
        "transferencia_enviada"
    ) {

        return "Transferencia enviada";

    }


    if (
        tipo === "pago"
    ) {

        return "Pago";

    }


    return "Movimiento";
}


// =====================================================
// FILTROS
// =====================================================

function obtenerFiltrados() {

    const busqueda =
        historySearch
            .value
            .trim()
            .toLowerCase();


    return movimientos.filter(
        movimiento => {

            const tipo =
                String(
                    movimiento.tipo || ""
                ).toLowerCase();


            const concepto =
                String(
                    movimiento.concepto || ""
                ).toLowerCase();


            const entrada =
                esEntrada(
                    movimiento
                );


            let coincideFiltro =
                true;


            if (
                filtroActual ===
                "entradas"
            ) {

                coincideFiltro =
                    entrada;

            }


            if (
                filtroActual ===
                "salidas"
            ) {

                coincideFiltro =
                    !entrada;

            }


            if (
                filtroActual ===
                "recarga"
            ) {

                coincideFiltro =
                    tipo ===
                    "recarga";

            }


            if (
                filtroActual ===
                "transferencia"
            ) {

                coincideFiltro =
                    tipo.includes(
                        "transferencia"
                    );

            }


            if (
                filtroActual ===
                "pago"
            ) {

                coincideFiltro =
                    tipo ===
                    "pago";

            }


            const coincideBusqueda =
                !busqueda ||
                concepto.includes(
                    busqueda
                ) ||
                tipo.includes(
                    busqueda
                );


            return (
                coincideFiltro &&
                coincideBusqueda
            );

        }
    );

}


// =====================================================
// CREAR MOVIMIENTO
// =====================================================

function crearMovimiento(
    movimiento
) {

    const entrada =
        esEntrada(
            movimiento
        );


    const monto =
        Math.abs(
            Number(
                movimiento.monto
            ) || 0
        );


    const articulo =
        document.createElement(
            "article"
        );


    articulo.className =
        "history-wallet-item";


    // ICONO

    const icono =
        document.createElement(
            "div"
        );


    icono.className =
        entrada
            ? "history-wallet-icon incoming"
            : "history-wallet-icon outgoing";


    icono.textContent =
        obtenerIcono(
            movimiento.tipo
        );


    // INFORMACIÓN

    const informacion =
        document.createElement(
            "div"
        );


    informacion.className =
        "history-wallet-info";


    const concepto =
        document.createElement(
            "strong"
        );


    concepto.textContent =
        movimiento.concepto ||
        "Movimiento Jelunor";


    const meta =
        document.createElement(
            "div"
        );


    meta.className =
        "history-wallet-meta";


    const tipo =
        document.createElement(
            "span"
        );


    tipo.textContent =
        obtenerSubtitulo(
            movimiento
        );


    const separador =
        document.createElement(
            "span"
        );


    separador.textContent =
        "•";


    const hora =
        document.createElement(
            "span"
        );


    hora.textContent =
        formatearHora(
            movimiento.fecha
        );


    meta.appendChild(
        tipo
    );


    meta.appendChild(
        separador
    );


    meta.appendChild(
        hora
    );


    informacion.appendChild(
        concepto
    );


    informacion.appendChild(
        meta
    );


    // MONTO

    const cantidad =
        document.createElement(
            "strong"
        );


    cantidad.className =
        entrada
            ? "history-wallet-amount positive"
            : "history-wallet-amount negative";


    cantidad.textContent =
        `${entrada ? "+" : "-"}${formatearDinero(monto)}`;


    articulo.appendChild(
        icono
    );


    articulo.appendChild(
        informacion
    );


    articulo.appendChild(
        cantidad
    );


    return articulo;
}


// =====================================================
// RENDERIZAR
// =====================================================

function renderHistorial() {

    const filtrados =
        obtenerFiltrados();


    historyList.innerHTML =
        "";


    historyResults.textContent =
        `${filtrados.length} ${
            filtrados.length === 1
                ? "movimiento"
                : "movimientos"
        }`;


    if (
        filtrados.length === 0
    ) {

        historyList.innerHTML = `

            <div class="history-wallet-empty">

                <div>
                    ↕
                </div>

                <strong>
                    No encontramos movimientos
                </strong>

                <p>
                    Prueba otra búsqueda o cambia el filtro.
                </p>

            </div>

        `;


        return;

    }


    const grupos =
        new Map();


    filtrados.forEach(
        movimiento => {

            const clave =
                obtenerClaveDia(
                    movimiento.fecha
                );


            if (
                !grupos.has(clave)
            ) {

                grupos.set(
                    clave,
                    {
                        titulo:
                            obtenerNombreDia(
                                movimiento.fecha
                            ),

                        movimientos: []
                    }
                );

            }


            grupos
                .get(clave)
                .movimientos
                .push(
                    movimiento
                );

        }
    );


    grupos.forEach(
        grupo => {

            const seccion =
                document.createElement(
                    "section"
                );


            seccion.className =
                "history-day-group";


            const titulo =
                document.createElement(
                    "h2"
                );


            titulo.textContent =
                grupo.titulo;


            const lista =
                document.createElement(
                    "div"
                );


            lista.className =
                "history-day-list";


            grupo.movimientos.forEach(
                movimiento => {

                    lista.appendChild(
                        crearMovimiento(
                            movimiento
                        )
                    );

                }
            );


            seccion.appendChild(
                titulo
            );


            seccion.appendChild(
                lista
            );


            historyList.appendChild(
                seccion
            );

        }
    );

}


// =====================================================
// CARGAR DESDE SQLITE
// =====================================================

async function cargarHistorial() {

    try {

        const respuesta =
            await fetch(
                "/api/transactions/historial",
                {
                    method: "GET",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        if (
            respuesta.status === 401
        ) {

            window.location.href =
                "login.html";

            return;

        }


        const datos =
            await respuesta.json();


        if (
            !respuesta.ok ||
            !datos.ok
        ) {

            throw new Error(
                datos.mensaje ||
                "No se pudo cargar el historial."
            );

        }


        movimientos =
            datos.movimientos || [];


        historyBalance.textContent =
            formatearDinero(
                datos.cuenta?.saldo || 0
            );


        renderHistorial();


        historyLoading.classList.add(
            "hidden"
        );


        historyApp.classList.remove(
            "hidden"
        );


    } catch (error) {

        console.error(
            "❌ Error cargando historial:",
            error
        );


        historyLoading.innerHTML = `

            <div class="history-new-loading-content">

                <strong>
                    No pudimos cargar tus movimientos
                </strong>

                <a href="/">
                    Volver al inicio
                </a>

            </div>

        `;

    }

}


// =====================================================
// BUSCADOR
// =====================================================

if (historySearch) {

    historySearch.addEventListener(
        "input",
        renderHistorial
    );

}


// =====================================================
// FILTROS
// =====================================================

document
    .querySelectorAll(
        ".history-new-filter"
    )
    .forEach(
        boton => {

            boton.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".history-new-filter"
                        )
                        .forEach(
                            item => {

                                item.classList.remove(
                                    "active"
                                );

                            }
                        );


                    boton.classList.add(
                        "active"
                    );


                    filtroActual =
                        boton.dataset.filter;


                    renderHistorial();

                }
            );

        }
    );


// =====================================================
// INICIAR
// =====================================================

cargarHistorial();