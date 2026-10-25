import { apiClient } from '../../../core/api/axios.client';

export interface SupplyDto {
    id: string;
    name: string;
    stock: number;
}

export const InventoryService = {
    getAllSupplies() {
        return apiClient.get<SupplyDto[]>('/inventory/supplies');
    }
};