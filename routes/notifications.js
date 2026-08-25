const express = require("express");
const db = require("../DATABASE/db");

const router = express.Router();


// ======================================================
// OBTENER NOTIFICACIONES
// ======================================================

router.get("/", (req, res) => {

    try {

        if (!req.session.usuarioId) {

            return res.status(401).json({
                ok: false,
                mensaje: "Debes iniciar sesión."
            });
        }


        const notificaciones = db
            .prepare(`
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
            `)
            .all(req.session.usuarioId);


        const noLeidas = db
            .prepare(`
                SELECT COUNT(*) AS total

                FROM notificaciones

                WHERE usuario_id = ?
                  AND leida = 0
            `)
            .get(req.session.usuarioId);


        return res.json({
            ok: true,
            noLeidas: noLeidas.total,
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
                mensaje: "Debes iniciar sesión."
            });
        }


        const id =
            Number(req.params.id);


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
        `)
        .run(
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
                mensaje: "Debes iniciar sesión."
            });
        }


        db.prepare(`
            UPDATE notificaciones

            SET leida = 1

            WHERE usuario_id = ?
        `)
        .run(
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