export const MAX_NEXT = 2000000000000;

export interface ITask {
   word: string;
   last: number;
   next: number;
   level: number;
}

export const studyTask = (task: ITask, level?: number): ITask => {
   if (level === undefined) level = ++task.level;
   if (level > 15) task.level = level = 15;
   if (level <= 0) task.level = level = 1;
   const now = Date.now();
   task.last = now;
   task.next =
      level >= 15 ? MAX_NEXT : now + Math.round(39 * level ** 3 * 1.5 ** level);
   return task;
};
