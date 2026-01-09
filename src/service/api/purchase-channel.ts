import { apiRequest } from './base';

export class PurchaseChannelAPI {
  static async getList() {
    return apiRequest('/purchase-channels');
  }

  static async create(data: any) {
    return apiRequest('/purchase-channels', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async update(id: number, data: any) {
    return apiRequest(`/purchase-channels/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  static async delete(id: number) {
    return apiRequest(`/purchase-channels/${id}`, {
      method: 'DELETE'
    });
  }
}
