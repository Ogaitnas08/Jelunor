console.log("✅ Jelunor app.js cargado");


// =====================================================
// ELEMENTOS GENERALES
// =====================================================

const loadingView =
    document.getElementById("loadingView");

const guestView =
    document.getElementById("guestView");

const userView =
    document.getElementById("userView");


// =====================================================
// DATOS DE USUARIO
// =====================================================

const userName =
    document.getElementById("userName");

const userInitials =
    document.getElementById("userInitials");

const profileName =
    document.getElementById("profileName");

const profileEmail =
    document.getElementById("profileEmail");

const profileDocument =
    document.getElementById("profileDocument");

const profilePhone =
    document.getElementById("profilePhone");


// =====================================================
// DATOS DE CUENTA
// =====================================================

const balance =
    document.getElementById("balance");

const eyeButton =
    document.getElementById("eyeButton");

const accountNumber =
    document.getElementById("accountNumber");

const accountType =
    document.getElementById("accountType");

const accountNumberDetail =
    document.getElementById(
        "accountNumberDetail"
    );

const accountTypeDetail =
    document.getElementById(
        "accountTypeDetail"
    );


// =====================================================
// MOVIMIENTOS
// =====================================================

const movementsList =
    document.getElementById(
        "movementsList"
    );


// =====================================================
// BOTONES
// =====================================================

const logoutButton =
    document.getElementById(
        "logoutButton"
    );

const transferButton =
    document.getElementById(
        "transferButton"
    );

const rechargeButton =
    document.getElementById(
        "rechargeButton"
    );

const payButton =
    document.getElementById(
        "payButton"
    );

const moreButton =
    document.getElementById(
        "moreButton"
    );

const viewAllButton =
    document.getElementById(
        "viewAllButton"
    );

const mainAction =
    document.getElementById(
        "mainAction"
    );
    const historyCornerButton =
    document.getElementById(
        "historyCornerButton"
    );


// =====================================================
// MODAL RECARGA
// =====================================================

const rechargeModal =
    document.getElementById(
        "rechargeModal"
    );

const rechargeBackdrop =
    document.getElementById(
        "rechargeBackdrop"
    );

const closeRechargeModal =
    document.getElementById(
        "closeRechargeModal"
    );

const rechargeForm =
    document.getElementById(
        "rechargeForm"
    );

const rechargeAmount =
    document.getElementById(
        "rechargeAmount"
    );

const rechargeMessage =
    document.getElementById(
        "rechargeMessage"
    );

const confirmRecharge =
    document.getElementById(
        "confirmRecharge"
    );


// =====================================================
// VARIABLES
// =====================================================

let saldoReal = 0;

let saldoVisible = true;

let usuarioActual = null;

let cuentaActual = null;


// =====================================================
// FORMATEAR DINERO
// =====================================================

function formatearDinero(valor) {

    const numero =
        Number(valor) || 0;

    return new Intl.NumberFormat(
        "es-CO",
        {
            style: "currency",
            currency: "COP",
            maximumFractionDigits: 0
        }
    ).format(numero);
}


// =====================================================
// OCULTAR NÚMERO DE CUENTA
// =====================================================

function ocultarCuenta(numero) {

    if (!numero) {
        return "••••";
    }

    const texto =
        String(numero);

    return `•••• ${texto.slice(-4)}`;
}


// =====================================================
// OBTENER INICIALES
// =====================================================

function obtenerIniciales(nombre) {

    if (!nombre) {
        return "JL";
    }

    const partes =
        nombre
            .trim()
            .split(/\s+/);


    if (partes.length === 1) {

        return partes[0]
            .substring(0, 2)
            .toUpperCase();

    }


    return (
        partes[0][0] +
        partes[1][0]
    ).toUpperCase();
}


// =====================================================
// FORMATEAR FECHA
// =====================================================

function formatearFecha(fecha) {

    if (!fecha) {
        return "";
    }


    let fechaJS =
        new Date(
            String(fecha).replace(
                " ",
                "T"
            )
        );


    if (
        Number.isNaN(
            fechaJS.getTime()
        )
    ) {

        return String(fecha);

    }


    return fechaJS.toLocaleString(
        "es-CO",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


// =====================================================
// MOSTRAR CARGA
// =====================================================

function mostrarCarga() {

    loadingView.classList.remove(
        "hidden"
    );

    guestView.classList.add(
        "hidden"
    );

    userView.classList.add(
        "hidden"
    );
}


// =====================================================
// MOSTRAR INVITADO
// =====================================================

function mostrarInvitado() {

    loadingView.classList.add(
        "hidden"
    );

    userView.classList.add(
        "hidden"
    );

    guestView.classList.remove(
        "hidden"
    );
}


// =====================================================
// MOSTRAR DASHBOARD
// =====================================================

function mostrarDashboard() {

    loadingView.classList.add(
        "hidden"
    );

    guestView.classList.add(
        "hidden"
    );

    userView.classList.remove(
        "hidden"
    );
}


// =====================================================
// DETECTAR INGRESO O SALIDA
// =====================================================

function esIngreso(movimiento) {

    const tipo =
        String(
            movimiento.tipo || ""
        )
            .toLowerCase()
            .trim();


    const ingresos = [
        "ingreso",
        "entrada",
        "recarga",
        "deposito",
        "depósito",
        "transferencia_recibida"
    ];


    const salidas = [
        "salida",
        "egreso",
        "pago",
        "retiro",
        "transferencia_enviada"
    ];


    if (ingresos.includes(tipo)) {
        return true;
    }


    if (salidas.includes(tipo)) {
        return false;
    }


    return Number(
        movimiento.monto
    ) >= 0;
}


// =====================================================
// MOSTRAR MOVIMIENTOS
// =====================================================

function mostrarMovimientos(
    movimientos
) {

    movementsList.innerHTML = "";


    if (
        !Array.isArray(movimientos) ||
        movimientos.length === 0
    ) {

        movementsList.innerHTML = `

            <div class="empty-movements">

                <div class="empty-icon">
                    ↕
                </div>

                <strong>
                    No tienes movimientos todavía
                </strong>

                <p>
                    Cuando utilices tu cuenta,
                    aparecerán aquí.
                </p>

            </div>

        `;

        return;
    }


    movimientos.forEach(
        movimiento => {

            const ingreso =
                esIngreso(movimiento);


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
                "movement movement-animate";


            // ICONO

            const icono =
                document.createElement(
                    "div"
                );


            icono.className =
                ingreso
                    ? "movement-icon incoming"
                    : "movement-icon outgoing";


            icono.textContent =
                ingreso ? "↓" : "↑";


            // INFORMACIÓN

            const info =
                document.createElement(
                    "div"
                );


            info.className =
                "movement-info";


            const concepto =
                document.createElement(
                    "strong"
                );


            concepto.textContent =
                movimiento.concepto ||
                "Movimiento";


            const fecha =
                document.createElement(
                    "span"
                );


            fecha.textContent =
                formatearFecha(
                    movimiento.fecha
                );


            info.appendChild(
                concepto
            );


            info.appendChild(
                fecha
            );


            // MONTO

            const montoElemento =
                document.createElement(
                    "strong"
                );


            montoElemento.className =
                ingreso
                    ? "positive"
                    : "negative";


            montoElemento.textContent =
                `${ingreso ? "+" : "-"} ${formatearDinero(monto)}`;


            // AGREGAR

            articulo.appendChild(
                icono
            );


            articulo.appendChild(
                info
            );


            articulo.appendChild(
                montoElemento
            );


            movementsList.appendChild(
                articulo
            );

        }
    );
}


// =====================================================
// PONER DATOS REALES EN LA PÁGINA
// =====================================================

function cargarDatos(datos) {

    usuarioActual =
        datos.usuario;

    cuentaActual =
        datos.cuenta;


    const nombre =
        datos.usuario?.nombre ||
        "Usuario";


    // NOMBRE

    userName.textContent =
        nombre;


    userInitials.textContent =
        obtenerIniciales(nombre);


    // PERFIL

    profileName.textContent =
        nombre;


    profileEmail.textContent =
        datos.usuario?.correo ||
        "-";


    profileDocument.textContent =
        datos.usuario?.documento ||
        "-";


    profilePhone.textContent =
        datos.usuario?.telefono ||
        "No registrado";


    // SALDO

    saldoReal =
        Number(
            datos.cuenta?.saldo
        ) || 0;


    saldoVisible = true;


    balance.textContent =
        formatearDinero(
            saldoReal
        );


    eyeButton.textContent =
        "◉";


    // TIPO CUENTA

    const tipo =
        datos.cuenta?.tipo ||
        "Ahorros";


    accountType.textContent =
        tipo;


    accountTypeDetail.textContent =
        tipo;


    // NÚMERO CUENTA

    const numero =
        datos.cuenta?.numeroCuenta ||
        "";


    accountNumber.textContent =
        ocultarCuenta(
            numero
        );


    accountNumberDetail.textContent =
        numero || "-";


    // MOVIMIENTOS

    mostrarMovimientos(
        datos.movimientos
    );
}


// =====================================================
// COMPROBAR SESIÓN
// =====================================================

async function comprobarSesion(
    mostrarLoader = true
) {

    if (mostrarLoader) {
        mostrarCarga();
    }


    try {

        console.log(
            "🔎 Comprobando sesión..."
        );


        const respuesta =
            await fetch(
                "/api/auth/me",
                {
                    method: "GET",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        console.log(
            "Estado sesión:",
            respuesta.status
        );


        if (
            respuesta.status === 401
        ) {

            mostrarInvitado();

            return false;
        }


        const datos =
            await respuesta.json();


        console.log(
            "Datos Jelunor:",
            datos
        );


        if (
            !respuesta.ok ||
            !datos.ok ||
            !datos.autenticado
        ) {

            mostrarInvitado();

            return false;
        }


        cargarDatos(datos);

mostrarDashboard();

await cargarNotificaciones();

return true;


    } catch (error) {

        console.error(
            "❌ Error comprobando sesión:",
            error
        );


        mostrarInvitado();

        return false;
    }
}


// =====================================================
// MOSTRAR / OCULTAR SALDO
// =====================================================

if (eyeButton) {

    eyeButton.addEventListener(
        "click",
        () => {

            saldoVisible =
                !saldoVisible;


            if (saldoVisible) {

                balance.textContent =
                    formatearDinero(
                        saldoReal
                    );


                eyeButton.textContent =
                    "◉";

            } else {

                balance.textContent =
                    "$ ••••••••";


                eyeButton.textContent =
                    "○";

            }

        }
    );
}


// =====================================================
// ABRIR RECARGA
// =====================================================

function abrirRecarga() {

    if (!rechargeModal) {

        console.error(
            "No existe rechargeModal"
        );

        return;
    }


    console.log(
        "✅ Abriendo modal de recarga"
    );


    rechargeModal.classList.remove(
        "hidden"
    );


    rechargeAmount.value = "";


    rechargeMessage.textContent = "";


    rechargeMessage.className =
        "operation-message";


    setTimeout(
        () => {

            rechargeAmount.focus();

        },
        150
    );
}


// =====================================================
// CERRAR RECARGA
// =====================================================

function cerrarRecarga() {

    rechargeModal.classList.add(
        "hidden"
    );
}


// =====================================================
// BOTÓN RECARGAR -->
// =====================================================

if (rechargeButton) {

    rechargeButton.addEventListener(
        "click",
        abrirRecarga
    );

}





// =====================================================
// CERRAR MODAL
// =====================================================

if (closeRechargeModal) {

    closeRechargeModal.addEventListener(
        "click",
        cerrarRecarga
    );

}


if (rechargeBackdrop) {

    rechargeBackdrop.addEventListener(
        "click",
        cerrarRecarga
    );

}


// =====================================================
// MONTOS RÁPIDOS
// =====================================================

document
    .querySelectorAll(
        ".quick-amounts button"
    )
    .forEach(
        boton => {

            boton.addEventListener(
                "click",
                () => {

                    rechargeAmount.value =
                        boton.dataset.amount;


                    rechargeAmount.focus();

                }
            );

        }
    );


// =====================================================
// HACER RECARGA REAL
// =====================================================

if (rechargeForm) {

    rechargeForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            rechargeMessage.textContent =
                "";


            rechargeMessage.className =
                "operation-message";


            const monto =
                Number(
                    rechargeAmount.value
                );


            if (
                !Number.isFinite(monto) ||
                monto <= 0 ||
                !Number.isInteger(monto)
            ) {

                rechargeMessage.textContent =
                    "Ingresa un monto válido.";

                rechargeMessage.className =
                    "operation-message error";

                return;
            }


            confirmRecharge.disabled =
                true;


            confirmRecharge.textContent =
                "Procesando...";


            try {

                console.log(
                    "💰 Recargando:",
                    monto
                );


                const respuesta =
                    await fetch(
                        "/api/transactions/recargar",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                monto
                            })
                        }
                    );


                // Si perdió la sesión

                if (
                    respuesta.status === 401
                ) {

                    cerrarRecarga();

                    mostrarInvitado();

                    return;
                }


                const datos =
                    await respuesta.json();


                console.log(
                    "Respuesta recarga:",
                    datos
                );


                if (!respuesta.ok) {

                    rechargeMessage.textContent =
                        datos.mensaje ||
                        "No fue posible realizar la recarga.";


                    rechargeMessage.className =
                        "operation-message error";


                    return;
                }


                // SALDO NUEVO

                saldoReal =
                    Number(
                        datos.saldo
                    ) || 0;


                balance.textContent =
                    formatearDinero(
                        saldoReal
                    );


                saldoVisible =
                    true;


                rechargeMessage.textContent =
                    "¡Recarga realizada correctamente!";


                rechargeMessage.className =
                    "operation-message success";


                // Traer saldo y movimientos
                // nuevamente desde SQLite

                await comprobarSesion(
                    false
                );


                setTimeout(
                    () => {

                        cerrarRecarga();

                    },
                    850
                );


            } catch (error) {

                console.error(
                    "❌ Error haciendo recarga:",
                    error
                );


                rechargeMessage.textContent =
                    "No fue posible conectar con Jelunor.";


                rechargeMessage.className =
                    "operation-message error";


            } finally {

                confirmRecharge.disabled =
                    false;


                confirmRecharge.textContent =
                    "Recargar";

            }

        }
    );
}


// =====================================================
// CERRAR SESIÓN
// =====================================================

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            try {

                const respuesta =
                    await fetch(
                        "/api/auth/logout",
                        {
                            method:
                                "POST"
                        }
                    );


                if (!respuesta.ok) {

                    throw new Error(
                        "No se pudo cerrar la sesión"
                    );

                }


                usuarioActual = null;

                cuentaActual = null;

                saldoReal = 0;


                window.location.href =
                    "/";


            } catch (error) {

                console.error(
                    "Error cerrando sesión:",
                    error
                );

            }

        }
    );
}





// =====================================================
// PAGAR
// =====================================================




// =====================================================
// MÁS
// =====================================================

if (moreButton) {

    moreButton.addEventListener(
        "click",
        () => {

            alert(
                "Próximamente habrá más opciones."
            );

        }
    );
}


// =====================================================
// VER MOVIMIENTOS
// =====================================================

if (viewAllButton) {

    viewAllButton.addEventListener(
        "click",
        () => {

            alert(
                "Después construiremos la pantalla completa de movimientos."
            );

        }
    );
}


// =====================================================
// INICIAR JELUNOR
// =====================================================
// =====================================================
// TRANSFERENCIA
// =====================================================

const transferModal =
    document.getElementById(
        "transferModal"
    );

const transferBackdrop =
    document.getElementById(
        "transferBackdrop"
    );

const closeTransferModal =
    document.getElementById(
        "closeTransferModal"
    );

const transferForm =
    document.getElementById(
        "transferForm"
    );

const transferAccount =
    document.getElementById(
        "transferAccount"
    );

const transferAmount =
    document.getElementById(
        "transferAmount"
    );

const transferMessage =
    document.getElementById(
        "transferMessage"
    );

const confirmTransfer =
    document.getElementById(
        "confirmTransfer"
    );

const transferAvailableBalance =
    document.getElementById(
        "transferAvailableBalance"
    );
    const recipientCard =
    document.getElementById(
        "recipientCard"
    );

const recipientInitials =
    document.getElementById(
        "recipientInitials"
    );

const recipientName =
    document.getElementById(
        "recipientName"
    );

const recipientAccount =
    document.getElementById(
        "recipientAccount"
    );

const recipientSearchMessage =
    document.getElementById(
        "recipientSearchMessage"
    );


let destinatarioVerificado = null;

let temporizadorBusqueda = null;
const notificationButton =
    document.getElementById(
        "notificationButton"
    );

const notificationBadge =
    document.getElementById(
        "notificationBadge"
    );

const notificationPanel =
    document.getElementById(
        "notificationPanel"
    );

const notificationList =
    document.getElementById(
        "notificationList"
    );

const markAllNotifications =
    document.getElementById(
        "markAllNotifications"
    );


// =====================================================
// ABRIR TRANSFERENCIA
// =====================================================

function abrirTransferencia() {

    if (!transferModal) {

        console.error(
            "No existe transferModal"
        );

        return;
    }


    transferAccount.value = "";

    transferAmount.value = "";
    destinatarioVerificado = null;

recipientCard.classList.add(
    "hidden"
);

recipientSearchMessage.textContent =
    "";

confirmTransfer.disabled =
    true;

confirmTransfer.textContent =
    "Verifica la cuenta";

    transferMessage.textContent = "";

    transferMessage.className =
        "operation-message";


    transferAvailableBalance.textContent =
        formatearDinero(
            saldoReal
        );


    transferModal.classList.remove(
        "hidden"
    );


    setTimeout(
        () => {

            transferAccount.focus();

        },
        150
    );
}


// =====================================================
// CERRAR TRANSFERENCIA
// =====================================================

function cerrarTransferencia() {

    transferModal.classList.add(
        "hidden"
    );
}


// =====================================================
// BOTÓN TRANSFERIR
// =====================================================

if (transferButton) {

    transferButton.addEventListener(
        "click",
        abrirTransferencia
    );

}


// =====================================================
// CERRAR
// =====================================================

if (closeTransferModal) {

    closeTransferModal.addEventListener(
        "click",
        cerrarTransferencia
    );

}


if (transferBackdrop) {

    transferBackdrop.addEventListener(
        "click",
        cerrarTransferencia
    );

}


// =====================================================
// SOLO NÚMEROS EN CUENTA
// =====================================================

// =====================================================
// BUSCAR DESTINATARIO
// =====================================================

function limpiarDestinatario() {

    destinatarioVerificado = null;


    recipientCard.classList.add(
        "hidden"
    );


    recipientSearchMessage.textContent =
        "";


    recipientSearchMessage.className =
        "recipient-search-message";


    confirmTransfer.disabled =
        true;


    confirmTransfer.textContent =
        "Verifica la cuenta";
}


async function buscarDestinatario() {

 const numeroCuenta =
    destinatarioVerificado
        ?.numeroCuenta ||
    transferAccount
        .value
        .trim();
    limpiarDestinatario();


    if (!numeroCuenta) {
        return;
    }


    if (numeroCuenta.length < 5) {

        recipientSearchMessage.textContent =
            "Continúa escribiendo el número de cuenta.";

        return;
    }


    recipientSearchMessage.textContent =
        "Buscando cuenta...";


    recipientSearchMessage.className =
        "recipient-search-message loading";


    try {

        const respuesta =
            await fetch(
                "/api/transactions/destinatario",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            numeroCuenta
                        })
                }
            );


        const datos =
            await respuesta.json();


        // El usuario pudo seguir escribiendo
        // mientras esperábamos la respuesta.

        if (
            transferAccount.value.trim()
            !== numeroCuenta
        ) {

            return;
        }


        if (!respuesta.ok) {

            recipientSearchMessage.textContent =
                datos.mensaje ||
                "Cuenta no encontrada.";


            recipientSearchMessage.className =
                "recipient-search-message error";


            return;
        }


        destinatarioVerificado =
            datos.destinatario;


        recipientName.textContent =
            datos.destinatario.nombre;


        recipientAccount.textContent =
            `Cuenta ${datos.destinatario.numeroOculto}`;


        recipientInitials.textContent =
            obtenerIniciales(
                datos.destinatario.nombre
            );


        recipientCard.classList.remove(
            "hidden"
        );


        recipientSearchMessage.textContent =
            "Cuenta Jelunor verificada ✓";


        recipientSearchMessage.className =
            "recipient-search-message";


        confirmTransfer.disabled =
            false;


        confirmTransfer.textContent =
            "Transferir";


    } catch (error) {

        console.error(
            "Error buscando destinatario:",
            error
        );


        recipientSearchMessage.textContent =
            "No pudimos consultar la cuenta.";


        recipientSearchMessage.className =
            "recipient-search-message error";

    }

}


// =====================================================
// ESCRIBIR NÚMERO DE CUENTA
// =====================================================

if (transferAccount) {

    transferAccount.addEventListener(
        "input",
        () => {

            transferAccount.value =
                transferAccount.value
                    .replace(
                        /\D/g,
                        ""
                    );


            limpiarDestinatario();


            clearTimeout(
                temporizadorBusqueda
            );


            if (
                transferAccount.value.length > 0
            ) {

                temporizadorBusqueda =
                    setTimeout(
                        buscarDestinatario,
                        550
                    );

            }

        }
    );

}


// =====================================================
// ENVIAR TRANSFERENCIA
// =====================================================

if (transferForm) {

    transferForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            transferMessage.textContent =
                "";


            transferMessage.className =
                "operation-message";


            const numeroCuenta =
                transferAccount
                    .value
                    .trim();


            const monto =
                Number(
                    transferAmount.value
                );
                if (!destinatarioVerificado) {

    transferMessage.textContent =
        "Primero verifica la cuenta destino.";

    transferMessage.className =
        "operation-message error";

    return;
}


            // ------------------------------------------
            // VALIDACIONES
            // ------------------------------------------

            if (!numeroCuenta) {

                transferMessage.textContent =
                    "Ingresa la cuenta destino.";

                transferMessage.className =
                    "operation-message error";

                return;
            }


            if (
                !Number.isFinite(monto) ||
                monto <= 0 ||
                !Number.isInteger(monto)
            ) {

                transferMessage.textContent =
                    "Ingresa un monto válido.";

                transferMessage.className =
                    "operation-message error";

                return;
            }


            if (monto > saldoReal) {

                transferMessage.textContent =
                    "No tienes saldo suficiente.";

                transferMessage.className =
                    "operation-message error";

                return;
            }


            confirmTransfer.disabled =
                true;


            confirmTransfer.textContent =
                "Procesando...";


            try {

                console.log(
                    "↗ Transferencia:",
                    {
                        numeroCuenta,
                        monto
                    }
                );


                const respuesta =
                    await fetch(
                        "/api/transactions/transferir",
                        {

                            method:
                                "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
                                    numeroCuenta,
                                    monto
                                })

                        }
                    );


                if (
                    respuesta.status === 401
                ) {

                    cerrarTransferencia();

                    mostrarInvitado();

                    return;
                }


                const datos =
                    await respuesta.json();


                console.log(
                    "Respuesta transferencia:",
                    datos
                );


                if (!respuesta.ok) {

                    transferMessage.textContent =
                        datos.mensaje ||
                        "No fue posible realizar la transferencia.";


                    transferMessage.className =
                        "operation-message error";


                    return;
                }


                // ------------------------------------------
                // CORRECTA
                // ------------------------------------------

                saldoReal =
                    Number(
                        datos.saldo
                    ) || 0;


                balance.textContent =
                    formatearDinero(
                        saldoReal
                    );


                transferMessage.textContent =
                    `Transferencia enviada a ${datos.destinatario.nombre}.`;


                transferMessage.className =
                    "operation-message success";


                // Volvemos a consultar SQLite
                // para actualizar movimientos.

                await comprobarSesion(
                    false
                );


                setTimeout(
                    () => {

                        cerrarTransferencia();

                    },
                    1200
                );


            } catch (error) {

                console.error(
                    "❌ Error transferencia:",
                    error
                );


                transferMessage.textContent =
                    "No fue posible conectar con Jelunor.";


                transferMessage.className =
                    "operation-message error";


            } finally {

                confirmTransfer.disabled =
                    false;


                confirmTransfer.textContent =
                    "Continuar";

            }

        }
    );

}

// =====================================================
// NOTIFICACIONES
// =====================================================

function iconoNotificacion(tipo) {

    if (tipo === "recarga") {
        return "+";
    }

    if (
        tipo ===
        "transferencia_enviada"
    ) {
        return "↗";
    }

    if (
        tipo ===
        "transferencia_recibida"
    ) {
        return "↓";
    }
if (tipo === "pago") {
    return "$";
}
    return "🔔";
}


// =====================================================
// MOSTRAR NOTIFICACIONES
// =====================================================

function mostrarNotificaciones(
    notificaciones
) {

    notificationList.innerHTML = "";


    if (
        !Array.isArray(notificaciones) ||
        notificaciones.length === 0
    ) {

        notificationList.innerHTML = `
            <div class="notification-empty">
                No tienes notificaciones.
            </div>
        `;

        return;
    }


    notificaciones.forEach(
        notificacion => {

            const boton =
                document.createElement(
                    "button"
                );


            boton.type = "button";


            boton.className =
                notificacion.leida
                    ? "notification-item"
                    : "notification-item unread";


            const icono =
                document.createElement(
                    "div"
                );


            icono.className =
                "notification-icon";


            icono.textContent =
                iconoNotificacion(
                    notificacion.tipo
                );


            const contenido =
                document.createElement(
                    "div"
                );


            contenido.className =
                "notification-content";


            const titulo =
                document.createElement(
                    "strong"
                );


            titulo.textContent =
                notificacion.titulo;


            const mensaje =
                document.createElement(
                    "p"
                );


            mensaje.textContent =
                notificacion.mensaje;


            const fecha =
                document.createElement(
                    "time"
                );


            fecha.textContent =
                formatearFecha(
                    notificacion.fecha
                );


            contenido.appendChild(
                titulo
            );

            contenido.appendChild(
                mensaje
            );

            contenido.appendChild(
                fecha
            );


            boton.appendChild(
                icono
            );


            boton.appendChild(
                contenido
            );


            if (!notificacion.leida) {

                const punto =
                    document.createElement(
                        "span"
                    );


                punto.className =
                    "notification-dot";


                boton.appendChild(
                    punto
                );

            }


            boton.addEventListener(
                "click",
                async () => {

                    if (
                        Number(
                            notificacion.leida
                        ) === 0
                    ) {

                        await fetch(
                            `/api/notifications/${notificacion.id}/leida`,
                            {
                                method:
                                    "POST"
                            }
                        );


                        await cargarNotificaciones();

                    }

                }
            );


            notificationList.appendChild(
                boton
            );

        }
    );
}


// =====================================================
// CARGAR NOTIFICACIONES DEL SERVIDOR
// =====================================================

async function cargarNotificaciones() {

    try {

        const respuesta =
            await fetch(
                "/api/notifications",
                {
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        if (!respuesta.ok) {

            return;

        }


        const datos =
            await respuesta.json();


        mostrarNotificaciones(
            datos.notificaciones
        );


        const cantidad =
            Number(
                datos.noLeidas
            ) || 0;


        if (cantidad > 0) {

            notificationBadge.textContent =
                cantidad > 99
                    ? "99+"
                    : cantidad;


            notificationBadge.classList.remove(
                "hidden"
            );

        } else {

            notificationBadge.classList.add(
                "hidden"
            );

        }


    } catch (error) {

        console.error(
            "Error cargando notificaciones:",
            error
        );

    }

}


// =====================================================
// ABRIR CAMPANA
// =====================================================

if (notificationButton) {

    notificationButton.addEventListener(
        "click",
        event => {

            event.stopPropagation();


            notificationPanel
                .classList
                .toggle(
                    "hidden"
                );


            if (
                !notificationPanel
                    .classList
                    .contains("hidden")
            ) {

                cargarNotificaciones();

            }

        }
    );

}


// =====================================================
// EVITAR QUE EL PANEL SE CIERRE AL TOCAR DENTRO
// =====================================================

if (notificationPanel) {

    notificationPanel.addEventListener(
        "click",
        event => {

            event.stopPropagation();

        }
    );

}


// =====================================================
// CERRAR AL TOCAR AFUERA
// =====================================================

document.addEventListener(
    "click",
    () => {

        if (notificationPanel) {

            notificationPanel
                .classList
                .add("hidden");

        }

    }
);


// =====================================================
// MARCAR TODAS COMO LEÍDAS
// =====================================================

if (markAllNotifications) {

    markAllNotifications.addEventListener(
        "click",
        async () => {

            try {

                const respuesta =
                    await fetch(
                        "/api/notifications/leer-todas",
                        {
                            method:
                                "POST"
                        }
                    );


                if (respuesta.ok) {

                    await cargarNotificaciones();

                }


            } catch (error) {

                console.error(
                    "Error marcando notificaciones:",
                    error
                );

            }

        }
    );

}
// =====================================================
// PAGAR
// =====================================================

const payModal =
    document.getElementById(
        "payModal"
    );

const payBackdrop =
    document.getElementById(
        "payBackdrop"
    );

const closePayModal =
    document.getElementById(
        "closePayModal"
    );

const payForm =
    document.getElementById(
        "payForm"
    );

const payService =
    document.getElementById(
        "payService"
    );

const payReference =
    document.getElementById(
        "payReference"
    );

const payAmount =
    document.getElementById(
        "payAmount"
    );

const payAvailableBalance =
    document.getElementById(
        "payAvailableBalance"
    );

const payMessage =
    document.getElementById(
        "payMessage"
    );

const confirmPay =
    document.getElementById(
        "confirmPay"
    );


// =====================================================
// ABRIR MODAL PAGO
// =====================================================

function abrirPago() {

    if (!payModal) {

        console.error(
            "No existe payModal"
        );

        return;

    }


    payService.value =
        "";


    payReference.value =
        "";


    payAmount.value =
        "";


    payMessage.textContent =
        "";


    payMessage.className =
        "operation-message";


    payAvailableBalance.textContent =
        formatearDinero(
            saldoReal
        );


    payModal.classList.remove(
        "hidden"
    );


    setTimeout(
        () => {

            payService.focus();

        },
        150
    );
}


// =====================================================
// CERRAR MODAL PAGO
// =====================================================

function cerrarPago() {

    if (payModal) {

        payModal.classList.add(
            "hidden"
        );

    }

}


// =====================================================
// BOTÓN PAGAR
// =====================================================

if (payButton) {

    payButton.addEventListener(
        "click",
        abrirPago
    );

}


// =====================================================
// CERRAR PAGO
// =====================================================

if (closePayModal) {

    closePayModal.addEventListener(
        "click",
        cerrarPago
    );

}


if (payBackdrop) {

    payBackdrop.addEventListener(
        "click",
        cerrarPago
    );

}


// =====================================================
// ENVIAR PAGO
// =====================================================

if (payForm) {

    payForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            payMessage.textContent =
                "";


            payMessage.className =
                "operation-message";


            const servicio =
                payService.value;


            const referencia =
                payReference
                    .value
                    .trim();


            const monto =
                Number(
                    payAmount.value
                );


            // ------------------------------------------
            // VALIDACIONES
            // ------------------------------------------

            if (!servicio) {

                payMessage.textContent =
                    "Selecciona el servicio que deseas pagar.";

                payMessage.className =
                    "operation-message error";

                return;

            }


            if (!referencia) {

                payMessage.textContent =
                    "Ingresa una referencia o número de factura.";

                payMessage.className =
                    "operation-message error";

                return;

            }


            if (
                !Number.isFinite(monto) ||
                monto <= 0 ||
                !Number.isInteger(monto)
            ) {

                payMessage.textContent =
                    "Ingresa un valor válido.";

                payMessage.className =
                    "operation-message error";

                return;

            }


            if (monto > saldoReal) {

                payMessage.textContent =
                    "No tienes saldo suficiente.";

                payMessage.className =
                    "operation-message error";

                return;

            }


            // ------------------------------------------
            // PROCESANDO
            // ------------------------------------------

            confirmPay.disabled =
                true;


            confirmPay.textContent =
                "Procesando...";


            try {

                console.log(
                    "💳 Pago Jelunor:",
                    {
                        servicio,
                        referencia,
                        monto
                    }
                );


                const respuesta =
                    await fetch(
                        "/api/transactions/pagar",
                        {

                            method:
                                "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify({

                                    servicio,
                                    referencia,
                                    monto

                                })

                        }
                    );


                if (
                    respuesta.status === 401
                ) {

                    cerrarPago();

                    mostrarInvitado();

                    return;

                }


                const datos =
                    await respuesta.json();


                console.log(
                    "Respuesta pago:",
                    datos
                );


                if (!respuesta.ok) {

                    payMessage.textContent =
                        datos.mensaje ||
                        "No fue posible realizar el pago.";


                    payMessage.className =
                        "operation-message error";


                    return;

                }


                // ------------------------------------------
                // PAGO CORRECTO
                // ------------------------------------------

                saldoReal =
                    Number(
                        datos.saldo
                    ) || 0;


                saldoVisible =
                    true;


                balance.textContent =
                    formatearDinero(
                        saldoReal
                    );


                eyeButton.textContent =
                    "◉";


                payAvailableBalance.textContent =
                    formatearDinero(
                        saldoReal
                    );


                payMessage.textContent =
                    `✓ Pago realizado. Comprobante ${datos.pago.comprobante}`;


                payMessage.className =
                    "operation-message success";


                // Volver a obtener saldo,
                // movimientos y notificaciones.

                await comprobarSesion(
                    false
                );


                await cargarNotificaciones();


                setTimeout(
                    () => {

                        cerrarPago();

                    },
                    1500
                );


            } catch (error) {

                console.error(
                    "❌ Error realizando pago:",
                    error
                );


                payMessage.textContent =
                    "No fue posible conectar con Jelunor.";


                payMessage.className =
                    "operation-message error";


            } finally {

                confirmPay.disabled =
                    false;


                confirmPay.textContent =
                    "Pagar";

            }

        }
    );

}

// =====================================================
// HISTORIAL DESDE LA ESQUINA
// =====================================================

if (historyCornerButton) {

    historyCornerButton.addEventListener(
        "click",
        () => {

            window.location.href =
                "historial.html";

        }
    );

}

// =====================================================
// NAVEGACIÓN MÓVIL
// =====================================================

const mobileHomeButton =
    document.getElementById(
        "mobileHomeButton"
    );

const mobileMovementsButton =
    document.getElementById(
        "mobileMovementsButton"
    );

const mobileProductsButton =
    document.getElementById(
        "mobileProductsButton"
    );

const mobileProfileButton =
    document.getElementById(
        "mobileProfileButton"
    );

const mobileQuickMenu =
    document.getElementById(
        "mobileQuickMenu"
    );

const mobileQuickBackdrop =
    document.getElementById(
        "mobileQuickBackdrop"
    );

const closeMobileQuickMenu =
    document.getElementById(
        "closeMobileQuickMenu"
    );

const quickTransferButton =
    document.getElementById(
        "quickTransferButton"
    );

const quickRechargeButton =
    document.getElementById(
        "quickRechargeButton"
    );

const quickPayButton =
    document.getElementById(
        "quickPayButton"
    );

const productsSection =
    document.getElementById(
        "productsSection"
    );

const profileSection =
    document.getElementById(
        "profileSection"
    );


// =====================================================
// MARCAR BOTÓN ACTIVO
// =====================================================

function activarNavegacionMovil(
    botonActivo
) {

    document
        .querySelectorAll(
            "#mobileNavigation .nav"
        )
        .forEach(
            boton => {

                boton.classList.remove(
                    "active"
                );

            }
        );


    if (botonActivo) {

        botonActivo.classList.add(
            "active"
        );

    }

}


// =====================================================
// INICIO
// =====================================================

if (mobileHomeButton) {

    mobileHomeButton.addEventListener(
        "click",
        () => {

            activarNavegacionMovil(
                mobileHomeButton
            );

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        }
    );

}


// =====================================================
// MOVIMIENTOS
// =====================================================

if (mobileMovementsButton) {

    mobileMovementsButton.addEventListener(
        "click",
        () => {

            window.location.href =
                "historial.html";

        }
    );

}


// =====================================================
// PRODUCTOS
// =====================================================

if (mobileProductsButton) {

    mobileProductsButton.addEventListener(
        "click",
        () => {

            activarNavegacionMovil(
                mobileProductsButton
            );


            if (productsSection) {

                productsSection.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });


                productsSection.classList.add(
                    "mobile-section-highlight"
                );


                setTimeout(
                    () => {

                        productsSection.classList.remove(
                            "mobile-section-highlight"
                        );

                    },
                    1200
                );

            }

        }
    );

}


// =====================================================
// PERFIL
// =====================================================

if (mobileProfileButton) {

    mobileProfileButton.addEventListener(
        "click",
        () => {

            activarNavegacionMovil(
                mobileProfileButton
            );


            if (profileSection) {

                profileSection.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });


                profileSection.classList.add(
                    "mobile-section-highlight"
                );


                setTimeout(
                    () => {

                        profileSection.classList.remove(
                            "mobile-section-highlight"
                        );

                    },
                    1200
                );

            }

        }
    );

}


// =====================================================
// MENÚ DEL BOTÓN +
// =====================================================

function abrirMenuRapido() {

    if (!mobileQuickMenu) {
        return;
    }

    mobileQuickMenu.classList.remove(
        "hidden"
    );

    document.body.classList.add(
        "mobile-menu-open"
    );

}


function cerrarMenuRapido() {

    if (!mobileQuickMenu) {
        return;
    }

    mobileQuickMenu.classList.add(
        "hidden"
    );

    document.body.classList.remove(
        "mobile-menu-open"
    );

}


if (mainAction) {

    mainAction.addEventListener(
        "click",
        abrirMenuRapido
    );

}


if (closeMobileQuickMenu) {

    closeMobileQuickMenu.addEventListener(
        "click",
        cerrarMenuRapido
    );

}


if (mobileQuickBackdrop) {

    mobileQuickBackdrop.addEventListener(
        "click",
        cerrarMenuRapido
    );

}


// =====================================================
// OPERACIONES DEL +
// =====================================================

if (quickTransferButton) {

    quickTransferButton.addEventListener(
        "click",
        () => {

            cerrarMenuRapido();

            abrirTransferencia();

        }
    );

}


if (quickRechargeButton) {

    quickRechargeButton.addEventListener(
        "click",
        () => {

            cerrarMenuRapido();

            abrirRecarga();

        }
    );

}


if (quickPayButton) {

    quickPayButton.addEventListener(
        "click",
        () => {

            cerrarMenuRapido();

            abrirPago();

        }
    );

}

comprobarSesion();