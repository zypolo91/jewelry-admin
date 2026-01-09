import { apiRequest } from './base';

export class JewelryCategoryAPI {
  static async getList() {
    return apiRequest('/jewelry-categories');
  }

  static async create(data: any) {
    return apiRequest('/jewelry-categories', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async update(id: number, data: any) {
    return apiRequest(`/jewelry-categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  static async delete(id: number) {
    return apiRequest(`/jewelry-categories/${id}`, {
      method: 'DELETE'
    });
  }
}
