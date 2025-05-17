export function calculateNPP(processes) {
  const n = processes.length;
  const completed = [];
  const readyQueue = [];
  const remaining = [...processes]; // Don't mutate original array
  const addedToQueue = new Set(); // Track added processes

  let currentTime = 0;
  let totalIdle = 0;
  const ganttChart = [];

  while (completed.length < n) {
    // Add arrived processes to the ready queue if not already added
    remaining.forEach((p) => {
      if (p.arrival <= currentTime && !addedToQueue.has(p.process)) {
        readyQueue.push(p);
        addedToQueue.add(p.process);
      }
    });

    // Sort by priority (lower value = higher priority), then by arrival time
    readyQueue.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.arrival - b.arrival;
    });

    if (readyQueue.length === 0) {
      // No ready process, system is idle
      const nextArrival = remaining
        .filter((p) => !completed.some((c) => c.process === p.process))
        .sort((a, b) => a.arrival - b.arrival)[0]?.arrival;

      if (nextArrival !== undefined && nextArrival > currentTime) {
        for (let t = currentTime; t < nextArrival; t++) {
          const queueDuringIdle = remaining
            .filter(
              (proc) =>
                proc.arrival <= t &&
                !completed.some((c) => c.process === proc.process)
            )
            .sort((a, b) => a.arrival - b.arrival) // 🔄 Sort by arrival
            .map((proc) => ({
              process: proc.process,
              priority: proc.priority,
            }));

          const arrivalsAtEnd = remaining
            .filter((proc) => proc.arrival === t + 1)
            .map((proc) => ({
              process: proc.process,
              priority: proc.priority,
            }));

          ganttChart.push({
            label: "i",
            start: t,
            end: t + 1,
            queue: queueDuringIdle,
            arrived: arrivalsAtEnd.length ? arrivalsAtEnd : null,
          });

          totalIdle++;
        }

        currentTime = nextArrival;
      } else {
        break;
      }
    } else {
      // Pick highest priority process (lowest priority number)
      const p = readyQueue.shift();
      const start = Math.max(currentTime, p.arrival);
      const end = start + p.burst;
      const turnaround = end - p.arrival;
      const waiting = turnaround - p.burst;

      const queueDuringExecution = remaining
        .filter(
          (proc) =>
            proc.arrival <= end &&
            !completed.some((c) => c.process === proc.process) &&
            proc.process !== p.process
        )
        .sort((a, b) => a.arrival - b.arrival) // 🔄 Sort by arrival
        .map((proc) => ({
          process: proc.process,
          priority: proc.priority,
        }));

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
        priority: p.priority,
      });
    }
  }
  console.log(processes);
  console.log(ganttChart);

  return {
    result: completed,
    totalTime: currentTime,
    totalIdle,
    ganttChart,
  };
}
