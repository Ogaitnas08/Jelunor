const express = require("express");
const db = require("../DATABASE/db");

const router = express.Router();


// ======================================================
// UTILIDADES
// ======================================================

function calcularNumeroAportes(meses, frecuencia) {

    if (frecuencia === "daily") {
        return Math.max(1, Math.round(meses * 30));
    }

    if (frecuencia === "weekly") {
        return Math.max(
            1,
            Math.round(meses * (52 / 12))
        );
    }

    return Math.max(1, meses);
}


function textoFrecuencia(frecuencia) {

    if (frecuencia === "daily") {
        return "diaria";
    }

    if (frecuencia === "weekly") {
        return "semanal";
    }

    return "mensual";
}


function enriquecerPlan(plan) {

    if (!plan) {
        return null;
    }

    const meta =
        Number(plan.meta) || 0;

    const ahorrado =
        Number(plan.ahorrado) || 0;

    const faltante =
        Math.max(
            0,
            meta - ahorrado
        );

    const progreso =
        meta > 0
            ? Math.min(
                100,
                (ahorrado / meta) * 100
            )
            : 0;

    return {
        ...plan,
        meta,
        ahorrado,
        faltante,
        aporte:
            Number(plan.aporte) || 0,
        progreso
    };
}


// ======================================================
// OBTENER PLAN ACTUAL
// ======================================================

router.get("/actual", (req, res) => {

    try {

        if (!req.session.usuarioId) {

            return res.status(401).json({
                ok: false,
                mensaje:
                    "Debes iniciar sesión."
            });
        }


        const plan = db.prepare(`
            SELECT
                id,
                nombre,
                meta,
                meses,
                frecuencia,
                aporte,
                numero_aportes,
                ahorrado,
                estado,
                ultimo_recordatorio,
                fecha_creacion

            FROM planes_ahorro

            WHERE usuario_id = ?
              AND estado IN (
                    'activo',
                    'completado'
              )

            ORDER BY id DESC

            LIMIT 1
        `).get(
            req.session.usuarioId
        );


        if (!plan) {

            return res.json({
                ok: true,
                plan: null,
                aportes: []
            });
        }


        const aportes = db.prepare(`
            SELECT
                id,
                monto,
                fecha

            FROM aportes_ahorro

            WHERE plan_id = ?
              AND usuario_id = ?

            ORDER BY fecha DESC, id DESC

            LIMIT 8
        `).all(
            plan.id,
            req.session.usuarioId
        );


        return res.json({
            ok: true,
            plan:
                enriquecerPlan(plan),
            aportes
        });


    } catch (error) {

        console.error(
            "Error obteniendo plan:",
            error
        );

        return res.status(500).json({
            ok: false,
            mensaje:
                "No fue posible cargar el plan."
        });
    }
});


// ======================================================
// CREAR PLAN DE AHORRO
// ======================================================

router.post("/", (req, res) => {

    try {

        if (!req.session.usuarioId) {

            return res.status(401).json({
                ok: false,
                mensaje:
                    "Debes iniciar sesión."
            });
        }


        const nombre =
            String(
                req.body.nombre ||
                "Mi meta de ahorro"
            )
                .trim()
                .slice(0, 80);


        const meta =
            Number(req.body.meta);


        const meses =
            Number(req.body.meses);


        const frecuencia =
            String(
                req.body.frecuencia || ""
            );


        const frecuenciasPermitidas = [
            "daily",
            "weekly",
            "monthly"
        ];


        if (
            !Number.isFinite(meta) ||
            meta < 10000
        ) {

            return res.status(400).json({
                ok: false,
                mensaje:
                    "La meta debe ser de al menos $10.000."
            });
        }


        if (
            !Number.isInteger(meses) ||
            meses < 1 ||
            meses > 120
        ) {

            return res.status(400).json({
                ok: false,
                mensaje:
                    "El plazo debe estar entre 1 y 120 meses."
            });
        }


        if (
            !frecuenciasPermitidas.includes(
                frecuencia
            )
        ) {

            return res.status(400).json({
                ok: false,
                mensaje:
                    "Frecuencia inválida."
            });
        }


        const numeroAportes =
            calcularNumeroAportes(
                meses,
                frecuencia
            );


        const aporte =
            Math.ceil(
                meta / numeroAportes
            );


        const crearPlan =
            db.transaction(() => {

                // Cerrar cualquier plan anterior.

                db.prepare(`
                    UPDATE planes_ahorro

                    SET estado = 'finalizado'

                    WHERE usuario_id = ?
                      AND estado IN (
                            'activo',
                            'completado'
                      )
                `).run(
                    req.session.usuarioId
                );


                const resultado =
                    db.prepare(`
                        INSERT INTO planes_ahorro (
                            usuario_id,
                            nombre,
                            meta,
                            meses,
                            frecuencia,
                            aporte,
                            numero_aportes,
                            ahorrado,
                            estado
                        )

                        VALUES (
                            ?, ?, ?, ?, ?,
                            ?, ?, 0, 'activo'
                        )
                    `).run(
                        req.session.usuarioId,
                        nombre,
                        meta,
                        meses,
                        frecuencia,
                        aporte,
                        numeroAportes
                    );


                db.prepare(`
                    INSERT INTO notificaciones (
                        usuario_id,
                        titulo,
                        mensaje,
                        tipo
                    )

                    VALUES (?, ?, ?, ?)
                `).run(
                    req.session.usuarioId,
                    "🌱 Plan de ahorro creado",
                    `Tu meta "${nombre}" fue creada. Tu aporte recomendado es de ${aporte.toLocaleString("es-CO")} COP con frecuencia ${textoFrecuencia(frecuencia)}.`,
                    "ahorro"
                );


                return resultado;
            });


        const resultado =
            crearPlan();


        const plan =
            db.prepare(`
                SELECT *

                FROM planes_ahorro

                WHERE id = ?
            `).get(
                resultado.lastInsertRowid
            );


        return res.json({
            ok: true,
            mensaje:
                "Plan de ahorro creado correctamente.",
            plan:
                enriquecerPlan(plan),
            aportes: []
        });


    } catch (error) {

        console.error(
            "Error creando plan:",
            error
        );

        return res.status(500).json({
            ok: false,
            mensaje:
                "No fue posible crear el plan."
        });
    }
});


// ======================================================
// REGISTRAR APORTE
// ======================================================

router.post("/:id/aporte", (req, res) => {

    try {

        if (!req.session.usuarioId) {

            return res.status(401).json({
                ok: false,
                mensaje:
                    "Debes iniciar sesión."
            });
        }


        const planId =
            Number(req.params.id);


        const monto =
            Number(req.body.monto);


        if (
            !Number.isInteger(planId)
        ) {

            return res.status(400).json({
                ok: false,
                mensaje:
                    "Plan inválido."
            });
        }


        if (
            !Number.isFinite(monto) ||
            monto <= 0
        ) {

            return res.status(400).json({
                ok: false,
                mensaje:
                    "Ingresa un aporte válido."
            });
        }


        const plan =
            db.prepare(`
                SELECT *

                FROM planes_ahorro

                WHERE id = ?
                  AND usuario_id = ?
                  AND estado = 'activo'
            `).get(
                planId,
                req.session.usuarioId
            );


        if (!plan) {

            return res.status(404).json({
                ok: false,
                mensaje:
                    "No tienes un plan activo con ese identificador."
            });
        }


        const meta =
            Number(plan.meta);


        const ahorrado =
            Number(plan.ahorrado) || 0;


        const faltante =
            Math.max(
                0,
                meta - ahorrado
            );


        if (monto > faltante) {

            return res.status(400).json({
                ok: false,
                mensaje:
                    `El aporte máximo para completar esta meta es ${faltante.toLocaleString("es-CO")} COP.`
            });
        }


        const nuevoAhorrado =
            ahorrado + monto;


        const completado =
            nuevoAhorrado >= meta;


        const registrar =
            db.transaction(() => {

                db.prepare(`
                    INSERT INTO aportes_ahorro (
                        plan_id,
                        usuario_id,
                        monto
                    )

                    VALUES (?, ?, ?)
                `).run(
                    planId,
                    req.session.usuarioId,
                    monto
                );


                db.prepare(`
                    UPDATE planes_ahorro

                    SET
                        ahorrado = ?,
                        estado = ?

                    WHERE id = ?
                      AND usuario_id = ?
                `).run(
                    nuevoAhorrado,
                    completado
                        ? "completado"
                        : "activo",
                    planId,
                    req.session.usuarioId
                );


                db.prepare(`
                    INSERT INTO notificaciones (
                        usuario_id,
                        titulo,
                        mensaje,
                        tipo
                    )

                    VALUES (?, ?, ?, ?)
                `).run(
                    req.session.usuarioId,
                    completado
                        ? "🎉 Meta de ahorro completada"
                        : "💚 Aporte registrado",
                    completado
                        ? `¡Felicitaciones! Completaste tu meta "${plan.nombre}" por ${meta.toLocaleString("es-CO")} COP.`
                        : `Registraste un aporte de ${monto.toLocaleString("es-CO")} COP para tu meta "${plan.nombre}".`,
                    "ahorro"
                );
            });


        registrar();


        const planActualizado =
            db.prepare(`
                SELECT *

                FROM planes_ahorro

                WHERE id = ?
                  AND usuario_id = ?
            `).get(
                planId,
                req.session.usuarioId
            );


        const aportes =
            db.prepare(`
                SELECT
                    id,
                    monto,
                    fecha

                FROM aportes_ahorro

                WHERE plan_id = ?
                  AND usuario_id = ?

                ORDER BY fecha DESC, id DESC

                LIMIT 8
            `).all(
                planId,
                req.session.usuarioId
            );


        return res.json({
            ok: true,

            mensaje:
                completado
                    ? "¡Meta completada!"
                    : "Aporte registrado correctamente.",

            plan:
                enriquecerPlan(
                    planActualizado
                ),

            aportes
        });


    } catch (error) {

        console.error(
            "Error registrando aporte:",
            error
        );

        return res.status(500).json({
            ok: false,
            mensaje:
                "No fue posible registrar el aporte."
        });
    }
});


module.exports = router;