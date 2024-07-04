interface MonthData {
  month: string;
  count: number;
}

interface LastMonthData {
  month: string;
  data: { week: number; count: number }[];
}
interface LastWeekData {
  date: string;
  day: string;
  count: number;
}
