const Database =
    require("better-sqlite3");

const fs =
    require("fs");

const path =
    require("path");


// ======================================================
// CARPETA DE LA BASE DE DATOS
// ======================================================

// En Railway utilizaremos un volumen persistente.
// En tu PC seguirá usando la carpeta DATABASE normalmente.

const dataDirectory =
    process.env.RAILWAY_VOLUME_MOUNT_PATH ||
    process.env.DATA_DIR ||
    __dirname;


// Crear carpeta si no existe

if (
    !fs.existsSync(
        dataDirectory
    )
) {

    fs.mkdirSync(
        dataDirectory,
        {
            recursive: true
        }
    );

}


// ======================================================
// ARCHIVO SQLITE
// ======================================================

const dbPath =
    path.join(
        dataDirectory,
        "database.db"
    );


console.log(
    "📦 Base de datos:",
    dbPath
);


// ======================================================
// CONEXIÓN
// ======================================================

const db =
    new Database(
        dbPath
    );


db.pragma(
    "foreign_keys = ON"
);


// ======================================================
// CREAR TABLAS
// ======================================================

// init.sql siempre está en la carpeta DATABASE
// del proyecto, no en el volumen.

const initPath =
    path.join(
        __dirname,
        "init.sql"
    );


const initSQL =
    fs.readFileSync(
        initPath,
        "utf8"
    );


db.exec(
    initSQL
);


console.log(
    "✅ Base de datos Jelunor conectada correctamente"
);


module.exports = db;