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
                telefono: usuario.telefono
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
// CERRAR SESIÓN
// ==========================================

router.post("/logout", (req, res) => {

    req.session.destroy((error) => {

        if (error) {

            return res.status(500).json({
                ok: false,
                mensaje: "No se pudo cerrar la sesión."
            });

        }

        res.clearCookie("connect.sid");

        res.json({
            ok: true,
            mensaje: "Sesión cerrada."
        });

    });

});
module.exports = router;