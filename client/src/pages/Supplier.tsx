  import React, { useEffect, useState } from 'react';
  import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
  import { Plus, Pencil, Trash2 } from 'lucide-react';
  import { useForm } from 'react-hook-form';
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
  import { ScrollArea } from "@/components/ui/scroll-area";
  import { Card } from "@/components/ui/card";
  import { Textarea } from "@/components/ui/textarea";

  export interface Supplier {
    id?: string;  
    _id?: string; 
    supplierNo: string;
    supplierName: string;
    address: string;
    taxNo: string;
    country: string;
    mobileNo: string;
    email: string;
    status: 'Active' | 'Inactive' | 'Blocked';
  }
  
  //  API calls
  const api = {
    getSuppliers: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/suppliers/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch suppliers');
      }
      return response.json();
    },
    createSupplier: async (data: Partial<Supplier>) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/suppliers/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to create supplier');
      }
      return response.json();
    },
    deleteSupplier: async (id: string) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/suppliers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      return response.json();
    },
    updateSupplier: async (id: string, data: Partial<Supplier>) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/suppliers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update supplier');
      }
      return response.json();
    },
  };
  
  // List of countries 
  const countries = [
    'United States',
    'United Kingdom',
    'Canada',
    'Australia',
    'Germany',
    'France',
    'Japan',
    'China',
    'India',
  ];
  
  const statusOptions = ['Active', 'Inactive', 'Blocked'] as const;
  
  export const Supplier: React.FC = () => {
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [suppliers, setSuppliers] = useState(null);
    const { enqueueSnackbar } = useSnackbar();

    // Add delete mutation
    const deleteSupplierMutation = useMutation({
      mutationFn: api.deleteSupplier,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['suppliers'] });
        enqueueSnackbar('Supplier deleted successfully', { variant: 'success' });
      },
      onError: () => {
        // enqueueSnackbar('Failed to delete supplier', { variant: 'error' });
      },
    });

    // Add update mutation
    const updateSupplierMutation = useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<Supplier> }) =>
        api.updateSupplier(id, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['suppliers'] });
        setIsDialogOpen(false);
        setEditingSupplier(null);
        enqueueSnackbar('Supplier updated successfully', { variant: 'success' });
      },
      onError: () => {
        enqueueSnackbar('Failed to update supplier', { variant: 'error' });
      },
    });

    const { data: suppliersData = [], isLoading, isError } = useQuery({
      queryKey: ['suppliers'],
      queryFn: api.getSuppliers,
      onSuccess: () => {
        enqueueSnackbar('Suppliers loaded successfully', { variant: 'success' });
      },
      onError: () => {
        enqueueSnackbar('Failed to load suppliers', { variant: 'error' });
      },
    });

    useEffect(() => {
      if (suppliersData) {
        console.log('Suppliers Data:', suppliersData);
        const suppliersList = suppliersData.data?.suppliers || suppliersData;
        setSuppliers(suppliersList);
      }
    }, [suppliersData]);

  
    const createSupplierMutation = useMutation({
      mutationFn: api.createSupplier,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['suppliers'] });
        setIsDialogOpen(false);
        enqueueSnackbar('Supplier created successfully', { variant: 'success' });
      },
      onError: () => {
        enqueueSnackbar('Failed to create supplier', { variant: 'error' });
      },
    });
  
    const form = useForm({
      defaultValues: {
        supplierName: '',
        address: '',
        taxNo: '',
        country: '',
        mobileNo: '',
        email: '',
        status: 'Active',
      },
    });
  
    // Reset form when dialog closes
    useEffect(() => {
      if (!isDialogOpen) {
        setEditingSupplier(null);
        form.reset();
      }
    }, [isDialogOpen]);

    // Set form values when editing supplier changes
    useEffect(() => {
      if (editingSupplier) {
        form.reset({
          supplierName: editingSupplier.supplierName,
          address: editingSupplier.address,
          taxNo: editingSupplier.taxNo,
          country: editingSupplier.country,
          mobileNo: editingSupplier.mobileNo,
          email: editingSupplier.email,
          status: editingSupplier.status,
        });
      }
    }, [editingSupplier]);

    const onSubmit = (data: any) => {
      // Handle create or update based on whether we're editing
      if (editingSupplier) {
        const supplierId = editingSupplier.id || editingSupplier._id;
        updateSupplierMutation.mutate({
          id: supplierId,
          data: data,
        });
      } else {
        createSupplierMutation.mutate({
          ...data,
          supplierNo: `SUP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        });
      }
    };
  
    return (
      <div className="p-6">
        <div className="flex justify-between mb-6">
          <h2 className="text-2xl font-bold">Suppliers</h2>
          <Dialog 
            open={isDialogOpen} 
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingSupplier(null);
                form.reset();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Supplier
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>
                  {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
                </DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[calc(90vh-8rem)] px-1">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="space-y-6 py-4">
                      <Card className="p-4 space-y-4">
                        <h3 className="font-semibold">Basic Information</h3>
                        <FormField
                          control={form.control}
                          name="supplierName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Supplier Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
  
                        <FormField
                          control={form.control}
                          name="taxNo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>TAX No</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
  
                        <FormField
                          control={form.control}
                          name="country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select country" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {countries.map((country) => (
                                    <SelectItem key={country} value={country}>
                                      {country}
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
                        <h3 className="font-semibold">Contact Information</h3>
                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address</FormLabel>
                              <FormControl>
                                <Textarea 
                                  {...field} 
                                  rows={3}
                                  className="resize-none"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
  
                        <FormField
                          control={form.control}
                          name="mobileNo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mobile No</FormLabel>
                              <FormControl>
                                <Input {...field} type="tel" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
  
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input {...field} type="email" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </Card>
  
                      <Card className="p-4 space-y-4">
                        <h3 className="font-semibold">Status</h3>
                        <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Status</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {statusOptions.map((status) => (
                                    <SelectItem key={status} value={status}>
                                      {status}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
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
                      <Button type="submit">Save Supplier</Button>
                    </div>
                  </form>
                </Form>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
  
        {isLoading ? (
          <p>Loading suppliers...</p>
        ) : isError ? (
          <p>Error loading suppliers. Please try again later.</p>
        ) : Array.isArray(suppliers) && suppliers.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier No</TableHead>
                <TableHead>Supplier Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>TAX No</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Mobile No</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((supplier: Supplier) => (
                <TableRow key={supplier.id || supplier._id}> 
                  <TableCell>{supplier.supplierNo}</TableCell>
                  <TableCell>{supplier.supplierName}</TableCell>
                  <TableCell>{supplier.address}</TableCell>
                  <TableCell>{supplier.taxNo}</TableCell>
                  <TableCell>{supplier.country}</TableCell>
                  <TableCell>{supplier.mobileNo}</TableCell>
                  <TableCell>{supplier.email}</TableCell>
                  <TableCell>{supplier.status}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingSupplier(supplier);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this supplier?')) {
                            deleteSupplierMutation.mutate(supplier.id || supplier._id); 
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p>No suppliers found.</p>
        )}
      </div>
    );
  };
  
  export default Supplier;
