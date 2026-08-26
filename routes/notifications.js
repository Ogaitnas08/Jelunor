const express = require("express");
const db = require("../DATABASE/db");

const router = express.Router();


// ======================================================
// FECHA COLOMBIA
// ======================================================

function fechaColombia() {

    return new Intl.DateTimeFormat(
        "en-CA",
        {
            timeZone:
                "America/Bogota",

            year:
                "numeric",

            month:
                "2-digit",

            day:
                "2-digit"
        }
    ).format(
        new Date()
    );
}


// ======================================================
// DÍAS ENTRE FECHAS YYYY-MM-DD
// ======================================================

function diasEntre(
    fechaInicial,
    fechaFinal
) {

    const inicio =
        new Date(
            `${fechaInicial}T00:00:00Z`
        );

    const final =
        new Date(
            `${fechaFinal}T00:00:00Z`
        );

    return Math.floor(
        (
            final - inicio
        ) /
        86400000
    );
}


// ======================================================
// CONSEJOS JELUNOR
// ======================================================

const consejos = [

    "Antes de gastar, separa primero una parte de tus ingresos para tu ahorro.",

    "Llevar un registro de tus gastos pequeños puede ayudarte a descubrir oportunidades de ahorro.",

    "Si tus ingresos cambian según la temporada, prepara una reserva para los meses de menor producción.",

    "Define una meta concreta. Ahorrar para un objetivo específico suele facilitar la disciplina financiera.",

    "Antes de solicitar un crédito, calcula si la cuota cabe cómodamente dentro de tus ingresos mensuales.",

    "Evita utilizar todo un ingreso extraordinario. Reservar una parte puede ayudarte frente a imprevistos.",

    "En actividades agropecuarias, separar los gastos personales de los gastos productivos ayuda a organizar mejor las finanzas.",

    "Pequeños aportes constantes pueden ser más sostenibles que intentar ahorrar grandes cantidades de manera ocasional.",

    "Antes de una nueva temporada productiva, identifica cuáles serán tus principales costos y prepara un presupuesto.",

    "Compara tus ingresos y gastos al finalizar cada mes para saber si tu planificación financiera está funcionando.",

    "Un fondo para emergencias puede reducir la necesidad de utilizar crédito ante gastos inesperados.",

    "Cuando termines de pagar una obligación, considera destinar parte de esa antigua cuota a una meta de ahorro."
];


// ======================================================
// CREAR CONSEJO DEL DÍA
// ======================================================

function asegurarConsejoDiario(
    usuarioId
) {

    const hoy =
        fechaColombia();


    const existente =
        db.prepare(`
            SELECT id

            FROM notificaciones

            WHERE usuario_id = ?
              AND tipo = 'consejo'
              AND date(fecha, '-5 hours') = ?

            LIMIT 1
        `).get(
            usuarioId,
            hoy
        );


    if (existente) {
        return;
    }


    const numeroDia =
        Math.floor(
            Date.now() /
            86400000
        );


    const consejo =
        consejos[
            numeroDia %
            consejos.length
        ];


    db.prepare(`
        INSERT INTO notificaciones (
            usuario_id,
            titulo,
            mensaje,
            tipo
        )

        VALUES (?, ?, ?, ?)
    `).run(
        usuarioId,
        "🌱 Consejo Jelunor",
        consejo,
        "consejo"
    );
}


// ======================================================
// RECORDATORIO DE AHORRO
// ======================================================

function asegurarRecordatorioAhorro(
    usuarioId
) {

    const plan =
        db.prepare(`
            SELECT *

            FROM planes_ahorro

            WHERE usuario_id = ?
              AND estado = 'activo'

            ORDER BY id DESC

            LIMIT 1
        `).get(
            usuarioId
        );


    if (!plan) {
        return;
    }


    const hoy =
        fechaColombia();


    const ultimo =
        plan.ultimo_recordatorio;


    let debeRecordar =
        false;


    if (!ultimo) {

        debeRecordar = true;

    } else {

        const dias =
            diasEntre(
                ultimo,
                hoy
            );


        if (
            plan.frecuencia ===
            "daily"
        ) {

            debeRecordar =
                dias >= 1;

        } else if (
            plan.frecuencia ===
            "weekly"
        ) {

            debeRecordar =
                dias >= 7;

        } else {

            debeRecordar =
                ultimo.slice(0, 7) !==
                hoy.slice(0, 7);
        }
    }


    if (!debeRecordar) {
        return;
    }


    let frecuenciaTexto =
        "mensual";


    if (
        plan.frecuencia ===
        "daily"
    ) {
        frecuenciaTexto =
            "diario";
    }


    if (
        plan.frecuencia ===
        "weekly"
    ) {
        frecuenciaTexto =
            "semanal";
    }


    db.transaction(() => {

        db.prepare(`
            INSERT INTO notificaciones (
                usuario_id,
                titulo,
                mensaje,
                tipo
            )

            VALUES (?, ?, ?, ?)
        `).run(
            usuarioId,
            "🔔 Recordatorio de ahorro",
            `Hoy corresponde tu aporte ${frecuenciaTexto} de aproximadamente ${Number(plan.aporte).toLocaleString("es-CO")} COP para tu meta "${plan.nombre}".`,
            "ahorro"
        );


        db.prepare(`
            UPDATE planes_ahorro

            SET ultimo_recordatorio = ?

            WHERE id = ?
        `).run(
            hoy,
            plan.id
        );

    })();
}


// ======================================================
// OBTENER NOTIFICACIONES
// ======================================================

router.get("/", (req, res) => {

    try {

        if (!req.session.usuarioId) {

            return res.status(401).json({
                ok: false,
                mensaje:
                    "Debes iniciar sesión."
            });
        }


        // Crear contenido automático.

        asegurarConsejoDiario(
            req.session.usuarioId
        );


        asegurarRecordatorioAhorro(
            req.session.usuarioId
        );


        const notificaciones =
            db.prepare(`
                SELECT
                    id,
                    titulo,
                    mensaje,
                    tipo,
                    leida,
                    fecha

                FROM notificaciones

                WHERE usuario_id = ?

                ORDER BY fecha DESC, id DESC

                LIMIT 30
            `).all(
                req.session.usuarioId
            );


        const noLeidas =
            db.prepare(`
                SELECT
                    COUNT(*) AS total

                FROM notificaciones

                WHERE usuario_id = ?
                  AND leida = 0
            `).get(
                req.session.usuarioId
            );


        return res.json({
            ok: true,
            noLeidas:
                noLeidas.total,
            notificaciones
        });


    } catch (error) {

        console.error(
            "Error obteniendo notificaciones:",
            error
        );

        return res.status(500).json({
            ok: false,
            mensaje:
                "No fue posible cargar las notificaciones."
        });
    }
});


// ======================================================
// MARCAR UNA COMO LEÍDA
// ======================================================

router.post("/:id/leida", (req, res) => {

    try {

        if (!req.session.usuarioId) {

            return res.status(401).json({
                ok: false,
                mensaje:
                    "Debes iniciar sesión."
            });
        }


        const id =
            Number(
                req.params.id
            );


        if (!Number.isInteger(id)) {

            return res.status(400).json({
                ok: false,
                mensaje:
                    "Notificación inválida."
            });
        }


        db.prepare(`
            UPDATE notificaciones

            SET leida = 1

            WHERE id = ?
              AND usuario_id = ?
        `).run(
            id,
            req.session.usuarioId
        );


        return res.json({
            ok: true
        });


    } catch (error) {

        console.error(
            "Error marcando notificación:",
            error
        );

        return res.status(500).json({
            ok: false,
            mensaje:
                "No fue posible actualizar la notificación."
        });
    }
});


// ======================================================
// MARCAR TODAS COMO LEÍDAS
// ======================================================

router.post("/leer-todas", (req, res) => {

    try {

        if (!req.session.usuarioId) {

            return res.status(401).json({
                ok: false,
                mensaje:
                    "Debes iniciar sesión."
            });
        }


        db.prepare(`
            UPDATE notificaciones

            SET leida = 1

            WHERE usuario_id = ?
        `).run(
            req.session.usuarioId
        );


        return res.json({
            ok: true
        });


    } catch (error) {

        console.error(
            "Error leyendo notificaciones:",
            error
        );

        return res.status(500).json({
            ok: false,
            mensaje:
                "No fue posible actualizar las notificaciones."
        });
    }
});


module.exports = router;