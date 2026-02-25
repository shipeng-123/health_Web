import request from "@/utils/request";

export function getDailyCalorieSummaryApi(date: string) {
  return request.get("/api/daily-calorie/summary", {
    params: { date },
  });
}
