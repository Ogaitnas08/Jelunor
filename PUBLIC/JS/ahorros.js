console.log(
    "✅ Ahorro programado Jelunor cargado"
);


let planActualId = null;


// =====================================================
// FORMATO COP
// =====================================================

function formatearCOP(valor) {

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
// FORMATEAR FECHA
// =====================================================

function formatearFecha(fecha) {

    if (!fecha) {
        return "";
    }


    const valor =
        new Date(
            String(fecha)
                .replace(
                    " ",
                    "T"
                )
        );


    if (
        Number.isNaN(
            valor.getTime()
        )
    ) {
        return fecha;
    }


    return valor.toLocaleString(
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
// ELEMENTOS SIMULADOR
// =====================================================

const savingName =
    document.getElementById(
        "savingName"
    );

const savingGoal =
    document.getElementById(
        "savingGoal"
    );

const savingTime =
    document.getElementById(
        "savingTime"
    );

const savingFrequency =
    document.getElementById(
        "savingFrequency"
    );

const savingRequired =
    document.getElementById(
        "savingRequired"
    );

const savingFrequencyText =
    document.getElementById(
        "savingFrequencyText"
    );

const savingGoalResult =
    document.getElementById(
        "savingGoalResult"
    );

const savingDurationResult =
    document.getElementById(
        "savingDurationResult"
    );

const savingContributions =
    document.getElementById(
        "savingContributions"
    );

const savingFinalGoal =
    document.getElementById(
        "savingFinalGoal"
    );


// =====================================================
// GUARDAR PLAN
// =====================================================

const savePlanButton =
    document.getElementById(
        "savePlanButton"
    );

const planMessage =
    document.getElementById(
        "planMessage"
    );


// =====================================================
// PLAN ACTUAL
// =====================================================

const currentPlanSection =
    document.getElementById(
        "currentPlanSection"
    );

const currentPlanName =
    document.getElementById(
        "currentPlanName"
    );

const currentPlanStatus =
    document.getElementById(
        "currentPlanStatus"
    );

const currentPlanGoal =
    document.getElementById(
        "currentPlanGoal"
    );

const currentPlanSaved =
    document.getElementById(
        "currentPlanSaved"
    );

const currentPlanRemaining =
    document.getElementById(
        "currentPlanRemaining"
    );

const currentPlanContribution =
    document.getElementById(
        "currentPlanContribution"
    );

const currentPlanFrequency =
    document.getElementById(
        "currentPlanFrequency"
    );

const currentPlanProgress =
    document.getElementById(
        "currentPlanProgress"
    );

const currentPlanProgressBar =
    document.getElementById(
        "currentPlanProgressBar"
    );


// =====================================================
// APORTE
// =====================================================

const contributionBox =
    document.getElementById(
        "contributionBox"
    );

const contributionAmount =
    document.getElementById(
        "contributionAmount"
    );

const registerContributionButton =
    document.getElementById(
        "registerContributionButton"
    );

const contributionMessage =
    document.getElementById(
        "contributionMessage"
    );

const contributionList =
    document.getElementById(
        "contributionList"
    );


// =====================================================
// NÚMERO DE APORTES
// =====================================================

function obtenerNumeroAportes(
    meses,
    frecuencia
) {

    if (frecuencia === "daily") {

        return Math.max(
            1,
            Math.round(
                meses * 30
            )
        );
    }


    if (frecuencia === "weekly") {

        return Math.max(
            1,
            Math.round(
                meses *
                (52 / 12)
            )
        );
    }


    return Math.max(
        1,
        meses
    );
}


// =====================================================
// FRECUENCIA
// =====================================================

function textoFrecuencia(
    frecuencia
) {

    if (frecuencia === "daily") {
        return "cada día";
    }


    if (frecuencia === "weekly") {
        return "cada semana";
    }


    return "cada mes";
}


function nombreFrecuencia(
    frecuencia
) {

    if (frecuencia === "daily") {
        return "Diaria";
    }


    if (frecuencia === "weekly") {
        return "Semanal";
    }


    return "Mensual";
}


// =====================================================
// CALCULAR PLAN
// =====================================================

function calcularAhorro() {

    let meta =
        Number(
            savingGoal.value
        );


    let meses =
        Number(
            savingTime.value
        );


    const frecuencia =
        savingFrequency.value;


    if (
        !Number.isFinite(meta) ||
        meta < 10000
    ) {
        meta = 10000;
    }


    if (
        !Number.isFinite(meses) ||
        meses < 1
    ) {
        meses = 1;
    }


    if (meses > 120) {
        meses = 120;
    }


    const numeroAportes =
        obtenerNumeroAportes(
            meses,
            frecuencia
        );


    const aporte =
        Math.ceil(
            meta /
            numeroAportes
        );


    savingRequired.textContent =
        formatearCOP(aporte);


    savingFrequencyText.textContent =
        textoFrecuencia(
            frecuencia
        );


    savingGoalResult.textContent =
        formatearCOP(meta);


    savingDurationResult.textContent =
        `${meses} meses`;


    savingContributions.textContent =
        numeroAportes;


    savingFinalGoal.textContent =
        formatearCOP(meta);
}


// =====================================================
// MOSTRAR APORTES
// =====================================================

function mostrarAportes(aportes) {

    contributionList.innerHTML =
        "";


    if (
        !Array.isArray(aportes) ||
        aportes.length === 0
    ) {

        contributionList.innerHTML = `
            <p class="empty-contributions">
                Aún no has registrado aportes.
            </p>
        `;

        return;
    }


    aportes.forEach(
        aporte => {

            const articulo =
                document.createElement(
                    "article"
                );


            articulo.className =
                "contribution-item";


            articulo.innerHTML = `
                <div class="contribution-item-info">
                    <strong>
                        Aporte registrado
                    </strong>

                    <span>
                        ${formatearFecha(aporte.fecha)}
                    </span>
                </div>

                <span class="contribution-value">
                    + ${formatearCOP(aporte.monto)}
                </span>
            `;


            contributionList.appendChild(
                articulo
            );
        }
    );
}


// =====================================================
// MOSTRAR PLAN
// =====================================================

function mostrarPlanActual(
    plan,
    aportes = []
) {

    if (!plan) {

        planActualId =
            null;


        currentPlanSection.classList.add(
            "hidden"
        );

        return;
    }


    planActualId =
        Number(plan.id);


    currentPlanSection.classList.remove(
        "hidden"
    );


    currentPlanName.textContent =
        plan.nombre;


    currentPlanGoal.textContent =
        formatearCOP(
            plan.meta
        );


    currentPlanSaved.textContent =
        formatearCOP(
            plan.ahorrado
        );


    currentPlanRemaining.textContent =
        formatearCOP(
            plan.faltante
        );


    currentPlanContribution.textContent =
        formatearCOP(
            plan.aporte
        );


    currentPlanFrequency.textContent =
        nombreFrecuencia(
            plan.frecuencia
        );


    const progreso =
        Math.max(
            0,
            Math.min(
                100,
                Number(
                    plan.progreso
                ) || 0
            )
        );


    currentPlanProgress.textContent =
        `${progreso.toFixed(0)} %`;


    currentPlanProgressBar.style.width =
        `${progreso}%`;


    const completado =
        plan.estado ===
        "completado";


    currentPlanStatus.textContent =
        completado
            ? "Meta completada"
            : "Activo";


    currentPlanStatus.classList.toggle(
        "completed",
        completado
    );


    if (completado) {

        contributionBox.classList.add(
            "hidden"
        );

    } else {

        contributionBox.classList.remove(
            "hidden"
        );


        contributionAmount.value =
            Math.min(
                Number(plan.aporte),
                Number(plan.faltante)
            );
    }


    mostrarAportes(
        aportes
    );
}


// =====================================================
// CARGAR PLAN
// =====================================================

async function cargarPlanActual() {

    try {

        const respuesta =
            await fetch(
                "/api/savings/actual"
            );


        if (
            respuesta.status === 401
        ) {

            currentPlanSection.classList.add(
                "hidden"
            );

            return;
        }


        const datos =
            await respuesta.json();


        if (
            respuesta.ok &&
            datos.ok
        ) {

            mostrarPlanActual(
                datos.plan,
                datos.aportes
            );
        }


    } catch (error) {

        console.error(
            "Error cargando plan:",
            error
        );
    }
}


// =====================================================
// GUARDAR PLAN
// =====================================================

async function guardarPlan() {

    planMessage.textContent =
        "";

    planMessage.className =
        "plan-message";


    const nombre =
        savingName.value.trim() ||
        "Mi meta de ahorro";


    const meta =
        Number(
            savingGoal.value
        );


    const meses =
        Number(
            savingTime.value
        );


    const frecuencia =
        savingFrequency.value;


    if (
        !Number.isFinite(meta) ||
        meta < 10000
    ) {

        planMessage.textContent =
            "Ingresa una meta válida.";

        planMessage.classList.add(
            "error"
        );

        return;
    }


    if (
        !Number.isInteger(meses) ||
        meses < 1 ||
        meses > 120
    ) {

        planMessage.textContent =
            "Ingresa un plazo entre 1 y 120 meses.";

        planMessage.classList.add(
            "error"
        );

        return;
    }


    savePlanButton.disabled =
        true;


    savePlanButton.textContent =
        "Guardando...";


    try {

        const respuesta =
            await fetch(
                "/api/savings",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            nombre,
                            meta,
                            meses,
                            frecuencia
                        })
                }
            );


        const datos =
            await respuesta.json();


        if (
            respuesta.status === 401
        ) {

            planMessage.innerHTML =
                `Debes iniciar sesión.
                <a href="login.html">Entrar</a>`;

            planMessage.classList.add(
                "error"
            );

            return;
        }


        if (
            !respuesta.ok ||
            !datos.ok
        ) {

            throw new Error(
                datos.mensaje ||
                "No fue posible crear el plan."
            );
        }


        planMessage.textContent =
            "✅ Tu plan de ahorro fue creado.";


        planMessage.classList.add(
            "success"
        );


        mostrarPlanActual(
            datos.plan,
            datos.aportes
        );


    } catch (error) {

        console.error(
            error
        );


        planMessage.textContent =
            error.message ||
            "No fue posible guardar el plan.";


        planMessage.classList.add(
            "error"
        );


    } finally {

        savePlanButton.disabled =
            false;


        savePlanButton.textContent =
            "Crear mi plan de ahorro";
    }
}


// =====================================================
// REGISTRAR APORTE
// =====================================================

async function registrarAporte() {

    contributionMessage.textContent =
        "";

    contributionMessage.className =
        "plan-message";


    const monto =
        Number(
            contributionAmount.value
        );


    if (
        !planActualId ||
        !Number.isFinite(monto) ||
        monto <= 0
    ) {

        contributionMessage.textContent =
            "Ingresa un monto válido.";

        contributionMessage.classList.add(
            "error"
        );

        return;
    }


    registerContributionButton.disabled =
        true;


    registerContributionButton.textContent =
        "Registrando...";


    try {

        const respuesta =
            await fetch(
                `/api/savings/${planActualId}/aporte`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            monto
                        })
                }
            );


        const datos =
            await respuesta.json();


        if (
            !respuesta.ok ||
            !datos.ok
        ) {

            throw new Error(
                datos.mensaje ||
                "No fue posible registrar el aporte."
            );
        }


        contributionMessage.textContent =
            datos.mensaje;


        contributionMessage.classList.add(
            "success"
        );


        mostrarPlanActual(
            datos.plan,
            datos.aportes
        );


    } catch (error) {

        console.error(
            error
        );


        contributionMessage.textContent =
            error.message ||
            "No fue posible registrar el aporte.";


        contributionMessage.classList.add(
            "error"
        );


    } finally {

        registerContributionButton.disabled =
            false;


        registerContributionButton.textContent =
            "Registrar aporte";
    }
}


// =====================================================
// ACTIVAR NOTIFICACIONES AUTOMÁTICAS
// =====================================================

async function activarNotificaciones() {

    try {

        /*
            Al consultar las notificaciones,
            el servidor comprobará:

            - consejo del día
            - recordatorio de ahorro
        */

        await fetch(
            "/api/notifications"
        );


    } catch (error) {

        console.error(
            "Error activando notificaciones:",
            error
        );
    }
}


// =====================================================
// EVENTOS
// =====================================================

savingGoal.addEventListener(
    "input",
    calcularAhorro
);


savingTime.addEventListener(
    "input",
    calcularAhorro
);


savingFrequency.addEventListener(
    "change",
    calcularAhorro
);


savePlanButton.addEventListener(
    "click",
    guardarPlan
);


registerContributionButton.addEventListener(
    "click",
    registrarAporte
);


// =====================================================
// INICIAR
// =====================================================

calcularAhorro();

cargarPlanActual();

activarNotificaciones();