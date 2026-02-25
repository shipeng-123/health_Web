import request from "@/utils/request";

export interface FoodItem {
  id: number;
  foodName: string;
  category?: string;
  caloriePer100g: number;
  proteinPer100g?: number;
  fatPer100g?: number;
  carbPer100g?: number;
}

export interface CreateCustomFoodReq {
  foodName: string;
  category?: string;
  caloriePer100g: number;
  proteinPer100g?: number;
  fatPer100g?: number;
  carbPer100g?: number;
  unitHint?: string;
}

// 搜索食物
export function searchFoodApi(keyword?: string, limit = 20) {
  return request.get("/api/food/search", {
    params: { keyword, limit },
  });
}

export function createCustomFoodApi(data: CreateCustomFoodReq) {
  return request.post("/api/food/custom", data);
}
