export interface ResponseDto<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface ApiResponseDto<T = any> extends ResponseDto<T> {
  statusCode?: number;
  timestamp?: string;
}
