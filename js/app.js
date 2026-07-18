"use strict";

/*
------------------------------------------------------------
LFM Content Studio

Application Bootstrap

------------------------------------------------------------
*/

const App = {

    version: "0.1",

    dbLoaded: false

};

document.addEventListener(
    "DOMContentLoaded",
    initializeApplication
);

function initializeApplication() {

    writeMessage(
        "LFM Content Studio started."
    );

    wireEvents();

    updateStatus(
        "Disconnected",
        false
    );

}

function wireEvents() {

    document
        .getElementById("btnOpenDatabase")
        .addEventListener(
            "click",
            openDatabase
        );

    document
        .getElementById("btnSaveDatabase")
        .addEventListener(
            "click",
            saveDatabase
        );

    document
        .getElementById("btnClear")
        .addEventListener(
            "click",
            clearScreen
        );

}

async function openDatabase() {

    const picker =
        document.getElementById(
            "fileDatabase"
        );

    picker.value = "";

    picker.click();

    picker.onchange = async function () {

        if (
            picker.files.length === 0
        )
            return;

        try {

            await SQLiteManager.open(
                picker.files[0]
            );

            App.dbLoaded = true;

            document
                .getElementById(
                    "lblDatabase"
                ).textContent =
                SQLiteManager.getDatabaseName();

            updateStatus(
                "Connected",
                true
            );

            document
                .getElementById(
                    "btnSaveDatabase"
                ).disabled = false;

            document
                .getElementById(
                    "btnSaveLesson"
                ).disabled = false;

            refreshLogs();

            writeMessage(
                "Database opened successfully."
            );

            document.title =
                "LFM Content Studio - "
                + SQLiteManager.getDatabaseName();

        }
        catch (ex) {

            alert(ex.message);

            writeMessage(
                ex.message
            );

        }

    };

}

function saveDatabase() {

    try {

        SQLiteManager.save();

        refreshLogs();

        writeMessage(
            "Database saved."
        );

    }
    catch (ex) {

        alert(ex.message);

        writeMessage(
            ex.message
        );

    }

}

function clearScreen() {

    document
        .querySelectorAll(
            "input[type=text],input[type=number],textarea"
        )
        .forEach(control => {

            if (
                control.id !== "txtSqlLog" &&
                control.id !== "txtMessageLog"
            ) {

                control.value = "";

            }

        });

    writeMessage(
        "Screen cleared."
    );

}

function updateStatus(
    text,
    connected
) {

    const label =
        document.getElementById(
            "lblStatus"
        );

    label.textContent = text;

    if (connected) {

        label.classList.remove(
            "disconnected"
        );

        label.classList.add(
            "connected"
        );

    }
    else {

        label.classList.remove(
            "connected"
        );

        label.classList.add(
            "disconnected"
        );

    }

}

function writeMessage(message) {

    const area =
        document.getElementById(
            "txtMessageLog"
        );

    const time =
        new Date()
            .toLocaleTimeString();

    area.value +=
        "[" +
        time +
        "] " +
        message +
        "\n";

    area.scrollTop =
        area.scrollHeight;

}

function refreshSqlLog() {

    document
        .getElementById(
            "txtSqlLog"
        ).value =
        SQLiteManager.getLog();

}