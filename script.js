import {
  renderResultTableTurnaround,
  renderResultTableWaiting,
  renderGanttChart,
  generateTimeline,
  renderCPUUtilization,
  getProcessData,
  updateTableColumns,
  resetUI,
} from "./algorithms/render.js";

import { calculateFCFS } from "./algorithms/fcfs.js";
import { calculateSJF } from "./algorithms/sjf.js";
import { calculateNPP } from "./algorithms/npp.js";
import { calculateRR } from "./algorithms/rr.js";
import { calculateSRTF } from "./algorithms/srtf.js";
import { calculatePP } from "./algorithms/pp.js";

function scheduleAndRender(algorithm, options = {}, mode) {
  resetUIS();
  const { processes, timeQuantum } = getProcessData(mode);
  if (!processes || !processes.length) return;

  try {
    const output =
      options.algorithm === "RR"
        ? algorithm(processes, timeQuantum)
        : algorithm(processes);

    const { result, totalTime, totalIdle, ganttChart } = output;

    renderResultTableTurnaround(result);
    renderResultTableWaiting(result);
    renderGanttChart(result, options, ganttChart);
    generateTimeline(result);
    renderCPUUtilization(totalIdle, result, ganttChart);
  } catch (error) {
    console.error("Error during scheduling or rendering:", error);
  }
}

let algorithmValue = "";

function validateTableInputs(algorithm, options = {}, mode) {
  let invalid = false;
  let firstInvalidInput = null;
  const regex = /^\d+$/;

  const arrivalInput = document.querySelectorAll(".input-box")[0];
  const burstInput = document.querySelectorAll(".input-box")[1];
  const priorityInput = document.querySelector(".extraInput"); // Optional
  const timeQuantumInput = document.getElementById("timeQuantum");

  // Helper: Parse and validate input string
  function parseAndValidate(input, name) {
    const raw = input.value.trim();
    const values = raw
      .split(/[\s,]+/) // Split by comma or space or both
      .map((v) => v.trim())
      .filter((v) => v !== ""); // Remove empty values

    const allValid = values.length > 0 && values.every((v) => regex.test(v));

    if (!allValid) {
      input.classList.add("is-invalid");
      if (!firstInvalidInput) firstInvalidInput = input;
      showToast(`Invalid ${name} input.`);
      return null;
    } else {
      input.classList.remove("is-invalid");
      return values;
    }
  }

  // Validate inputs
  const arrivalValues = parseAndValidate(arrivalInput, "arrival");
  const burstValues = parseAndValidate(burstInput, "burst");
  if (!arrivalValues || !burstValues) invalid = true;

  let priorityValues = [];
  if (mode === "priority" && priorityInput) {
    priorityValues = parseAndValidate(priorityInput, "priority");
    if (!priorityValues) invalid = true;
  }

  if (mode === "roundrobin" && timeQuantumInput) {
    const tq = timeQuantumInput.value.trim();
    if (!regex.test(tq)) {
      timeQuantumInput.classList.add("is-invalid");
      showToast("Time Quantum must be a valid integer.");
      if (!firstInvalidInput) firstInvalidInput = timeQuantumInput;
      invalid = true;
    } else {
      timeQuantumInput.classList.remove("is-invalid");
    }
  }
  console.log(timeQuantumInput);
  console.log(mode);

  // Match input counts
  if (!invalid) {
    const arrivalCount = arrivalValues.length;
    const burstCount = burstValues.length;
    const priorityCount = priorityValues.length;

    if (
      arrivalCount !== burstCount ||
      (mode === "priority" && priorityCount !== arrivalCount)
    ) {
      showToast("Mismatch in input counts.");
      invalid = true;
    }
  }

  // Scroll to and focus first invalid input
  if (invalid) {
    if (firstInvalidInput) {
      firstInvalidInput.scrollIntoView({ behavior: "smooth", block: "center" });
      firstInvalidInput.focus();
    }
    return false;
  }

  // Show hidden containers and run algorithm
  document.querySelectorAll(".hide").forEach((h) => h.classList.remove("hide"));
  showToast("Calculate Successful", true);
  document.querySelector("#h-mo").classList.remove("h-mo");
  scheduleAndRender(algorithm, options, mode);
}

function resetUIS() {
  [
    "head",
    "gbody",
    "tail",
    "queue",
    "turnaroundTable",
    "resultTableWaitingTime",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = "";
  });
}

document.addEventListener("DOMContentLoaded", function () {
  const items = document.querySelectorAll(".algorithm-item");

  items.forEach((item) => {
    item.addEventListener("click", () => {
      const selectedValue = item.dataset.value?.trim();
      algorithmValue = selectedValue;
      const b =
        selectedValue === "NPP" || selectedValue === "PP"
          ? "priority"
          : selectedValue === "RR"
          ? "roundrobin"
          : "";

      updateTableColumns(b);
    });
  });

  const clearBtn = document.getElementById("clear");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      // Reset algorithm value and radio buttons FIRST
      algorithmValue = "";

      resetUI(algorithmValue);
      showToast("Calculation restart!", true);
    });
  }

  const calculate = document.getElementById("calculate");

  calculate.addEventListener("click", () => {
    if (!algorithmValue) {
      showToast("Please select an algorithm.");

      document.getElementById("section-algo").scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      return;
    }

    let algorithmFn;
    let algos;
    switch (algorithmValue) {
      case "FCFS":
        algorithmFn = calculateFCFS;
        break;
      case "SJF":
        algorithmFn = calculateSJF;
        break;
      case "NPP":
        algorithmFn = calculateNPP;
        algos = "priority";
        break;
      case "RR":
        algorithmFn = calculateRR;
        algos = "roundrobin";
        break;
      case "SRTF":
        algorithmFn = calculateSRTF;
        break;
      case "PP":
        algorithmFn = calculatePP;
        algos = "priority";
        break;
      default:
        showToast("Unknown algorithm selected.");
        return;
    }
    validateTableInputs(algorithmFn, { algorithm: algorithmValue }, algos);
  });

  document.getElementById("hideToast").addEventListener("click", (b) => {
    hideToast();
  });
});

let toastTimeout;

export function showToast(message, bool = false) {
  const toastLbl = document.getElementById("toastLbl");
  const toast = document.getElementById("toast-danger");
  if (bool) {
    const yes = document.getElementById("success");
    yes.classList.remove("hide");
    document.getElementById("no").classList.add("hide");
  } else {
    const no = document.getElementById("no");
    no.classList.remove("hide");
    document.getElementById("success").classList.add("hide");
  }

  // Set message
  toastLbl.textContent = message;

  // Show toast
  toast.classList.remove("hidden", "opacity-0");
  toast.classList.add("opacity-100");

  // Auto hide after 3s
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    hideToast();
  }, 3000);
}

function hideToast() {
  const toast = document.getElementById("toast-danger");
  toast.classList.add("opacity-0");

  setTimeout(() => {
    toast.classList.add("hidden");
  }, 100); // Match duration-300
}
