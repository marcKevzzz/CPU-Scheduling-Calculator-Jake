export function calculateRR(processes, quantum) {
  const n = processes.length;
  const queue = [];
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
  let i = 0;

  // Sort by arrival
  remaining.sort((a, b) => a.arrival - b.arrival);

  while (completed.length < n) {
    // Add processes that arrive at currentTime
    while (i < n && remaining[i].arrival <= currentTime) {
      queue.push(remaining[i]);
      i++;
    }

    if (queue.length === 0) {
      // Idle time handling
      currentTime++;

      while (i < n && remaining[i].arrival <= currentTime) {
        queue.push(remaining[i]);
        i++;
      }

      const arrived = remaining
        .filter((p) => p.arrival <= currentTime && p.remaining > 0)
        .map((p) => ({
          process: p.process,
          priority: p.priority || null,
          rbt: p.remaining,
        }));

      ganttChart.push({
        label: "i",
        start: currentTime - 1,
        end: currentTime,
        burstUsed: 1,
        rbt: null,
        queue: [],
        arrived: arrived,
      });

      totalIdle++;
      continue;
    }

    const current = queue.shift();
    const executionTime = Math.min(current.remaining, quantum); // ✅ always respect time quantum

    const sliceStart = currentTime;
    const sliceEnd = sliceStart + executionTime;
    const arrivedDuring = [];

    if (current.start === null) current.start = currentTime;

    // Simulate execution for each unit of the quantum
    for (let t = 0; t < executionTime; t++) {
      currentTime++;

      while (i < n && remaining[i].arrival <= currentTime) {
        const arriving = remaining[i];
        queue.push(arriving);
        // Only add to arrivedDuring if the process is not already in the queue
        if (!queue.some((p) => p.process === arriving.process)) {
          arrivedDuring.push({
            process: arriving.process,
            priority: arriving.priority || null,
            rbt: arriving.remaining,
          });
        }
        i++;
      }
    }

    current.remaining -= executionTime;

    let queueBefore = queue.map((p) => ({
      process: p.process,
      priority: p.priority || null,
      rbt: p.remaining,
    }));

    // Include the current process in the queue snapshot ONLY if it's not yet finished
    if (current.remaining > 0) {
      queueBefore = [
        {
          process: current.process,
          priority: current.priority || null,
          rbt: current.remaining,
        },
        ...queueBefore,
      ];
    }

    if (current.remaining > 0) {
      queue.push(current); // return to queue
    } else {
      current.end = currentTime;
      const turnaround = current.end - current.arrival;
      const waiting = turnaround - current.burst;
      completed.push({
        ...current,
        completion: current.end,
        turnaround,
        waiting,
      });
    }

    ganttChart.push({
      label: current.process,
      start: sliceStart,
      end: sliceEnd,
      burstUsed: executionTime,
      rbt: current.remaining,
      queue: queueBefore,
      arrived: arrivedDuring,
    });
  }

  return {
    result: completed,
    ganttChart,
    totalTime: currentTime,
    totalIdle,
  };
}
