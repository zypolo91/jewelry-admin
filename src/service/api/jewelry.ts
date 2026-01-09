import { apiRequest, buildSearchParams } from './base';

export class JewelryAPI {
  static async getList(params?: Record<string, any>) {
    const searchParams = buildSearchParams(params || {});
    return apiRequest(`/jewelries${searchParams ? `?${searchParams}` : ''}`);
  }

  static async getDetail(id: number) {
    return apiRequest(`/jewelries/${id}`);
  }

  static async create(data: any) {
    return apiRequest('/jewelries', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async update(id: number, data: any) {
    return apiRequest(`/jewelries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  static async delete(id: number) {
    return apiRequest(`/jewelries/${id}`, {
      method: 'DELETE'
    });
  }

  static async batch(
    action: 'updateStatus' | 'delete',
    ids: number[],
    data?: any
  ) {
    return apiRequest('/jewelries/batch', {
      method: 'POST',
      body: JSON.stringify({ action, ids, data })
    });
  }

  static async statistics() {
    return apiRequest('/jewelries/statistics');
  }

  static async upload(formData: FormData) {
    return apiRequest('/jewelries/upload', {
      method: 'POST',
      body: formData,
      headers: {}
    });
  }
}
