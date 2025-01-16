const logPerformanceMetrics = (
    title: string,
    startTimePerformance: number,
    endTimePerformance: number,
    startDate: Date,
    endDate: Date
) => {
    const elapsedTime = endTimePerformance - startTimePerformance;

    const coloredTitle = `\n\x1b[36m${title}\x1b[0m`;
    console.log(coloredTitle);

    console.table([
        { Metric: 'Start Time', Value: startDate.toISOString() },
        { Metric: 'End Time', Value: endDate.toISOString() },
        { Metric: 'Elapsed Time (ms)', Value: elapsedTime.toFixed(2) },
    ]);
};

export {
    logPerformanceMetrics,
};