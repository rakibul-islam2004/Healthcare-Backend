import { Response } from "express";

interface IResponseData<T> {
  httpStatusCode: number;
  success: boolean;
  message: string;
  data?: T;
}

export const sendResponse = <T>(
  res: Response,
  responsData: IResponseData<T>,
) => {
  const { httpStatusCode, success, message, data } = responsData;
  res.status(httpStatusCode).json({
    success,
    message,
    data,
  });
};
