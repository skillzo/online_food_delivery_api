// utils/pagination.ts
import { Document, Model } from "mongoose";

interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  pages: number;
}

interface PaginateOptions {
  page?: number;
  limit?: number;
  query?: object;
  sort?: object;
}

export const paginate = async <T extends Document>(
  model: Model<T>,
  options: PaginateOptions
): Promise<PaginationResult<T>> => {
  const { page = 1, limit = 10, query = {}, sort = {} } = options;
  const skip = (page - 1) * limit;

  const data = await model.find(query).skip(skip).limit(limit).sort(sort);
  const total = await model.countDocuments(query);

  return {
    data,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
};
