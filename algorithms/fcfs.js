export function calculateFCFS(processes) {
  const n = processes.length;
  const completed = [];
  const readyQueue = [];
  const remaining = [...processes]; // Avoid mutating original input
  const addedToQueue = new Set(); // Track added process IDs
  let currentTime = 0;
  let totalIdle = 0;
  const ganttChart = [];

  while (completed.length < n) {
    // Add newly arrived processes to the ready queue
    remaining.forEach((p) => {
      if (p.arrival <= currentTime && !addedToQueue.has(p.process)) {
        readyQueue.push(p);
        addedToQueue.add(p.process);
      }
    });

    if (readyQueue.length === 0) {
      // If no processes are ready, find the next arrival time
      const nextArrival = remaining
        .filter((p) => !completed.some((c) => c.process === p.process))
        .sort((a, b) => a.arrival - b.arrival)[0]?.arrival;

      if (nextArrival !== undefined && nextArrival > currentTime) {
        const staticQueue = remaining
          .filter(
            (proc) =>
              proc.arrival <= currentTime &&
              !completed.some((c) => c.process === proc.process)
          )
          .sort((a, b) => a.arrival - b.arrival)
          .map((proc) => proc.process);

        for (let t = currentTime; t < nextArrival; t++) {
          const arrivalsAtEnd = remaining
            .filter((proc) => proc.arrival === t + 1)
            .map((proc) => proc.process);

          ganttChart.push({
            label: "i",
            start: t,
            end: t + 1,
            queue: staticQueue,
            arrived: arrivalsAtEnd.length ? arrivalsAtEnd : null,
          });

          totalIdle++;
        }

        currentTime = nextArrival;
      } else {
        break; // No more processes to process
      }
    } else {
      readyQueue.sort((a, b) => a.arrival - b.arrival);
      const p = readyQueue.shift();
      const start = Math.max(currentTime, p.arrival);
      const end = start + p.burst;
      const turnaround = end - p.arrival;
      const waiting = turnaround - p.burst;
      const response = start - p.arrival;

      const queueDuringExecution = remaining
        .filter(
          (proc) =>
            proc.arrival <= end &&
            !completed.some((c) => c.process === proc.process) &&
            proc.process !== p.process
        )
        .sort((a, b) => a.arrival - b.arrival)
        .map((proc) => proc.process);

      ganttChart.push({
        label: `${p.process}`,
        start,
        end,
        queue: queueDuringExecution,
      });

      currentTime = end;

      completed.push({
        ...p,
        start,
        end,
        completion: end,
        turnaround,
        waiting,
        response,
      });
    }
  }

  // Optional: print original processes (debugging)
  // console.table(processes);

  return {
    result: completed,
    totalTime: currentTime,
    totalIdle,
    ganttChart,
  };
}
