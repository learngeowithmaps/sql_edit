"use strict";

document.addEventListener("DOMContentLoaded", initialize);

function initialize() {

    document
        .getElementById("btnGenerate")
        .addEventListener("click", generateLesson);

    document
        .getElementById("btnClear")
        .addEventListener("click", clearScreen);

}

function generateLesson() {

    alert("Coming in Sprint 2");

}

function clearScreen() {

    document
        .querySelectorAll("input, textarea")
        .forEach(element => {

            element.value = "";

        });

}