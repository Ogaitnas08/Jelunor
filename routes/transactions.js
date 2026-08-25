const express = require("express");
const db = require("../DATABASE/db");

const router = express.Router();
function crearNotificacion(
    usuarioId,
    titulo,
    mensaje,
    tipo = "info"
) {

    db.prepare(`
        INSERT INTO notificaciones (
            usuario_id,
            titulo,
            mensaje,
            tipo
        )

        VALUES (?, ?, ?, ?)
    `)
    .run(
        usuarioId,
        titulo,
        mensaje,
        tipo
    );
}


// ======================================================
// FUNCIÓN: OCULTAR CUENTA
// ======================================================

function ocultarCuenta(numero) {

    const texto = String(numero || "");

    return `•••• ${texto.slice(-4)}`;
}


// ======================================================
// RECARGAR SALDO
// ======================================================

router.post("/recargar", (req, res) => {

    try {

        if (!req.session.usuarioId) {

            return res.status(401).json({
                ok: false,
                mensaje: "Debes iniciar sesión."
            });
        }


        const monto = Number(req.body.monto);


        if (
            !Number.isFinite(monto) ||
            monto <= 0 ||
            !Number.isInteger(monto)
        ) {

            return res.status(400).json({
                ok: false,
                mensaje: "Ingresa un monto válido."
            });
        }


        if (monto > 100000000) {

            return res.status(400).json({
                ok: false,
                mensaje:
                    "El monto máximo de recarga es $100.000.000."
            });
        }


        const cuenta = db
            .prepare(`
                SELECT
                    id,
                    saldo,
                    numero_cuenta

                FROM cuentas

                WHERE usuario_id = ?
            `)
            .get(req.session.usuarioId);


        if (!cuenta) {

            return res.status(404).json({
                ok: false,
                mensaje:
                    "No se encontró tu cuenta Jelunor."
            });
        }


        const hacerRecarga =
            db.transaction(() => {

                db.prepare(`
                    UPDATE cuentas

                    SET saldo = saldo + ?

                    WHERE id = ?
                `)
                .run(
                    monto,
                    cuenta.id
                );


                db.prepare(`
                    INSERT INTO movimientos (
                        cuenta_id,
                        tipo,
                        concepto,
                        monto
                    )

                    VALUES (?, ?, ?, ?)
                `)
                .run(
                    cuenta.id,
                    "recarga",
                    "Recarga de saldo",
                    monto
                );


                return db
                    .prepare(`
                        SELECT saldo

                        FROM cuentas

                        WHERE id = ?
                    `)
                    .get(cuenta.id);

            });


        const resultado =
            hacerRecarga();


        return res.json({
            ok: true,

            mensaje:
                "Recarga realizada correctamente.",

            saldo:
                resultado.saldo
        });


    } catch (error) {

        console.error(
            "Error realizando recarga:",
            error
        );


        return res.status(500).json({
            ok: false,

            mensaje:
                "No fue posible realizar la recarga."
        });

    }

});


// ======================================================
// TRANSFERIR ENTRE CUENTAS JELUNOR
// ======================================================

router.post("/transferir", (req, res) => {

    try {

        // ----------------------------------------------
        // VALIDAR SESIÓN
        // ----------------------------------------------

        if (!req.session.usuarioId) {

            return res.status(401).json({
                ok: false,
                mensaje:
                    "Debes iniciar sesión."
            });
        }


        const numeroDestino =
            String(
                req.body.numeroCuenta || ""
            )
            .trim();


        const monto =
            Number(req.body.monto);


        // ----------------------------------------------
        // VALIDAR CUENTA
        // ----------------------------------------------

        if (!numeroDestino) {

            return res.status(400).json({
                ok: false,
                mensaje:
                    "Ingresa el número de cuenta destino."
            });
        }


        // ----------------------------------------------
        // VALIDAR MONTO
        // ----------------------------------------------

        if (
            !Number.isFinite(monto) ||
            monto <= 0 ||
            !Number.isInteger(monto)
        ) {

            return res.status(400).json({
                ok: false,
                mensaje:
                    "Ingresa un monto válido."
            });
        }


        if (monto > 100000000) {

            return res.status(400).json({
                ok: false,
                mensaje:
                    "El monto máximo permitido es $100.000.000."
            });
        }


        // ----------------------------------------------
        // BUSCAR CUENTA ORIGEN
        // ----------------------------------------------

        const origen = db
            .prepare(`
                SELECT
                    c.id,
                    c.usuario_id,
                    c.numero_cuenta,
                    c.saldo,
                    u.nombre

                FROM cuentas c

                INNER JOIN usuarios u
                    ON u.id = c.usuario_id

                WHERE c.usuario_id = ?
            `)
            .get(req.session.usuarioId);


        if (!origen) {

            return res.status(404).json({
                ok: false,
                mensaje:
                    "No se encontró tu cuenta Jelunor."
            });
        }


        // ----------------------------------------------
        // BUSCAR CUENTA DESTINO
        // ----------------------------------------------

        const destino = db
            .prepare(`
                SELECT
                    c.id,
                    c.usuario_id,
                    c.numero_cuenta,
                    c.saldo,
                    u.nombre

                FROM cuentas c

                INNER JOIN usuarios u
                    ON u.id = c.usuario_id

                WHERE c.numero_cuenta = ?
            `)
            .get(numeroDestino);


        if (!destino) {

            return res.status(404).json({
                ok: false,
                mensaje:
                    "La cuenta destino no existe."
            });
        }


        // ----------------------------------------------
        // NO TRANSFERIRSE A SÍ MISMO
        // ----------------------------------------------

        if (origen.id === destino.id) {

            return res.status(400).json({
                ok: false,
                mensaje:
                    "No puedes transferirte a tu misma cuenta."
            });
        }


        // ----------------------------------------------
        // VALIDAR SALDO
        // ----------------------------------------------

        if (Number(origen.saldo) < monto) {

            return res.status(400).json({
                ok: false,
                mensaje:
                    "No tienes saldo suficiente."
            });
        }


        // ==================================================
        // TRANSACCIÓN SQLITE
        // ==================================================

        const realizarTransferencia =
            db.transaction(() => {

                // RESTAR AL ORIGEN
                const descuento = db
                    .prepare(`
                        UPDATE cuentas

                        SET saldo = saldo - ?

                        WHERE id = ?
                          AND saldo >= ?
                    `)
                    .run(
                        monto,
                        origen.id,
                        monto
                    );


                if (descuento.changes !== 1) {

                    throw new Error(
                        "SALDO_INSUFICIENTE"
                    );
                }


                // SUMAR AL DESTINO
                db.prepare(`
                    UPDATE cuentas

                    SET saldo = saldo + ?

                    WHERE id = ?
                `)
                .run(
                    monto,
                    destino.id
                );


                // MOVIMIENTO ORIGEN
                db.prepare(`
                    INSERT INTO movimientos (
                        cuenta_id,
                        tipo,
                        concepto,
                        monto
                    )

                    VALUES (?, ?, ?, ?)
                `)
                .run(
                    origen.id,
                    "transferencia_enviada",

                    `Transferencia a ${ocultarCuenta(
                        destino.numero_cuenta
                    )}`,

                    -monto
                );

                crearNotificacion(
    req.session.usuarioId,

    "Recarga recibida",

    `Recargaste $${monto.toLocaleString("es-CO")} en tu cuenta Jelunor.`,

    "recarga"
);
crearNotificacion(
    origen.usuario_id,

    "Transferencia enviada",

    `Enviaste $${monto.toLocaleString("es-CO")} a ${destino.nombre}.`,

    "transferencia_enviada"
);


crearNotificacion(
    destino.usuario_id,

    "Dinero recibido",

    `Recibiste $${monto.toLocaleString("es-CO")} de ${origen.nombre}.`,

    "transferencia_recibida"
);


                // MOVIMIENTO DESTINO
                db.prepare(`
                    INSERT INTO movimientos (
                        cuenta_id,
                        tipo,
                        concepto,
                        monto
                    )

                    VALUES (?, ?, ?, ?)
                `)
                .run(
                    destino.id,
                    "transferencia_recibida",

                    `Transferencia de ${ocultarCuenta(
                        origen.numero_cuenta
                    )}`,

                    monto
                );


                // NUEVO SALDO
                const cuentaActualizada = db
                    .prepare(`
                        SELECT saldo

                        FROM cuentas

                        WHERE id = ?
                    `)
                    .get(origen.id);


                return cuentaActualizada;

            });


        let resultado;


        try {

            resultado =
                realizarTransferencia();

        } catch (error) {

            if (
                error.message ===
                "SALDO_INSUFICIENTE"
            ) {

                return res.status(400).json({
                    ok: false,
                    mensaje:
                        "No tienes saldo suficiente."
                });

            }

            throw error;
        }


        return res.json({

            ok: true,

            mensaje:
                "Transferencia realizada correctamente.",

            saldo:
                resultado.saldo,

            destinatario: {
                nombre:
                    destino.nombre,

                numeroCuenta:
                    ocultarCuenta(
                        destino.numero_cuenta
                    )
            }

        });


    } catch (error) {

        console.error(
            "Error realizando transferencia:",
            error
        );


        return res.status(500).json({
            ok: false,

            mensaje:
                "No fue posible realizar la transferencia."
        });

    }

});

// ======================================================
// CONSULTAR DESTINATARIO
// ======================================================

router.post("/destinatario", (req, res) => {

    try {

        // Verificar sesión
        if (!req.session.usuarioId) {

            return res.status(401).json({
                ok: false,
                mensaje: "Debes iniciar sesión."
            });
        }


        const numeroCuenta =
            String(
                req.body.numeroCuenta || ""
            ).trim();


        if (!numeroCuenta) {

            return res.status(400).json({
                ok: false,
                mensaje:
                    "Ingresa un número de cuenta."
            });
        }


        // Buscar mi propia cuenta

        const cuentaOrigen = db
            .prepare(`
                SELECT id, numero_cuenta

                FROM cuentas

                WHERE usuario_id = ?
            `)
            .get(req.session.usuarioId);


        if (!cuentaOrigen) {

            return res.status(404).json({
                ok: false,
                mensaje:
                    "No se encontró tu cuenta."
            });
        }


        // Buscar destinatario

        const destinatario = db
            .prepare(`
                SELECT
                    c.id,
                    c.numero_cuenta,
                    u.nombre

                FROM cuentas c

                INNER JOIN usuarios u
                    ON u.id = c.usuario_id

                WHERE c.numero_cuenta = ?
            `)
            .get(numeroCuenta);


        if (!destinatario) {

            return res.status(404).json({
                ok: false,
                mensaje:
                    "No encontramos una cuenta Jelunor con ese número."
            });
        }


        // No permitir mi propia cuenta

        if (
            destinatario.id ===
            cuentaOrigen.id
        ) {

            return res.status(400).json({
                ok: false,
                mensaje:
                    "No puedes enviarte dinero a tu misma cuenta."
            });
        }


        const numeroOculto =
            `•••• ${String(
                destinatario.numero_cuenta
            ).slice(-4)}`;


        return res.json({

            ok: true,

            destinatario: {

                nombre:
                    destinatario.nombre,

                numeroCuenta:
                    destinatario.numero_cuenta,

                numeroOculto:
                    numeroOculto
            }

        });


    } catch (error) {

        console.error(
            "Error consultando destinatario:",
            error
        );


        return res.status(500).json({
            ok: false,
            mensaje:
                "No fue posible consultar la cuenta."
        });

    }

});

// ======================================================
// PAGAR SERVICIO
// ======================================================

router.post("/pagar", (req, res) => {

    try {

        // ----------------------------------------------
        // SESIÓN
        // ----------------------------------------------

        if (!req.session.usuarioId) {

            return res.status(401).json({
                ok: false,
                mensaje: "Debes iniciar sesión."
            });

        }


        const servicio =
            String(req.body.servicio || "")
                .trim()
                .toLowerCase();


        const referencia =
            String(req.body.referencia || "")
                .trim();


        const monto =
            Number(req.body.monto);


        // ----------------------------------------------
        // SERVICIOS PERMITIDOS
        // ----------------------------------------------

        const servicios = {

            energia: "Energía",

            agua: "Agua",

            gas: "Gas",

            internet: "Internet",

            celular: "Celular",

            television: "Televisión",

            otro: "Otro servicio"

        };


        if (!servicios[servicio]) {

            return res.status(400).json({
                ok: false,
                mensaje: "Selecciona un servicio válido."
            });

        }


        // ----------------------------------------------
        // REFERENCIA
        // ----------------------------------------------

        if (!referencia) {

            return res.status(400).json({
                ok: false,
                mensaje:
                    "Ingresa la referencia del pago."
            });

        }


        if (referencia.length > 60) {

            return res.status(400).json({
                ok: false,
                mensaje:
                    "La referencia es demasiado larga."
            });

        }


        // ----------------------------------------------
        // MONTO
        // ----------------------------------------------

        if (
            !Number.isFinite(monto) ||
            monto <= 0 ||
            !Number.isInteger(monto)
        ) {

            return res.status(400).json({
                ok: false,
                mensaje:
                    "Ingresa un monto válido."
            });

        }


        if (monto > 100000000) {

            return res.status(400).json({
                ok: false,
                mensaje:
                    "El monto máximo permitido es $100.000.000."
            });

        }


        // ----------------------------------------------
        // BUSCAR CUENTA
        // ----------------------------------------------

        const cuenta = db
            .prepare(`
                SELECT
                    c.id,
                    c.usuario_id,
                    c.numero_cuenta,
                    c.saldo,
                    u.nombre

                FROM cuentas c

                INNER JOIN usuarios u
                    ON u.id = c.usuario_id

                WHERE c.usuario_id = ?
            `)
            .get(req.session.usuarioId);


        if (!cuenta) {

            return res.status(404).json({
                ok: false,
                mensaje:
                    "No se encontró tu cuenta Jelunor."
            });

        }


        if (Number(cuenta.saldo) < monto) {

            return res.status(400).json({
                ok: false,
                mensaje:
                    "No tienes saldo suficiente."
            });

        }


        // ==================================================
        // TRANSACCIÓN SQLITE
        // ==================================================

        const realizarPago =
            db.transaction(() => {


                // DESCONTAR SALDO

                const descuento = db
                    .prepare(`
                        UPDATE cuentas

                        SET saldo = saldo - ?

                        WHERE id = ?
                          AND saldo >= ?
                    `)
                    .run(
                        monto,
                        cuenta.id,
                        monto
                    );


                if (descuento.changes !== 1) {

                    throw new Error(
                        "SALDO_INSUFICIENTE"
                    );

                }


                // CREAR MOVIMIENTO

                const movimiento = db
                    .prepare(`
                        INSERT INTO movimientos (
                            cuenta_id,
                            tipo,
                            concepto,
                            monto
                        )

                        VALUES (?, ?, ?, ?)
                    `)
                    .run(
                        cuenta.id,

                        "pago",

                        `Pago ${servicios[servicio]} - ${referencia}`,

                        -monto
                    );


                // NOTIFICACIÓN

                crearNotificacion(

                    cuenta.usuario_id,

                    "Pago realizado",

                    `Pagaste $${monto.toLocaleString("es-CO")} en ${servicios[servicio]}.`,

                    "pago"

                );


                // CONSULTAR SALDO NUEVO

                const cuentaActualizada = db
                    .prepare(`
                        SELECT saldo

                        FROM cuentas

                        WHERE id = ?
                    `)
                    .get(cuenta.id);


                return {

                    saldo:
                        cuentaActualizada.saldo,

                    movimientoId:
                        movimiento.lastInsertRowid

                };

            });


        let resultado;


        try {

            resultado =
                realizarPago();

        } catch (error) {

            if (
                error.message ===
                "SALDO_INSUFICIENTE"
            ) {

                return res.status(400).json({
                    ok: false,
                    mensaje:
                        "No tienes saldo suficiente."
                });

            }

            throw error;

        }


        // ----------------------------------------------
        // RESPUESTA
        // ----------------------------------------------

        return res.json({

            ok: true,

            mensaje:
                "Pago realizado correctamente.",

            saldo:
                resultado.saldo,

            pago: {

                servicio:
                    servicios[servicio],

                referencia:
                    referencia,

                monto:
                    monto,

                comprobante:
                    `JL-${resultado.movimientoId}`

            }

        });


    } catch (error) {

        console.error(
            "Error realizando pago:",
            error
        );


        return res.status(500).json({

            ok: false,

            mensaje:
                "No fue posible realizar el pago."

        });

    }

});


// ======================================================
// HISTORIAL DE MOVIMIENTOS
// ======================================================

router.get("/historial", (req, res) => {

    try {

        // ----------------------------------------------
        // VALIDAR SESIÓN
        // ----------------------------------------------

        if (!req.session.usuarioId) {

            return res.status(401).json({
                ok: false,
                mensaje: "Debes iniciar sesión."
            });

        }


        // ----------------------------------------------
        // BUSCAR CUENTA
        // ----------------------------------------------

        const cuenta = db
            .prepare(`
                SELECT
                    id,
                    numero_cuenta,
                    saldo,
                    tipo

                FROM cuentas

                WHERE usuario_id = ?
            `)
            .get(req.session.usuarioId);


        if (!cuenta) {

            return res.status(404).json({
                ok: false,
                mensaje:
                    "No se encontró tu cuenta Jelunor."
            });

        }


        // ----------------------------------------------
        // MOVIMIENTOS
        // ----------------------------------------------

        const movimientos = db
            .prepare(`
                SELECT
                    id,
                    tipo,
                    concepto,
                    monto,
                    fecha

                FROM movimientos

                WHERE cuenta_id = ?

                ORDER BY
                    fecha DESC,
                    id DESC

                LIMIT 500
            `)
            .all(cuenta.id);


        // ----------------------------------------------
        // RESUMEN
        // ----------------------------------------------

        let totalEntradas = 0;
        let totalSalidas = 0;


        movimientos.forEach(
            movimiento => {

                const monto =
                    Number(
                        movimiento.monto
                    ) || 0;


                if (monto >= 0) {

                    totalEntradas +=
                        Math.abs(monto);

                } else {

                    totalSalidas +=
                        Math.abs(monto);

                }

            }
        );


        return res.json({

            ok: true,

            cuenta: {

                numeroCuenta:
                    cuenta.numero_cuenta,

                saldo:
                    cuenta.saldo,

                tipo:
                    cuenta.tipo

            },

            resumen: {

                cantidad:
                    movimientos.length,

                entradas:
                    totalEntradas,

                salidas:
                    totalSalidas

            },

            movimientos:
                movimientos

        });


    } catch (error) {

        console.error(
            "Error obteniendo historial:",
            error
        );


        return res.status(500).json({

            ok: false,

            mensaje:
                "No fue posible cargar el historial."

        });

    }

});

module.exports = router;