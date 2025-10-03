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
