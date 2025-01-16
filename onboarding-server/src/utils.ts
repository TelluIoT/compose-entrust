
const logPerformanceMetrics = (startTimePerformance: number, endTimePerformance: number, startDate: Date, endDate: Date) => {
    const elapsedTime = endTimePerformance - startTimePerformance;

    console.table([
        { Metric: 'Start Time', Value: startDate.toISOString() },
        { Metric: 'End Time', Value: endDate.toISOString() },
        { Metric: 'Elapsed Time (ms)', Value: elapsedTime.toFixed(2) },
    ]);
};

export {
    logPerformanceMetrics,
}