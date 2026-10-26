<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { InventoryService, SupplyDto } from '../services/inventory.service';

const supplies = ref<SupplyDto[]>([]);
const isLoading = ref(true);

onMounted(async () => {
    try {
        const response = await InventoryService.getAllSupplies();
        supplies.value = response.data;
    } catch (error) {
        console.error('Error fetching inventory:', error);
    } finally {
        isLoading.value = false;
    }
});
</script>

<template>
    <div class="inventory-container">
        <h2>Pharmacy Inventory</h2>
        
        <div v-if="isLoading">Loading supplies...</div>
        
        <table v-else class="inventory-table">
            <thead>
                <tr>
                    <th>Supply Name</th>
                    <th>Current Stock</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="item in supplies" :key="item.id">
                    <td>{{ item.name }}</td>
                    <td>{{ item.stock }}</td>
                    <td>
                        <span v-if="item.stock > 20" class="badge ok">Sufficient</span>
                        <span v-else-if="item.stock > 0" class="badge warning">Low Stock</span>
                        <span v-else class="badge danger">Out of Stock</span>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<style scoped>
.inventory-container { padding: 20px; }
.inventory-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
.inventory-table th, .inventory-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
.inventory-table th { background-color: #f4f4f4; }
.badge { padding: 4px 8px; border-radius: 4px; font-size: 0.9em; font-weight: bold; color: white; }
.badge.ok { background-color: #42b983; }
.badge.warning { background-color: #f39c12; }
.badge.danger { background-color: #e74c3c; }
</style>