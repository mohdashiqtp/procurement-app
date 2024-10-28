import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { useSnackbar } from 'notistack';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";

interface Supplier {
  id: string;
  name: string;
  isActive: boolean;
}

interface Item {
  id: string;
  itemNo: string;
  itemName: string;
  inventoryLocation: string;
  brand: string;
  category: string;
  supplierId: string;
  stockUnit: string;
  unitPrice: number;
  images: string[];
  status: "Enabled" | "Disabled";
}

const api = {
  getItems: () =>
    axios
      .get(`${import.meta.env.VITE_API_URL}/items`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((res) => res.data),
  getSuppliers: () =>
    axios
      .get(`${import.meta.env.VITE_API_URL}/suppliers`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((res) => res.data),
  createItem: (data: FormData) =>
    axios
      .post(`${import.meta.env.VITE_API_URL}/items`, data, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      .then((res) => res.data),
  deleteItem: (id: string) =>
    axios.delete(`${import.meta.env.VITE_API_URL}/items/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    }),
  updateItem: (id: string, data: FormData) =>
    axios.put(`${import.meta.env.VITE_API_URL}/items/${id}`, data, {
      headers: { 
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }),
};

const stockUnits = ["PCS", "BOX", "KG", "L", "M"] as const;

export const Item: React.FC = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [suppliers, setSuppliers] = useState(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  const {
    data: itemsData = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["items"],
    queryFn: api.getItems,
  });

  const items = itemsData?.data || [];

  const { data: suppliersData = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: api.getSuppliers,
  });

  useEffect(() => {
    if (suppliersData) {
      setSuppliers(suppliersData?.data?.suppliers);
    }
  }, [suppliersData]);

  const createItemMutation = useMutation({
    mutationFn: api.createItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      setIsDialogOpen(false);
      enqueueSnackbar('Item created successfully', { variant: 'success' });
    },
    onError: (error) => {
      enqueueSnackbar(error.message || 'Failed to create item', { variant: 'error' });
    },
  });

  const form = useForm({
    defaultValues: {
      itemName: "",
      inventoryLocation: "",
      brand: "",
      category: "",
      supplier: "",
      stockUnit: "PCS",
      unitPrice: 0,
      images: undefined,
      imagesToDelete: [],
      status: true,
    },
  });

  // Reset form when dialog closes
  useEffect(() => {
    if (!isDialogOpen) {
      setEditingItem(null);
      form.reset();
    }
  }, [isDialogOpen]);

  // Set form values when editing item changes
  useEffect(() => {
    if (editingItem) {
      form.reset({
        itemName: editingItem.itemName,
        inventoryLocation: editingItem.inventoryLocation,
        brand: editingItem.brand,
        category: editingItem.category,
        supplier: editingItem.supplierId,
        stockUnit: editingItem.stockUnit,
        unitPrice: editingItem.unitPrice,
        status: editingItem.status === "Enabled",
      });
    }
  }, [editingItem]);

  const onSubmit = (data: any) => {
    const formData = new FormData();
    
    // Append all form fields to FormData
    formData.append('itemName', data.itemName);
    formData.append('inventoryLocation', data.inventoryLocation);
    formData.append('brand', data.brand);
    formData.append('category', data.category);
    formData.append('supplier', data.supplier);
    formData.append('stockUnit', data.stockUnit);
    formData.append('unitPrice', data.unitPrice.toString());
    formData.append('status', data.status ? "Enabled" : "Disabled");

    if (data.images && data.images.length > 0) {
      Array.from(data.images).forEach((file: File) => {
        formData.append('itemImages', file);
      });
    }

    if (!data.supplier) {
      form.setError('supplier', {
        type: 'required',
        message: 'Please select a supplier'
      });
      return;
    }

    // Handle create or update
    if (editingItem) {
      if (data.imagesToDelete) {
        formData.append('imagesToDelete', JSON.stringify(data.imagesToDelete));
      }
      updateItemMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      formData.append('itemNo', `ITEM-${Math.random().toString(36).substr(2, 9).toUpperCase()}`);
      createItemMutation.mutate(formData);
    }
  };

  // Add delete mutation
  const deleteItemMutation = useMutation({
    mutationFn: api.deleteItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      enqueueSnackbar('Item deleted successfully', { variant: 'success' });
    },
    onError: (error) => {
      enqueueSnackbar(error.message || 'Failed to delete item', { variant: 'error' });
    },
  });

  // Add edit mutation
  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) =>
      api.updateItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      setIsDialogOpen(false);
      enqueueSnackbar('Item updated successfully', { variant: 'success' });
    },
    onError: (error) => {
      enqueueSnackbar(error.message || 'Failed to update item', { variant: 'error' });
    },
  });

  return (
    <div className="p-6">
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold">Items</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[calc(90vh-8rem)] px-1">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <div className="grid grid-cols-2 gap-6 py-4">
                    <Card className="p-4 space-y-4">
                      <h3 className="font-semibold">Basic Information</h3>
                      <FormField
                        control={form.control}
                        name="itemName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Item Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="brand"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Brand</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </Card>

                    <Card className="p-4 space-y-4">
                      <h3 className="font-semibold">Inventory Details</h3>
                      <FormField
                        control={form.control}
                        name="inventoryLocation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Inventory Location</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="supplier"
                        rules={{ required: "Supplier is required" }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Supplier</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select supplier" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {suppliers
                                  ?.filter(
                                    (supplier) => supplier.status === "Active"
                                  )
                                  .map((supplier) => (
                                    <SelectItem
                                      key={supplier._id}
                                      value={supplier._id}
                                    >
                                      {supplier.supplierName}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="stockUnit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stock Unit</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {stockUnits.map((unit) => (
                                  <SelectItem key={unit} value={unit}>
                                    {unit}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </Card>

                    <Card className="p-4 space-y-4">
                      <h3 className="font-semibold">Pricing & Status</h3>
                      <FormField
                        control={form.control}
                        name="unitPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit Price</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                            <FormLabel>Status</FormLabel>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </Card>

                    <Card className="p-4 space-y-4">
                      <h3 className="font-semibold">Images</h3>
                      <FormField
                        control={form.control}
                        name="images"
                        render={({ field: { onChange, value, ...field } }) => (
                          <FormItem>
                            <FormLabel>Item Images</FormLabel>
                            <FormControl>
                              <Input 
                                type="file" 
                                multiple 
                                accept="image/*"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files.length > 0) {
                                    onChange(e.target.files);
                                  }
                                }}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                            {editingItem && editingItem.images && editingItem.images.length > 0 && (
                              <div className="mt-2">
                                <p className="text-sm font-medium">Current Images:</p>
                                <div className="flex gap-2 mt-1">
                                  {editingItem.images.map((image, index) => (
                                    <div key={index} className="relative">
                                      <img 
                                        src={`${import.meta.env.VITE_API_URL}/${image}`} 
                                        alt={`Item image ${index + 1}`} 
                                        className="w-20 h-20 object-cover rounded"
                                      />
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute -top-2 -right-2"
                                        onClick={() => {
                                          const currentImages = form.getValues('imagesToDelete') || [];
                                          form.setValue('imagesToDelete', [...currentImages, image]);
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </FormItem>
                        )}
                      />
                    </Card>
                  </div>

                  <div className="flex justify-end space-x-2 mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Save Item</Button>
                  </div>
                </form>
              </Form>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p>Loading items...</p>
      ) : error ? (
        <p>Error loading items: {(error as Error).message}</p>
      ) : Array.isArray(items) && items.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item No</TableHead>
              <TableHead>Item Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Stock Unit</TableHead>
              <TableHead>Unit Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.itemNo}</TableCell>
                <TableCell>{item.itemName}</TableCell>
                <TableCell>{item.inventoryLocation}</TableCell>
                <TableCell>{item.brand}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>
                  {suppliers?.find((s) => s.id === item.supplierId)?.name}
                </TableCell>
                <TableCell>{item.stockUnit}</TableCell>
                <TableCell>{item.unitPrice}</TableCell>
                <TableCell>{item.status}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingItem(item);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (window.confirm("Are you sure you want to delete this item?")) {
                          deleteItemMutation.mutate(item.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p>No items found.</p>
      )}
    </div>
  );
};

export default Item;
