import request from "@/utils/request";

export type UpsertBodyMetricReq = {
  recordDate: string; // yyyy-MM-dd
  weightKg?: number | null;
  bodyFatPct?: number | null;
  chestCm?: number | null;
  waistCm?: number | null;
  hipCm?: number | null;
  remark?: string | null;
};

export type BodyMetricResp = {
  id: number;
  recordDate: string;
  weightKg?: number | null;
  bodyFatPct?: number | null;
  chestCm?: number | null;
  waistCm?: number | null;
  hipCm?: number | null;
  bmi?: number | null;
  bmiLevel?: string | null;
  bmiAdvice?: string | null;
};

export type BodyMetricTrendResp = {
  dates: string[];
  weightKg: (number | null)[];
  bodyFatPct: (number | null)[];
  waistCm: (number | null)[];
  hipCm: (number | null)[];
  chestCm: (number | null)[];
  bmi: (number | null)[];
};

export function upsertBodyMetric(data: UpsertBodyMetricReq) {
  return request.post("/api/body-metric", data);
}

export function getLatestBodyMetric() {
  return request.get("/api/body-metric/latest");
}

export function getBodyMetricByDate(date: string) {
  return request.get("/api/body-metric/date", { params: { date } });
}

export function getBodyMetricTrend(start: string, end: string) {
  return request.get("/api/body-metric/trend", { params: { start, end } });
}

export function deleteBodyMetric(id: number) {
  return request.delete(`/api/body-metric/${id}`);
}
