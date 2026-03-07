// src/api/plan.ts
import request from "@/utils/request";

export type ApiResult<T> = {
  code: number;
  message: string;
  data: T;
};

export type PlanTemplateResp = {
  id: number;
  name: string;
  description?: string;
};

export type PlanTemplateItemResp = {
  dayOfWeek: number;
  sportType: string;
  targetDurationMin: number;
  targetDistanceKm?: number | null;
  remindTime?: string | null;
  remark?: string | null;
};

export type PlanTemplateDetailResp = {
  id: number;
  name: string;
  description?: string;
  items: PlanTemplateItemResp[];
};

export type ApplyTemplateReq = {
  templateId: number;
  weekStartDate: string;
  name?: string;
};

export type WeekPlanItemResp = {
  id: number;
  planDate: string;
  dayOfWeek: number;
  sportType: string;
  targetDurationMin: number;
  targetDistanceKm?: number | null;
  remindTime?: string | null;
  remark?: string | null;
  done: number;
  doneTime?: string | null;
};

export type WeekPlanResp = {
  planId?: number | null;
  planName?: string | null;
  weekStartDate: string;
  totalCount: number;
  doneCount: number;
  completionRate: number;
  items: WeekPlanItemResp[];
};

export type WeekPlanItemReq = {
  dayOfWeek: number;
  sportType: string;
  targetDurationMin: number;
  targetDistanceKm?: number | null;
  remindTime?: string | null;
  remark?: string | null;
};

export type SaveWeekPlanReq = {
  weekStartDate: string;
  name?: string;
  items: WeekPlanItemReq[];
};

export type TodayPlanItemResp = {
  id: number;
  dayOfWeek: number;
  sportType: string;
  targetDurationMin: number;
  targetDistanceKm?: number | null;
  remindTime?: string | null;
  remark?: string | null;
  done: number;
  doneTime?: string | null;
};

export type TodayPlanResp = {
  date: string;
  weekStartDate: string;
  planId?: number | null;
  planName?: string | null;
  totalCount: number;
  doneCount: number;
  completionRate: number;
  items: TodayPlanItemResp[];
};

export type PlanCheckinReq = {
  planItemId: number;
  done?: boolean;
};

export type PlanStatResp = {
  startDate: string;
  endDate: string;
  totalItems: number;
  doneItems: number;
  completionRate: number;
};

export function listPlanTemplates() {
  return request.get<any, ApiResult<PlanTemplateResp[]>>(
    "/api/plan/template/list"
  );
}

export function getPlanTemplateDetail(id: number) {
  return request.get<any, ApiResult<PlanTemplateDetailResp>>(
    `/api/plan/template/${id}`
  );
}

export function applyTemplateToWeek(data: ApplyTemplateReq) {
  return request.post<
    any,
    ApiResult<{ planId: number; weekStartDate: string; name: string }>
  >("/api/plan/week/apply-template", data);
}

export function saveWeekPlan(data: SaveWeekPlanReq) {
  return request.post<
    any,
    ApiResult<{ planId: number; weekStartDate: string; name: string }>
  >("/api/plan/week/save", data);
}

export function getWeekPlan(weekStartDate: string) {
  return request.get<any, ApiResult<WeekPlanResp>>("/api/plan/week", {
    params: { weekStartDate },
  });
}

export function getTodayPlan(date: string) {
  return request.get<any, ApiResult<TodayPlanResp>>("/api/plan/today", {
    params: { date },
  });
}

export function checkinPlan(data: PlanCheckinReq) {
  return request.post<any, ApiResult<string>>("/api/plan/checkin", data);
}

export function statWeek(weekStartDate: string) {
  return request.get<any, ApiResult<PlanStatResp>>("/api/plan/stat/week", {
    params: { weekStartDate },
  });
}

export function statMonth(year: number, month: number) {
  return request.get<any, ApiResult<PlanStatResp>>("/api/plan/stat/month", {
    params: { year, month },
  });
}
