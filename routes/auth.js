const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const db = require("../DATABASE/db");

const router = express.Router();


// ==========================================
// GENERAR NÚMERO DE CUENTA JELUNOR
// ==========================================

function generarNumeroCuenta() {

    let numeroCuenta;
    let existe;

    do {

        numeroCuenta = String(
            crypto.randomInt(1000000000, 9999999999)
        );

        existe = db
            .prepare(`
                SELECT id
                FROM cuentas
                WHERE numero_cuenta = ?
            `)
            .get(numeroCuenta);

    } while (existe);

    return numeroCuenta;
}


// ==========================================
// REGISTRAR USUARIO
// ==========================================

router.post("/registro", async (req, res) => {

    try {

        const {
            nombre,
            documento,
            correo,
            telefono,
            password,
            confirmarPassword
        } = req.body;


        // Validar campos
        if (
            !nombre ||
            !documento ||
            !correo ||
            !password ||
            !confirmarPassword
        ) {

            return res.status(400).json({
                ok: false,
                mensaje: "Completa todos los campos obligatorios."
            });

        }


        // Validar contraseña
        if (password !== confirmarPassword) {

            return res.status(400).json({
                ok: false,
                mensaje: "Las contraseñas no coinciden."
            });

        }


        if (password.length < 6) {

            return res.status(400).json({
                ok: false,
                mensaje: "La contraseña debe tener mínimo 6 caracteres."
            });

        }


        // Normalizar correo
        const correoNormalizado = correo
            .trim()
            .toLowerCase();


        // Revisar documento
        const documentoExiste = db
            .prepare(`
                SELECT id
                FROM usuarios
                WHERE documento = ?
            `)
            .get(documento.trim());


        if (documentoExiste) {

            return res.status(409).json({
                ok: false,
                mensaje: "Ya existe un usuario con ese documento."
            });

        }


        // Revisar correo
        const correoExiste = db
            .prepare(`
                SELECT id
                FROM usuarios
                WHERE correo = ?
            `)
            .get(correoNormalizado);


        if (correoExiste) {

            return res.status(409).json({
                ok: false,
                mensaje: "Ese correo ya está registrado."
            });

        }


        // Proteger contraseña
        const passwordHash = await bcrypt.hash(
            password,
            12
        );


        // Crear número de cuenta
        const numeroCuenta = generarNumeroCuenta();


        // ==========================================
        // TRANSACCIÓN
        // ==========================================

        const crearUsuario = db.transaction(() => {

            const usuario = db
                .prepare(`
                    INSERT INTO usuarios (
                        nombre,
                        documento,
                        correo,
                        telefono,
                        password
                    )
                    VALUES (?, ?, ?, ?, ?)
                `)
                .run(
                    nombre.trim(),
                    documento.trim(),
                    correoNormalizado,
                    telefono ? telefono.trim() : null,
                    passwordHash
                );


            const usuarioId =
                usuario.lastInsertRowid;


            db.prepare(`
                INSERT INTO cuentas (
                    usuario_id,
                    numero_cuenta,
                    saldo,
                    tipo
                )
                VALUES (?, ?, ?, ?)
            `)
            .run(
                usuarioId,
                numeroCuenta,
                0,
                "Ahorros"
            );


            return usuarioId;

        });


        const usuarioId = crearUsuario();


        res.status(201).json({

            ok: true,

            mensaje:
                "Cuenta Jelunor creada correctamente.",

            usuario: {
                id: usuarioId,
                nombre: nombre.trim(),
                numeroCuenta: numeroCuenta
            }

        });


    } catch (error) {

        console.error(
            "Error registrando usuario:",
            error
        );


        res.status(500).json({

            ok: false,

            mensaje:
                "Ocurrió un error al crear la cuenta."

        });

    }

});

// ==========================================
// LOGIN
// ==========================================

router.post("/login", async (req, res) => {

    try {

        const {
            correo,
            password
        } = req.body;


        if (!correo || !password) {

            return res.status(400).json({
                ok: false,
                mensaje: "Ingresa correo y contraseña."
            });

        }


        const correoNormalizado =
            correo.trim().toLowerCase();


        const usuario = db
            .prepare(`
                SELECT *
                FROM usuarios
                WHERE correo = ?
            `)
            .get(correoNormalizado);


        if (!usuario) {

            return res.status(401).json({
                ok: false,
                mensaje: "Correo o contraseña incorrectos."
            });

        }


        const passwordCorrecta =
            await bcrypt.compare(
                password,
                usuario.password
            );


        if (!passwordCorrecta) {

            return res.status(401).json({
                ok: false,
                mensaje: "Correo o contraseña incorrectos."
            });

        }


        // Guardar usuario en sesión
        req.session.usuarioId = usuario.id;


        res.json({
            ok: true,
            mensaje: "Inicio de sesión correcto."
        });


    } catch (error) {

        console.error(
            "Error iniciando sesión:",
            error
        );


        res.status(500).json({
            ok: false,
            mensaje:
                "Ocurrió un error al iniciar sesión."
        });

    }

});
// ==========================================
// USUARIO ACTUAL
// ==========================================

router.get("/me", (req, res) => {

    try {

        // No hay sesión iniciada
        if (!req.session.usuarioId) {

            return res.status(401).json({
                ok: false,
                autenticado: false,
                mensaje: "Debes iniciar sesión."
            });

        }


        // Buscar usuario y cuenta
        const usuario = db.prepare(`
            SELECT
                u.id,
                u.nombre,
                u.correo,
                u.documento,
            u.telefono,

(
    SELECT imagen
    FROM fotos_perfil
    WHERE usuario_id = u.id
    LIMIT 1
) AS foto_perfil,

c.id AS cuenta_id,
                c.numero_cuenta,
                c.saldo,
                c.tipo

            FROM usuarios u

            LEFT JOIN cuentas c
                ON c.usuario_id = u.id

            WHERE u.id = ?

            LIMIT 1
        `).get(req.session.usuarioId);


        if (!usuario) {

            req.session.destroy(() => {});

            return res.status(401).json({
                ok: false,
                autenticado: false,
                mensaje: "La sesión ya no es válida."
            });

        }


        // Buscar movimientos
        let movimientos = [];

        if (usuario.cuenta_id) {

            movimientos = db.prepare(`
                SELECT
                    id,
                    tipo,
                    concepto,
                    monto,
                    fecha

                FROM movimientos

                WHERE cuenta_id = ?

                ORDER BY fecha DESC

                LIMIT 10
            `).all(usuario.cuenta_id);

        }


        res.json({

            ok: true,
            autenticado: true,

            usuario: {
    id: usuario.id,
    nombre: usuario.nombre,
    correo: usuario.correo,
    documento: usuario.documento,
    telefono: usuario.telefono,
    fotoPerfil:
        usuario.foto_perfil || null
},
            cuenta: {
                id: usuario.cuenta_id,
                numeroCuenta: usuario.numero_cuenta,
                saldo: usuario.saldo || 0,
                tipo: usuario.tipo || "Ahorros"
            },

            movimientos: movimientos
        });


    } catch (error) {

        console.error(
            "Error obteniendo usuario:",
            error
        );

        res.status(500).json({
            ok: false,
            mensaje: "Error al cargar la cuenta."
        });

    }

});

// ==========================================
// GUARDAR FOTO DE PERFIL
// ==========================================

router.post(
    "/foto-perfil",
    (req, res) => {

        try {

            if (!req.session.usuarioId) {

                return res
                    .status(401)
                    .json({
                        ok: false,
                        mensaje:
                            "Debes iniciar sesión."
                    });
            }


            const imagen =
                String(
                    req.body.imagen || ""
                );


            const formatoPermitido =
                /^data:image\/(jpeg|jpg|png|webp);base64,/;


            if (
                !imagen ||
                !formatoPermitido.test(
                    imagen
                )
            ) {

                return res
                    .status(400)
                    .json({
                        ok: false,
                        mensaje:
                            "Selecciona una imagen válida."
                    });
            }


            if (
                imagen.length >
                1500000
            ) {

                return res
                    .status(400)
                    .json({
                        ok: false,
                        mensaje:
                            "La imagen es demasiado grande."
                    });
            }


            db.prepare(`
                INSERT INTO fotos_perfil (
                    usuario_id,
                    imagen,
                    fecha_actualizacion
                )

                VALUES (
                    ?, ?,
                    CURRENT_TIMESTAMP
                )

                ON CONFLICT(usuario_id)
                DO UPDATE SET
                    imagen =
                        excluded.imagen,
                    fecha_actualizacion =
                        CURRENT_TIMESTAMP
            `)
            .run(
                req.session.usuarioId,
                imagen
            );


            return res.json({
                ok: true,
                mensaje:
                    "Foto de perfil actualizada.",
                imagen
            });


        } catch (error) {

            console.error(
                "Error guardando foto:",
                error
            );


            return res
                .status(500)
                .json({
                    ok: false,
                    mensaje:
                        "No fue posible guardar la foto."
                });
        }
    }
);


// ==========================================
// ELIMINAR FOTO DE PERFIL
// ==========================================

router.delete(
    "/foto-perfil",
    (req, res) => {

        try {

            if (!req.session.usuarioId) {

                return res
                    .status(401)
                    .json({
                        ok: false,
                        mensaje:
                            "Debes iniciar sesión."
                    });
            }


            db.prepare(`
                DELETE FROM fotos_perfil

                WHERE usuario_id = ?
            `)
            .run(
                req.session.usuarioId
            );


            return res.json({
                ok: true,
                mensaje:
                    "Foto eliminada."
            });


        } catch (error) {

            console.error(
                "Error eliminando foto:",
                error
            );


            return res
                .status(500)
                .json({
                    ok: false,
                    mensaje:
                        "No fue posible eliminar la foto."
                });
        }
    }
);

// ==========================================
// CERRAR SESIÓN
// ==========================================

router.post(
    "/foto-perfil",
    (req, res) => {
        // código para guardar la foto
    }
);

router.delete(
    "/foto-perfil",
    (req, res) => {
        // código para eliminar la foto
    }
);

// ==========================================
// CAMBIAR CONTRASEÑA
// ==========================================

router.post(
    "/cambiar-password",
    async (req, res) => {

        try {

            if (!req.session.usuarioId) {

                return res
                    .status(401)
                    .json({
                        ok: false,
                        mensaje:
                            "Debes iniciar sesión."
                    });
            }


            const {
                passwordActual,
                passwordNueva,
                confirmarPassword
            } = req.body;


            // ------------------------------------------
            // VALIDAR CAMPOS
            // ------------------------------------------

            if (
                !passwordActual ||
                !passwordNueva ||
                !confirmarPassword
            ) {

                return res
                    .status(400)
                    .json({
                        ok: false,
                        mensaje:
                            "Completa todos los campos."
                    });
            }


            // ------------------------------------------
            // VALIDAR NUEVA CONTRASEÑA
            // ------------------------------------------

            if (
                passwordNueva.length < 6
            ) {

                return res
                    .status(400)
                    .json({
                        ok: false,
                        mensaje:
                            "La nueva contraseña debe tener mínimo 6 caracteres."
                    });
            }


            if (
                passwordNueva !==
                confirmarPassword
            ) {

                return res
                    .status(400)
                    .json({
                        ok: false,
                        mensaje:
                            "Las nuevas contraseñas no coinciden."
                    });
            }


            if (
                passwordActual ===
                passwordNueva
            ) {

                return res
                    .status(400)
                    .json({
                        ok: false,
                        mensaje:
                            "La nueva contraseña debe ser diferente a la actual."
                    });
            }


            // ------------------------------------------
            // BUSCAR CONTRASEÑA ACTUAL
            // ------------------------------------------

            const usuario =
                db.prepare(`
                    SELECT
                        id,
                        password

                    FROM usuarios

                    WHERE id = ?

                    LIMIT 1
                `)
                .get(
                    req.session.usuarioId
                );


            if (!usuario) {

                return res
                    .status(404)
                    .json({
                        ok: false,
                        mensaje:
                            "Usuario no encontrado."
                    });
            }


            // ------------------------------------------
            // COMPROBAR CONTRASEÑA ACTUAL
            // ------------------------------------------

            const passwordCorrecta =
                await bcrypt.compare(
                    passwordActual,
                    usuario.password
                );


            if (!passwordCorrecta) {

                return res
                    .status(401)
                    .json({
                        ok: false,
                        mensaje:
                            "La contraseña actual es incorrecta."
                    });
            }


            // ------------------------------------------
            // ENCRIPTAR CONTRASEÑA NUEVA
            // ------------------------------------------

            const nuevaPasswordHash =
                await bcrypt.hash(
                    passwordNueva,
                    12
                );


            // ------------------------------------------
            // ACTUALIZAR
            // ------------------------------------------

            db.prepare(`
                UPDATE usuarios

                SET password = ?

                WHERE id = ?
            `)
            .run(
                nuevaPasswordHash,
                req.session.usuarioId
            );


            // ------------------------------------------
            // NOTIFICACIÓN
            // ------------------------------------------

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
                req.session.usuarioId,
                "🔐 Contraseña actualizada",
                "La contraseña de tu cuenta Jelunor fue actualizada correctamente.",
                "seguridad"
            );


            return res.json({
                ok: true,
                mensaje:
                    "Contraseña actualizada correctamente."
            });


        } catch (error) {

            console.error(
                "Error cambiando contraseña:",
                error
            );


            return res
                .status(500)
                .json({
                    ok: false,
                    mensaje:
                        "No fue posible actualizar la contraseña."
                });
        }
    }
);

// ==========================================
// RECUPERAR CONTRASEÑA
// ==========================================

router.post(
    "/recuperar-password",
    async (req, res) => {

        try {

            const {
                correo,
                documento,
                passwordNueva,
                confirmarPassword
            } = req.body;


            if (
                !correo ||
                !documento ||
                !passwordNueva ||
                !confirmarPassword
            ) {

                return res
                    .status(400)
                    .json({
                        ok: false,
                        mensaje:
                            "Completa todos los campos."
                    });
            }


            if (
                passwordNueva.length < 6
            ) {

                return res
                    .status(400)
                    .json({
                        ok: false,
                        mensaje:
                            "La contraseña debe tener mínimo 6 caracteres."
                    });
            }


            if (
                passwordNueva !==
                confirmarPassword
            ) {

                return res
                    .status(400)
                    .json({
                        ok: false,
                        mensaje:
                            "Las contraseñas no coinciden."
                    });
            }


            const correoNormalizado =
                correo
                    .trim()
                    .toLowerCase();


            const documentoNormalizado =
                documento.trim();


            const usuario =
                db.prepare(`
                    SELECT
                        id,
                        nombre,
                        password

                    FROM usuarios

                    WHERE correo = ?
                      AND documento = ?

                    LIMIT 1
                `)
                .get(
                    correoNormalizado,
                    documentoNormalizado
                );


            if (!usuario) {

                /*
                    Mensaje genérico para no indicar
                    cuál dato fue incorrecto.
                */

                return res
                    .status(400)
                    .json({
                        ok: false,
                        mensaje:
                            "Los datos ingresados no coinciden con una cuenta Jelunor."
                    });
            }


            const mismaPassword =
                await bcrypt.compare(
                    passwordNueva,
                    usuario.password
                );


            if (mismaPassword) {

                return res
                    .status(400)
                    .json({
                        ok: false,
                        mensaje:
                            "La nueva contraseña debe ser diferente a la anterior."
                    });
            }


            const passwordHash =
                await bcrypt.hash(
                    passwordNueva,
                    12
                );


            db.transaction(
                () => {

                    db.prepare(`
                        UPDATE usuarios

                        SET password = ?

                        WHERE id = ?
                    `)
                    .run(
                        passwordHash,
                        usuario.id
                    );


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
                        usuario.id,
                        "🔐 Contraseña recuperada",
                        "La contraseña de tu cuenta Jelunor fue restablecida.",
                        "seguridad"
                    );

                }
            )();


            return res.json({
                ok: true,
                mensaje:
                    "Contraseña actualizada correctamente."
            });


        } catch (error) {

            console.error(
                "Error recuperando contraseña:",
                error
            );


            return res
                .status(500)
                .json({
                    ok: false,
                    mensaje:
                        "No fue posible recuperar la contraseña."
                });
        }
    }
);
// CERRAR SESIÓN
router.post("/logout", (req, res) => {
    // ...
});


module.exports = router;

module.exports = router;