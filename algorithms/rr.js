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
    // Add to queue any arriving processes at current time
    while (i < n && remaining[i].arrival <= currentTime) {
      queue.push(remaining[i]);
      i++;
    }

    // 1️⃣ CPU is idle
    if (queue.length === 0) {
      currentTime++;

      const arrived = [];
      // Check if any process arrives exactly now
      while (i < n && remaining[i].arrival <= currentTime) {
        queue.push(remaining[i]);
        arrived.push({
          process: remaining[i].process,
          priority: remaining[i].priority || null,
        });
        i++;
      }

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

    // 2️⃣ Check if all have arrived
    const allArrived = i >= n;

    // Use quantum or full remaining burst if no more future arrivals
    const executionTime = allArrived
      ? current.remaining
      : Math.min(current.remaining, quantum);

    const sliceStart = currentTime;
    const sliceEnd = sliceStart + executionTime;
    const arrivedDuring = [];

    if (current.start === null) current.start = currentTime;

    // Clone queue state before execution (for ganttChart)
    // Only store process names and priority, without sorting
    const queueBefore = queue.map((p) => ({
      process: p.process,
      priority: p.priority || null,
    }));

    // Execute the process for the time slice
    for (let t = 0; t < executionTime; t++) {
      currentTime++;

      // Handle new arrivals during execution (append at the end of queue)
      while (i < n && remaining[i].arrival <= currentTime) {
        queue.push(remaining[i]);
        arrivedDuring.push({
          process: remaining[i].process,
          priority: remaining[i].priority || null,
        });
        i++;
      }
    }

    current.remaining -= executionTime;

    // Predict if process will return to queue
    if (current.remaining > 0) {
      // Append current process at the end of the queue
      queue.push(current);
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
