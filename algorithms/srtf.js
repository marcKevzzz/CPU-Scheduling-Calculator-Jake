export function calculateSRTF(processes) {
  const ganttChart = [];
  const completed = [];

  const remaining = processes.map((p) => ({
    ...p,
    remaining: p.burst,
    start: null,
    end: null,
  }));

  let currentTime = 0;
  let totalIdle = 0;
  let lastProcess = null;

  while (completed.length < processes.length) {
    const readyQueue = remaining
      .filter((p) => p.arrival <= currentTime && p.remaining > 0)
      .sort((a, b) =>
        a.remaining !== b.remaining
          ? a.remaining - b.remaining
          : a.arrival - b.arrival
      );

    if (readyQueue.length === 0) {
      const arrivedDuringIdle = remaining
        .filter((p) => p.arrival <= currentTime + 1 && p.remaining > 0)

        .map((p) => ({
          process: p.process,
          priority: p.priority || null,
          burst: p.remaining, // Show remaining burst instead of original burst
          rbt: p.remaining,
        }));

      ganttChart.push({
        label: "i",
        start: currentTime,
        end: currentTime + 1,
        queue: [],
        arrived: arrivedDuringIdle.length > 0 ? arrivedDuringIdle : null,
        rbt: null,
      });

      totalIdle++;
      currentTime++;
      lastProcess = null;
      continue;
    }

    const currentProc = readyQueue[0];

    if (currentProc.start === null) {
      currentProc.start = currentTime;
    }

    const start = currentTime;
    currentProc.remaining--;
    currentTime++;
    const end = currentTime;

    const queueSnapshot = remaining
      .filter((p) => p.arrival <= currentTime && p.remaining > 0)

      .sort((a, b) => a.arrival - b.arrival)
      .map((p) => ({
        process: p.process,
        priority: p.priority || null,
        arrival: p.arrival,
        burst: p.remaining, // <-- Here burst equals remaining burst time (rbt)
        rbt: p.remaining,
      }));

    const ganttEntry = {
      label: currentProc.process,
      start,
      end,
      queue: queueSnapshot,
      arrived: [],
      rbt: currentProc.remaining,
    };

    const lastGantt = ganttChart[ganttChart.length - 1];
    if (
      lastGantt &&
      lastGantt.label === currentProc.process &&
      lastGantt.end === start
    ) {
      lastGantt.end = end;
      lastGantt.rbt = currentProc.remaining;
      lastGantt.queue = queueSnapshot;
    } else {
      ganttChart.push(ganttEntry);
    }

    if (currentProc.remaining === 0) {
      currentProc.end = currentTime;
      const turnaround = currentProc.end - currentProc.arrival;
      const waiting = turnaround - currentProc.burst;
      completed.push({
        ...currentProc,
        completion: currentProc.end,
        turnaround,
        waiting,
      });
    }
  }

  return {
    result: completed,
    ganttChart,
    totalTime: currentTime,
    totalIdle,
  };
}
