interface DateRecord {
  created_at: string;
}

export function getUsersThisMonth<T extends DateRecord>(users: T[]): number {
  const now = new Date();
  return users.filter(u => {
    const userDate = new Date(u.created_at);
    return userDate.getMonth() === now.getMonth() && 
           userDate.getFullYear() === now.getFullYear();
  }).length;
}

export function getUsersThisWeek<T extends DateRecord>(users: T[]): number {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  return users.filter(u => new Date(u.created_at) >= weekAgo).length;
}

export function getUsersToday<T extends DateRecord>(users: T[]): number {
  const today = new Date().toDateString();
  return users.filter(u => new Date(u.created_at).toDateString() === today).length;
}

export function getDaysInCurrentMonth(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
}

// Get the start (Monday) and end (Sunday) of last week
export function getLastWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday...
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  // This week's Monday at 00:00:00
  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() - diffToMonday);
  thisMonday.setHours(0, 0, 0, 0);
  
  // Last week: Monday to Sunday
  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(thisMonday.getDate() - 7);
  
  const lastSunday = new Date(thisMonday);
  lastSunday.setDate(thisMonday.getDate() - 1);
  lastSunday.setHours(23, 59, 59, 999);
  
  return { start: lastMonday, end: lastSunday };
}

// Get start of current week (Monday)
export function getThisWeekStart(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() - diffToMonday);
  thisMonday.setHours(0, 0, 0, 0);
  
  return thisMonday;
}

// Count records from last week
export function getRecordsLastWeek<T extends DateRecord>(records: T[]): number {
  const { start, end } = getLastWeekRange();
  return records.filter(r => {
    const date = new Date(r.created_at);
    return date >= start && date <= end;
  }).length;
}

// Count records from this week (Monday to now)
export function getRecordsThisWeek<T extends DateRecord>(records: T[]): number {
  const thisMonday = getThisWeekStart();
  return records.filter(r => new Date(r.created_at) >= thisMonday).length;
}

// Format week range for display (e.g., "2-8 dic")
export function formatWeekRange(range: { start: Date; end: Date }): string {
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const startDay = range.start.getDate();
  const endDay = range.end.getDate();
  const startMonth = months[range.start.getMonth()];
  const endMonth = months[range.end.getMonth()];
  
  if (startMonth === endMonth) {
    return `${startDay}-${endDay} ${endMonth}`;
  }
  return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
}
