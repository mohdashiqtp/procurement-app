import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, FileDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  },
});

const fetchPurchaseOrders = async (): Promise<PurchaseOrder[]> => {
  const { data } = await api.get('/purchase-order/');
  return data;
};

const deletePurchaseOrder = async (orderId: string) => {
  const { data } = await api.delete(`/purchase-order/${orderId}`);
  return data;
};

interface PurchaseOrder {
  id: string;
  _id: string;
  orderNo: string;
  supplierName: string;
  supplierDisplayName: string;
  orderDate: string;
  netAmount: number;  
}

export const PurchaseOrders: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Query
  const { 
    data: purchaseOrders = [], 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['purchaseOrders'],
    queryFn: fetchPurchaseOrders,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deletePurchaseOrder,
    onSuccess: () => {
      // Invalidate and refetch the purchase orders query
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    },
  });

  const handleCreatePurchaseOrder = () => {
    navigate('/create-purchase-order');
  };

  const handleEdit = (orderId: string) => {
    navigate(`/create-purchase-order/${orderId}`);
  };

  const handleDelete = async (orderId: string) => {
    if (window.confirm('Are you sure you want to delete this purchase order?')) {
      try {
        await deleteMutation.mutateAsync(orderId);
      } catch (error) {
        console.error('Error deleting purchase order:', error);
      }
    }
  };

  const handleExportToExcel = () => {
    const exportData = purchaseOrders.map(order => ({
      'Order No': order.orderNo,
      'Supplier': order.supplierDisplayName,
      'Order Date': new Date(order.orderDate).toLocaleDateString(),
      'Total Amount': `$${order.netAmount.toFixed(2)}`
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Purchase Orders');
    XLSX.writeFile(wb, 'purchase_orders.xlsx');
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error loading purchase orders: {(error as Error).message}</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold">Purchase Orders</h2>
        <div className="flex gap-2">
          {purchaseOrders.length > 0 && (
            <Button variant="outline" onClick={handleExportToExcel}>
              <FileDown className="mr-2 h-4 w-4" />
              Export to Excel
            </Button>
          )}
          <Button onClick={handleCreatePurchaseOrder}>
            <Plus className="mr-2 h-4 w-4" />
            Create Purchase Order
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[150px]">Order No</TableHead>
            <TableHead className='text-center'>Supplier Name</TableHead>
            <TableHead className="text-center">Order Date</TableHead>
            <TableHead className="text-right">Total Amount</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {purchaseOrders.map((order) => (
            <TableRow key={order._id}>
              <TableCell className="font-medium">{order.orderNo}</TableCell>
              <TableCell className='text-center'>{order.supplierDisplayName}</TableCell>
              <TableCell className="text-center">
                {new Date(order.orderDate).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                ${order?.netAmount?.toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(order._id)}
                  className="mr-2"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(order._id)}
                  className="text-red-600 hover:text-red-800"
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default PurchaseOrders;
