export function calculateFCFS(processes) {
  const n = processes.length;
  const completed = [];
  const readyQueue = [];
  const remaining = [...processes]; // Don't mutate the original array
  const addedToQueue = new Set(); // Track added process IDs
  let currentTime = 0;
  let totalIdle = 0;
  const ganttChart = [];
  while (completed.length < n) {
    // Add processes that have arrived and are not in queue
    remaining.forEach((p) => {
      if (p.arrival <= currentTime && !addedToQueue.has(p.process)) {
        readyQueue.push(p);
        addedToQueue.add(p.process);
      }
    });
    if (readyQueue.length === 0) {
      // Jump to next arrival and log idle time per unit
      const nextArrival = remaining
        .filter((p) => !completed.some((c) => c.process === p.process))
        .sort((a, b) => a.arrival - b.arrival)[0]?.arrival;
      if (nextArrival !== undefined && nextArrival > currentTime) {
        for (let t = currentTime; t < nextArrival; t++) {
          // Calculate the queue during idle time
          const queueDuringIdle = remaining
            .filter(
              (proc) =>
                proc.arrival <= t &&
                !completed.some((c) => c.process === proc.process)
            )
            .sort((a, b) => a.arrival - b.arrival)
            .map((proc) => proc.process);
          // Detect arriving process exactly at the end of this idle unit
          const arrivalsAtEnd = remaining
            .filter((proc) => proc.arrival === t + 1)
            .map((proc) => proc.process);
          ganttChart.push({
            label: "i",
            start: t,
            end: t + 1,
            queue: queueDuringIdle,
            arrived: arrivalsAtEnd.length ? arrivalsAtEnd : null, // Process arriving at end of this idle time
          });
          totalIdle++;
        }
        currentTime = nextArrival;
      } else {
        break;
      }
    } else {
      const p = readyQueue.shift();
      const start = Math.max(currentTime, p.arrival);
      const end = start + p.burst;
      const turnaround = end - p.arrival;
      const waiting = turnaround - p.burst;
      // Get all other ready processes during execution, sorted by arrival time
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
      });
    }
  }
  return { result: completed, totalTime: currentTime, totalIdle, ganttChart };
  console.table(processes);
}
