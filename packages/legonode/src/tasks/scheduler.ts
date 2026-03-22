export type ScheduledTask = {
  name: string;
  cron: string;
  run: () => Promise<void> | void;
};

export function createScheduler() {
  const tasks: ScheduledTask[] = [];

  return {
    register: (task: ScheduledTask) => {
      tasks.push(task);
    },
    list: () => tasks.slice()
  };
}

