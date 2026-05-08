// API per cambio password
import client from './client';

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export const changePassword = (data: ChangePasswordRequest) =>
  client.post<{ message: string }>('/auth/change-password', data).then((r) => r.data);
