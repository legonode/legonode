export function createScheduler() {
    const tasks = [];
    return {
        register: (task) => {
            tasks.push(task);
        },
        list: () => tasks.slice()
    };
}
//# sourceMappingURL=scheduler.js.map