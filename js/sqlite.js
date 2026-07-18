"use strict";

/*
------------------------------------------------------------
LFM Content Studio
SQLite Manager

Responsible ONLY for database interaction.

Uses sql.js (SQLite compiled to WebAssembly)

Author : OpenAI + Learn From Maps
------------------------------------------------------------
*/

const SQLiteManager = (() => {

    let SQL = null;

    let db = null;

    let dbFileName = "";

    let initialized = false;

    let sqlLog = [];

    //-------------------------------------------------------
    // Initialization
    //-------------------------------------------------------

    async function initialize() {

        if (initialized)
            return;

        SQL = await initSqlJs({

            locateFile: file => "../lib/" + file

        });

        initialized = true;

        log("SQLite engine initialized.");

    }

    //-------------------------------------------------------
    // Logging
    //-------------------------------------------------------

    function log(message) {

        const now = new Date();

        const time =
            now.toLocaleTimeString();

        sqlLog.push(
            "[" + time + "] " + message
        );

        console.log(message);

    }

    function clearLog() {

        sqlLog = [];

    }

    function getLog() {

        return sqlLog.join("\n");

    }

    //-------------------------------------------------------
    // Status
    //-------------------------------------------------------

    function isOpen() {

        return db !== null;

    }

    function getDatabaseName() {

        return dbFileName;

    }

    //-------------------------------------------------------
    // Open database
    //-------------------------------------------------------

    async function open(file) {

        if (!initialized)
            await initialize();

        const bytes =
            await file.arrayBuffer();

        db =
            new SQL.Database(
                new Uint8Array(bytes)
            );

        dbFileName = file.name;

        log("Database opened : " + dbFileName);

        verifySchema();

    }

    //-------------------------------------------------------
    // Save database
    //-------------------------------------------------------

    function save() {

        if (!db)
            throw new Error(
                "No database loaded."
            );

        const data =
            db.export();

        const blob =
            new Blob(
                [data],
                {
                    type:
                        "application/octet-stream"
                }
            );

        const link =
            document.createElement("a");

        link.href =
            URL.createObjectURL(blob);

        link.download =
            dbFileName;

        link.click();

        URL.revokeObjectURL(
            link.href
        );

        log("Database saved.");

    }

    //-------------------------------------------------------
    // Schema validation
    //-------------------------------------------------------

    function verifySchema() {

        const requiredTables = [

            "kids_lessons",

            "text_markers",

            "upsc_play_list"

        ];

        requiredTables.forEach(table => {

            const result =
                db.exec(
                    `
                    SELECT name
                    FROM sqlite_master
                    WHERE type='table'
                    AND name='${table}'
                    `
                );

            if (result.length === 0) {

                throw new Error(
                    "Missing table : " + table
                );

            }

        });

        log("Schema validation successful.");

    }

    //-------------------------------------------------------
    // Public API
    //-------------------------------------------------------

    return {

        initialize,

        open,

        save,

        isOpen,

        getDatabaseName,

        clearLog,

        getLog

    };

})();