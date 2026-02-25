// src/api/sport.ts
import request from "../utils/request"; // 如果你还没配 @ 别名，就用相对路径

export interface CreateSportRecordReq {
  sportType: string;
  durationMin: number;
  distanceKm?: number | null;
  recordDate: string;
  remark?: string;
}

export interface SportTypeItem {
  code: string;
  name: string;
  met?: number;
  needDistance?: boolean;
}

export function createSportRecord(data: CreateSportRecordReq) {
  return request.post("/api/sport-record", data);
}

export function getSportTypeListLocal() {
  return [
    { label: "跑步", value: "RUNNING", met: 9.8 },
    { label: "骑行", value: "CYCLING", met: 7.5 },
    { label: "游泳", value: "SWIMMING", met: 8.0 },
    { label: "力量训练", value: "STRENGTH_TRAINING", met: 6.0 },
    { label: "步行", value: "WALKING", met: 3.8 },
    { label: "跳绳", value: "JUMP_ROPE", met: 11.0 },
    { label: "羽毛球", value: "BADMINTON", met: 5.5 },
    { label: "篮球", value: "BASKETBALL", met: 6.5 },
    { label: "足球", value: "FOOTBALL", met: 7.0 },
    { label: "瑜伽", value: "YOGA", met: 3.0 },
    { label: "有氧操", value: "AEROBICS", met: 6.8 },
    { label: "徒步", value: "HIKING", met: 6.0 },
  ];
}
// 新增：按日期查明细
export function getSportRecordsByDate(date: string) {
  return request.get("/api/sport-record/date", {
    params: { date },
  });
}

// 新增：按月查日历聚合
export function getSportCalendar(year: number, month: number) {
  return request.get("/api/sport-record/calendar", {
    params: { year, month },
  });
}
