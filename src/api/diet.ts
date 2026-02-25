import request from "@/utils/request";

export function createDietRecordApi(data: {
  foodItemId: number;
  mealType: number;
  intakeGram: number;
  recordDate: string;
  remark?: string;
}) {
  return request.post("/api/diet-record", data);
}

export function getDietRecordByDateApi(date: string) {
  return request.get("/api/diet-record/date", {
    params: { date },
  });
}
