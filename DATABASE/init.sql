CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    documento TEXT UNIQUE NOT NULL,
    correo TEXT UNIQUE NOT NULL,
    telefono TEXT,
    password TEXT NOT NULL,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cuentas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    numero_cuenta TEXT UNIQUE NOT NULL,
    saldo REAL DEFAULT 0,
    tipo TEXT DEFAULT 'Ahorros',

    FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS movimientos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,   
    cuenta_id INTEGER NOT NULL,
    tipo TEXT NOT NULL,
    concepto TEXT NOT NULL,
    monto REAL NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (cuenta_id)
        REFERENCES cuentas(id)
);
CREATE TABLE IF NOT EXISTS notificaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    titulo TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    tipo TEXT DEFAULT 'info',
    leida INTEGER DEFAULT 0,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS planes_ahorro (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    meta REAL NOT NULL,
    meses INTEGER NOT NULL,
    frecuencia TEXT NOT NULL,
    aporte REAL NOT NULL,
    numero_aportes INTEGER NOT NULL,
    ahorrado REAL DEFAULT 0,
    estado TEXT DEFAULT 'activo',
    ultimo_recordatorio TEXT,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
);
CREATE TABLE IF NOT EXISTS aportes_ahorro (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    monto REAL NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (plan_id)
        REFERENCES planes_ahorro(id),

    FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS fotos_perfil (
    usuario_id INTEGER PRIMARY KEY,
    imagen TEXT NOT NULL,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
);