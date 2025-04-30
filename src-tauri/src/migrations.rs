use tauri_plugin_sql::Migration;
use tauri_plugin_sql::MigrationKind;

pub fn get_migrations() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "create_initial_tables",
            sql: "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "create_athletes_table",
            sql: "CREATE TABLE athletes (
                id SERIAL PRIMARY KEY,
                coach_id UUID REFERENCES coach(uid),
                name TEXT NOT NULL,
                birth_date DATE,
                country TEXT,
                state TEXT,
                gender TEXT,
                height INTEGER,
                height_unit TEXT,
                weight INTEGER,
                weight_unit TEXT,
                discipline TEXT,
                category TEXT,
                institution TEXT,
                comments TEXT,
                last_changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "insert_athlete_data",
            sql: "INSERT INTO athletes (
                coach_id,
                name,
                birth_date,
                country,
                state,
                gender,
                height,
                height_unit,
                weight,
                weight_unit,
                discipline,
                category,
                institution,
                comments,
                last_changed_at
            ) VALUES
            ('650cbaf0-8953-4412-a4dd-16f31f55bd45', 'Anibal', '2008-07-17', 'AR', 'X', 'M', 167, 'cm', 67, 'kgs', 'football', '1', 'IACC', '', CURRENT_TIMESTAMP),
            ('650cbaf0-8953-4412-a4dd-16f31f55bd45', 'Joaquin Del Rio', '2025-02-21', 'AR', 'X', 'M', 180, 'cm', 80, 'kgs', 'football', 'U21', '', '', CURRENT_TIMESTAMP),
            ('650cbaf0-8953-4412-a4dd-16f31f55bd45', 'Manuel Alzamora', '2003-11-25', 'AR', 'X', 'F', 48, 'cm', 44, 'kgs', 'football', 'dssd', 'zxdd', '', CURRENT_TIMESTAMP),
            ('650cbaf0-8953-4412-a4dd-16f31f55bd45', 'Bruno Lalomia', '2025-02-21', 'AR', 'X', 'M', 181, 'cm', 100, 'kgs', 'basketball', 'Primera', 'Las Palmas', '', CURRENT_TIMESTAMP),
            ('650cbaf0-8953-4412-a4dd-16f31f55bd45', 'Adriel Zarate', '2025-02-21', 'AR', 'X', 'M', 172, 'cm', 68, 'kgs', 'basketball', 'Primera', 'Las Palmas', '', CURRENT_TIMESTAMP),
            ('650cbaf0-8953-4412-a4dd-16f31f55bd45', 'Diego Nivela', '2025-02-21', 'AR', 'X', 'M', 173, 'cm', 76, 'kgs', 'basketball', 'Primera', 'Las Palmas', '', CURRENT_TIMESTAMP),
            ('650cbaf0-8953-4412-a4dd-16f31f55bd45', 'Santino Williams', '2025-02-21', 'AR', 'X', 'M', 165, 'cm', 74, 'kgs', 'basketball', 'Primera', 'Las Palmas', '', CURRENT_TIMESTAMP),
            ('650cbaf0-8953-4412-a4dd-16f31f55bd45', 'Federico Unsain', '2025-02-21', 'AR', 'X', 'M', 179, 'cm', 75, 'kgs', 'basketball', 'Coach', 'Las Palmas', '', CURRENT_TIMESTAMP),
            ('650cbaf0-8953-4412-a4dd-16f31f55bd45', 'Juan Ignacio Nivela', '2025-02-21', 'AR', 'X', 'M', 185, 'cm', 81, 'kgs', 'basketball', 'Primera', 'Las Palmas', '', CURRENT_TIMESTAMP),
            ('650cbaf0-8953-4412-a4dd-16f31f55bd45', 'Lautaro Moyano', '2025-02-21', 'AR', 'X', 'M', 175, 'cm', 72, 'kgs', 'basketball', 'Primera', 'Las Palmas', '', CURRENT_TIMESTAMP),
            ('650cbaf0-8953-4412-a4dd-16f31f55bd45', 'Gabriel Loza', '2025-02-21', 'AR', 'X', 'M', 168, 'cm', 65, 'kgs', 'basketball', 'Primera', 'Las Palmas', '', CURRENT_TIMESTAMP),
            ('650cbaf0-8953-4412-a4dd-16f31f55bd45', 'Santiago Dreher', '2025-02-21', 'AR', 'X', 'M', 178, 'cm', 90, 'kgs', 'basketball', 'Primera', 'Las Palmas', '', CURRENT_TIMESTAMP),
            ('650cbaf0-8953-4412-a4dd-16f31f55bd45', 'Juan Illanes', '2025-02-21', 'AR', 'X', 'M', 182, 'cm', 115, 'kgs', 'basketball', 'Primera', 'Las Palmas', '', CURRENT_TIMESTAMP),
            ('650cbaf0-8953-4412-a4dd-16f31f55bd45', 'Juan Rivas', '2025-02-21', 'AR', 'X', 'M', 168, 'cm', 70, 'kgs', 'basketball', 'Primera', 'Las Palmas', '', CURRENT_TIMESTAMP),
            ('650cbaf0-8953-4412-a4dd-16f31f55bd45', 'Julio Castillo', '2025-02-21', 'AR', 'X', 'M', 173, 'cm', 90, 'kgs', 'roadCycling', 'Amateur', 'Las Palmas', '', CURRENT_TIMESTAMP),
            ('650cbaf0-8953-4412-a4dd-16f31f55bd45', 'Valentin Amaranto', '2025-02-21', 'AR', 'X', 'M', 174, 'cm', 70, 'kgs', 'basketball', 'U21', 'Las Palmas', '', CURRENT_TIMESTAMP),
            ('650cbaf0-8953-4412-a4dd-16f31f55bd45', 'Marcelo Dominguez', '2025-02-21', 'AR', 'X', 'M', 175, 'cm', 93, 'kgs', 'basketball', 'Primera', 'Las Palmas', '', CURRENT_TIMESTAMP),
            ('650cbaf0-8953-4412-a4dd-16f31f55bd45', 'Lautaro Rincon', '2025-02-21', 'AR', 'X', 'M', 175, 'cm', 95, 'kgs', 'basketball', 'Primera', 'Las Palmas', '', CURRENT_TIMESTAMP),
            ('650cbaf0-8953-4412-a4dd-16f31f55bd45', 'Juan Loza', '2025-02-21', 'AR', 'X', 'M', 166, 'cm', 63, 'kgs', 'basketball', 'Primera', 'Las Palmas', '', CURRENT_TIMESTAMP),
            ('650cbaf0-8953-4412-a4dd-16f31f55bd45', 'Lauti Garay', '2025-02-21', 'AR', 'X', 'M', 168, 'cm', 110, 'kgs', 'basketball', 'Primera', 'Las Palmas', '', CURRENT_TIMESTAMP);",
            kind: MigrationKind::Up,
        },
    ]
} 