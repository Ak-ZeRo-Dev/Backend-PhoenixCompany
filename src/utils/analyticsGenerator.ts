import { Document, Model } from "mongoose";

export const generateLastYear = async <T extends Document>(
  model: Model<T>
): Promise<{ lastYear: MonthData[] }> => {
  const lastYear: MonthData[] = [];
  const currentDate = new Date();

  for (let i = 0; i < 12; i++) {
    const startDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - i,
      1
    );

    const endDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - i + 1,
      0
    );

    const monthYear = startDate.toLocaleString("default", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const count = await model.countDocuments({
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    lastYear.unshift({
      month: monthYear,
      count,
    });
  }

  return { lastYear };
};

export const generateLastMonth = async <T extends Document>(
  model: Model<T>
): Promise<{ monthData: LastMonthData }> => {
  const currentDate = new Date();
  const lastMonth = currentDate.getMonth() - 1;

  const monthData: LastMonthData = {
    month: new Date(currentDate.getFullYear(), lastMonth, 1).toLocaleString(
      "default",
      { month: "short" }
    ),
    data: [],
  };

  for (let i = 0; i < 4; i++) {
    const startDate = new Date(currentDate.getFullYear(), lastMonth, i * 7 + 1);
    const endDate = new Date(
      currentDate.getFullYear(),
      lastMonth,
      (i + 1) * 7 + 1
    );

    const count = await model.countDocuments({
      createdAt: {
        $gte: startDate,
        $lt: endDate,
      },
    });

    monthData.data.push({
      week: i + 1,
      count,
    });
  }
  return { monthData };
};

export const generateLastWeek = async <T extends Document>(
  model: Model<T>
): Promise<{ lastWeekData: LastWeekData[] }> => {
  const currentDate = new Date();
  const lastWeekData: LastWeekData[] = [];

  for (let i = 6; i >= 0; i--) {
    const startDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate() - i
    );
    const endDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate() - i + 1
    );

    const count = await model.countDocuments({
      createdAt: {
        $gte: startDate,
        $lt: endDate,
      },
    });

    lastWeekData.push({
      date: startDate.toLocaleDateString("default", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      day: startDate.toLocaleDateString("default", { weekday: "short" }),
      count,
    });
  }
  return { lastWeekData };
};
