"use strict";

/*
============================================================

LFM Content Studio

SQLite Manager

A generic wrapper around sql.js.
Contains NO application-specific logic.

============================================================
*/

const SQLiteManager = (() => {

    //--------------------------------------------------------
    // Private variables
    //--------------------------------------------------------

    const CONFIG = {

        DEBUG_SQL: true,

        AUTO_COMMIT: false

    };

    let SQL = null;

    let db = null;

    let dbFileName = "";

    let initialized = false;

    const sqlLog = [];

    //--------------------------------------------------------
    // Logging
    //--------------------------------------------------------

    function addLog(type, message) {

        const entry = {

            timestamp: new Date(),

            type: type,

            message: message

        };

        sqlLog.push(entry);

        console.log(
            "[" + type + "]",
            message
        );

    }

    function formatLog() {

        let output = "";

        sqlLog.forEach(entry => {

            const time =
                entry.timestamp.toLocaleTimeString();

            output +=
                "[" +
                time +
                "] " +
                entry.type +
                " : " +
                entry.message +
                "\n";

        });

        return output;

    }

    //--------------------------------------------------------
    // Initialization
    //--------------------------------------------------------

    async function initialize() {

        if (initialized)
            return;

        SQL = await initSqlJs({

            locateFile: function(file) {

                return "lib/" + file;

            }

        });

        initialized = true;

        addLog(
            "INFO",
            "SQLite engine initialized."
        );

    }

    //--------------------------------------------------------
    // Open Database
    //--------------------------------------------------------

    async function open(file) {

        if (!initialized)
            await initialize();

        const buffer =
            await file.arrayBuffer();

        db =
            new SQL.Database(
                new Uint8Array(buffer)
            );

        dbFileName = file.name;

        addLog(
            "INFO",
            "Opened database : " +
            dbFileName
        );

    }

    //--------------------------------------------------------
    // Save Database
    //--------------------------------------------------------

    function save() {

        ensureDatabaseOpen();

        const binary =
            db.export();

        const blob =
            new Blob(
                [binary],
                {
                    type:
                        "application/octet-stream"
                }
            );

        const url =
            URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href = url;

        link.download =
            dbFileName;

        link.click();

        URL.revokeObjectURL(url);

        addLog(
            "INFO",
            "Database saved."
        );

    }

    //--------------------------------------------------------
    // Close Database
    //--------------------------------------------------------

    function close() {

        if (db) {

            db.close();

            db = null;

            dbFileName = "";

            addLog(
                "INFO",
                "Database closed."
            );

        }

    }

    //--------------------------------------------------------
    // Utility
    //--------------------------------------------------------

    function ensureDatabaseOpen() {

        if (!db) {

            throw new Error(
                "No database is currently open."
            );

        }

    }

    function isOpen() {

        return db !== null;

    }

    function getDatabaseName() {

        return dbFileName;

    }

    function clearLog() {

        sqlLog.length = 0;

    }

    function getLog() {

        return formatLog();

    }

    //--------------------------------------------------------
    // Transaction Support
    //--------------------------------------------------------

    function begin() {

        ensureDatabaseOpen();

        db.run("BEGIN TRANSACTION");

        addLog(
            "TRANSACTION",
            "BEGIN TRANSACTION"
        );

    }

    function commit() {

        ensureDatabaseOpen();

        db.run("COMMIT");

        addLog(
            "TRANSACTION",
            "COMMIT"
        );

    }

    function rollback() {

        ensureDatabaseOpen();

        db.run("ROLLBACK");

        addLog(
            "TRANSACTION",
            "ROLLBACK"
        );

    }

    //--------------------------------------------------------
    // SQL Execution
    //--------------------------------------------------------

    function execute(sql, params = []) {

        ensureDatabaseOpen();

        const start = performance.now();

        try {

            db.run(sql, params);

            const elapsed =
                (
                    performance.now() - start
                ).toFixed(2);

            addLog(
                "EXECUTE",
                formatSql(sql, params)
            );

            addLog(
                "INFO",
                "Completed in "
                + elapsed
                + " ms"
            );

        }
        catch (ex) {

            addLog(
                "ERROR",
                ex.message
            );

            throw ex;

        }

    }

    //--------------------------------------------------------
    // SELECT
    //--------------------------------------------------------

    function select(sql, params = []) {

        ensureDatabaseOpen();

        const start = performance.now();

        try {

            const result =
                db.exec(sql, params);

            const elapsed =
                (
                    performance.now() - start
                ).toFixed(2);

            addLog(
                "SELECT",
                formatSql(sql, params)
            );

            addLog(
                "INFO",
                "Completed in "
                + elapsed
                + " ms"
            );

            return result;

        }
        catch (ex) {

            addLog(
                "ERROR",
                ex.message
            );

            throw ex;

        }

    }

    //--------------------------------------------------------
    // EXISTS
    //--------------------------------------------------------

    function exists(sql, params = []) {

        const rows =
            select(sql, params);

        return rows.length > 0;

    }

    //--------------------------------------------------------
    // SQL Formatter
    //--------------------------------------------------------

    function formatSql(sql, params) {

        let formatted = sql;

        params.forEach(value => {

            let replacement;

            if (
                value === null ||
                value === undefined
            ) {

                replacement = "NULL";

            }
            else if (
                typeof value === "number"
            ) {

                replacement =
                    value.toString();

            }
            else {

                replacement =
                    "'" +
                    value
                        .toString()
                        .replaceAll(
                            "'",
                            "''"
                        )
                    + "'";

            }

            formatted =
                formatted.replace(
                    "?",
                    replacement
                );

        });

        return formatted;

    }

        //--------------------------------------------------------
    // SELECT Helpers
    //--------------------------------------------------------

    function selectAll(sql, params = []) {

        const result =
            select(sql, params);

        if (result.length === 0)
            return [];

        const columns =
            result[0].columns;

        const values =
            result[0].values;

        return values.map(row => {

            const obj = {};

            columns.forEach((column, index) => {

                obj[column] = row[index];

            });

            return obj;

        });

    }

    function selectOne(sql, params = []) {

        const rows =
            selectAll(sql, params);

        if (rows.length === 0)
            return null;

        return rows[0];

    }

    //--------------------------------------------------------
    // Scalar Helper
    //--------------------------------------------------------

    function scalar(sql, params = []) {

        const row =
            selectOne(sql, params);

        if (row === null)
            return null;

        const keys =
            Object.keys(row);

        if (keys.length === 0)
            return null;

        return row[keys[0]];

    }

    //--------------------------------------------------------
    // Row Count
    //--------------------------------------------------------

    function rowCount(tableName) {

        return scalar(

            `SELECT COUNT(*) FROM ${tableName}`

        );

    }

    //--------------------------------------------------------
    // Table Exists
    //--------------------------------------------------------

    function tableExists(tableName) {

        return exists(

            `SELECT name
               FROM sqlite_master
              WHERE type='table'
                AND name=?`,

            [tableName]

        );

    }

    //--------------------------------------------------------
    // Column Exists
    //--------------------------------------------------------

    function columnExists(
        tableName,
        columnName
    ) {

        ensureDatabaseOpen();

        const stmt =
            db.prepare(
                `PRAGMA table_info(${tableName})`
            );

        const columns = [];

        while (stmt.step()) {

            columns.push(
                stmt.getAsObject()
            );

        }

        stmt.free();

        return columns.some(col =>

            col.name === columnName

        );

    }

    //--------------------------------------------------------
    // Execute Script
    //--------------------------------------------------------

    function executeScript(sqlScript) {

        ensureDatabaseOpen();

        db.exec(sqlScript);

        addLog(

            "SCRIPT",

            sqlScript

        );

    }

    //--------------------------------------------------------
    // Vacuum
    //--------------------------------------------------------

    function vacuum() {

        execute(

            "VACUUM"

        );

    }

    //--------------------------------------------------------
    // Integrity Check
    //--------------------------------------------------------

    function integrityCheck() {

        return scalar(

            "PRAGMA integrity_check"

        );

    }


        //--------------------------------------------------------
    // Database Metadata
    //--------------------------------------------------------

    function getTables() {

        const rows = selectAll(

            `
            SELECT name
              FROM sqlite_master
             WHERE type='table'
             ORDER BY name
            `

        );

        return rows.map(r => r.name);

    }

    function getColumns(tableName) {

        validateIdentifier(tableName);

        ensureDatabaseOpen();

        const stmt = db.prepare(

            `PRAGMA table_info(${tableName})`

        );

        const columns = [];

        while (stmt.step()) {

            columns.push(

                stmt.getAsObject()

            );

        }

        stmt.free();

        return columns;

    }

    //--------------------------------------------------------
    // Identifier Validation
    //--------------------------------------------------------

    function validateIdentifier(identifier) {

        const regex =

            /^[A-Za-z][A-Za-z0-9_]*$/;

        if (!regex.test(identifier)) {

            throw new Error(

                "Invalid SQLite identifier : "

                + identifier

            );

        }

    }

    //--------------------------------------------------------
    // Schema Validation
    //--------------------------------------------------------

    function requireTables(tableNames) {

        tableNames.forEach(table => {

            if (!tableExists(table)) {

                throw new Error(

                    "Required table not found : "

                    + table

                );

            }

        });

    }

    //--------------------------------------------------------
    // Version
    //--------------------------------------------------------

    function getSQLiteVersion() {

        return scalar(

            "select sqlite_version()"

        );

    }

    //--------------------------------------------------------
    // Database Statistics
    //--------------------------------------------------------

    function getStatistics() {

        return {

            database: dbFileName,

            version: getSQLiteVersion(),

            tables: getTables().length

        };

    }

    //--------------------------------------------------------
    // Public API
    //--------------------------------------------------------

    return {

    initialize,

    open,

    save,

    close,

    begin,

    commit,

    rollback,

    execute,

    executeScript,

    select,

    selectAll,

    selectOne,

    scalar,

    exists,

    tableExists,

    columnExists,

    rowCount,

    vacuum,

    integrityCheck,

    getTables,

    getColumns,

    requireTables,

    getSQLiteVersion,

    getStatistics,

    isOpen,

    getDatabaseName,

    getLog,

    clearLog

};

})();