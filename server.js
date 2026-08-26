const express = require("express");
const path = require("path");
const session = require("express-session");
const savingsRoutes =
    require("./routes/savings");
const db = require("./DATABASE/db");

const authRoutes = require("./routes/auth");
const transactionRoutes = require("./routes/transactions");
const notificationRoutes =
    require("./routes/notifications");

const app = express();
const PORT =
    process.env.PORT || 3000;

// ======================================================
// 1. LEER JSON
// ======================================================
// ESTO DEBE IR ANTES DE LAS RUTAS

app.use(
    express.json({
        limit: "2mb"
    })
);


// ======================================================
// 2. LEER FORMULARIOS
// ======================================================
// TAMBIÉN DEBE IR ANTES DE LAS RUTAS

app.use(
    express.urlencoded({
        extended: true
    })
);


// ======================================================
// 3. SESIONES
// ======================================================
// ESTO TIENE QUE IR ANTES DE /api/auth

app.use(
    session({
        secret:
            process.env.SESSION_SECRET ||
            "jelunor-desarrollo-local",

        resave: false,

        saveUninitialized: false,

        cookie: {
            httpOnly: true,

            maxAge:
                1000 *
                60 *
                60 *
                2
        }
    })
);


// ======================================================
// 4. RUTAS API
// ======================================================
// SOLO DESPUÉS de express.json() y session()

app.use(
    "/api/auth",
    authRoutes
);


app.use(
    "/api/transactions",
    transactionRoutes
);
app.use(
    "/api/notifications",
    notificationRoutes
);

app.use(
    "/api/savings",
    savingsRoutes
);

// ======================================================
// 5. ARCHIVOS PÚBLICOS
// ======================================================

app.use(
    express.static(
        path.join(
            __dirname,
            "PUBLIC"
        ),
        {
            index: false
        }
    )
);


// ======================================================
// 6. PÁGINA PRINCIPAL
// ======================================================

app.get(
    ["/", "/index.html"],
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "PUBLIC",
                "index.html"
            )
        );

    }
);


// ======================================================
// 7. PRUEBA SQLITE
// ======================================================

app.get(
    "/api/prueba-db",
    (req, res) => {

        try {

            const tablas =
                db
                    .prepare(`
                        SELECT name
                        FROM sqlite_master
                        WHERE type = 'table'
                    `)
                    .all();


            res.json({
                ok: true,

                mensaje:
                    "SQLite funciona correctamente",

                tablas
            });


        } catch (error) {

            console.error(
                "Error consultando SQLite:",
                error
            );


            res.status(500).json({
                ok: false,

                mensaje:
                    "Error al consultar SQLite"
            });

        }

    }
);


// ======================================================
// 8. RUTA NO ENCONTRADA
// ======================================================

app.use(
    (req, res) => {

        res.status(404).json({
            ok: false,
            mensaje:
                "Ruta no encontrada"
        });

    }
);


// ======================================================
// 9. INICIAR SERVIDOR
// ======================================================

app.listen(
    PORT,
    () => {

        console.log("");

        console.log(
            "=============================="
        );

        console.log(
            "🏦 JELUNOR"
        );

        console.log(
            "=============================="
        );

        console.log(
            `Servidor iniciado en http://localhost:${PORT}`
        );

        console.log("");

    }
);