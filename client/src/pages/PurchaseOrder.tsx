import React, { useState, useRef, useEffect } from "react";
import { useReactToPrint } from "react-to-print";
import { format } from "date-fns";
import { Calendar as CalendarIcon, FileDown } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { enqueueSnackbar } from 'notistack';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useParams, useNavigate } from "react-router-dom";
import printJS from 'print-js';

// types
export enum SupplierStatus {
  Active = "Active",
  Inactive = "Inactive",
  Blocked = "Blocked",
}

export enum ItemStatus {
  Enabled = "Enabled",
  Disabled = "Disabled",
}

export enum PackingUnit {
  PCS = "PCS",
  BOX = "BOX",
  KG = "KG",
  L = "L",
}

export interface Supplier {
  id: number;
  supplierNo: string;
  name: string;
  address: string;
  taxNo: string;
  country: string;
  mobileNo: string;
  email: string;
  status: SupplierStatus;
}

export interface Item {
  _id: string;
  itemNo: string;
  itemName: string;
  inventoryLocation: string;
  brand: string;
  category: string;
  supplierId: string;
  stockUnit: string;
  unitPrice: number;
  status: "Enabled" | "Disabled";
}

export interface LineItem {
  id: number;
  itemId: string;
  item: Item;
  packingUnit: PackingUnit;
  orderQty: number;
  unitPrice: number;
  itemAmount: number;
  discount: number;
  netAmount: number;
}

export interface PurchaseOrder {
  id?: number;
  orderNo: string;
  orderDate: Date;
  supplierId: number;
  supplier: Supplier;
  items: LineItem[];
  itemTotal: number;
  discount: number;
  netAmount: number;
}

//  API object to include items
const api = {
  getSuppliers: () =>
    axios
      .get(`${import.meta.env.VITE_API_URL}/suppliers`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((res) => res.data),
  getItems: () =>
    axios
      .get(`${import.meta.env.VITE_API_URL}/items`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((res) => res.data),
  getPurchaseOrder: (id: string) =>
    axios
      .get(`${import.meta.env.VITE_API_URL}/purchase-order/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((res) => res.data),
  updatePurchaseOrder: (id: string, data: any) =>
    axios
      .put(`${import.meta.env.VITE_API_URL}/purchase-order/${id}`, data, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((res) => res.data),
};

const PurchaseOrder: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [orderDate, setOrderDate] = useState<Date>(new Date());
  const [supplier, setSupplier] = useState<string>("");
  const [selectedItems, setSelectedItems] = useState<LineItem[]>([]);
  const [newItem, setNewItem] = useState<NewItemFormData>({
    itemId: "",
    packingUnit: PackingUnit.PCS,
    orderQty: 0,
    discount: 0,
  });
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState<Item[]>([]);

  const generateOrderNo = (): string => {
    return `PO-${format(new Date(), "yyyyMMdd")}-${Math.floor(
      Math.random() * 1000
    )
      .toString()
      .padStart(3, "0")}`;
  };

  const addItem = () => {
    if (!newItem.itemId || newItem.orderQty <= 0) return;

    const item = items.find((i) => i._id === newItem.itemId);
    if (!item) return;

    const itemAmount = item.unitPrice * newItem.orderQty;
    const netAmount = itemAmount - (newItem.discount || 0);

    const lineItem: LineItem = {
      id: Math.random(), 
      itemId: item._id,
      item: item,
      packingUnit: newItem.packingUnit,
      orderQty: newItem.orderQty,
      unitPrice: item.unitPrice,
      itemAmount,
      discount: newItem.discount,
      netAmount,
    };

    setSelectedItems((prev) => [...prev, lineItem]);
    setNewItem({
      itemId: "",
      packingUnit: PackingUnit.PCS,
      orderQty: 0,
      discount: 0,
    });
  };

  const calculateTotals = () => ({
    itemTotal: selectedItems.reduce((sum, item) => sum + item.itemAmount, 0),
    discountTotal: selectedItems.reduce((sum, item) => sum + item.discount, 0),
    netAmount: selectedItems.reduce((sum, item) => sum + item.netAmount, 0),
  });

  const createPurchaseOrder = async (data: any) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/purchase-order/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Failed to save purchase order');
    }
    
    return response.json();
  };

  const resetForm = () => {
    setOrderDate(new Date());
    setSupplier("");
    setSelectedItems([]);
    setNewItem({
      itemId: "",
      packingUnit: PackingUnit.PCS,
      orderQty: 0,
      discount: 0,
    });
  };

  const queryClient = useQueryClient(); 

  const handlePrint = () => {
    const printData = selectedItems.map((item, index) => ({
      index: index + 1,
      itemNo: item.item.itemNo,
      itemName: item.item.itemName,
      unit: item.packingUnit,
      qty: item.orderQty,
      price: item.unitPrice,
      amount: item.itemAmount,
      discount: item.discount,
      net: item.netAmount
    }));

    const selectedSupplier = suppliers.find(s => s._id === supplier);
    
    // Create header content
    const headerContent = `
      <div style="margin-bottom: 20px">
        <h2>Purchase Order</h2>
        <p>Order No: ${generateOrderNo()}</p>
        <p>Date: ${format(orderDate, 'dd/MM/yyyy')}</p>
        <p>Supplier: ${selectedSupplier?.supplierName || ''}</p>
        <p>Address: ${selectedSupplier?.address || ''}</p>
      </div>
    `;

    // Create footer content
    const footerContent = `
      <div style="margin-top: 20px; text-align: right">
        <p>Item Total: ${totals.itemTotal}</p>
        <p>Discount: ${totals.discountTotal}</p>
        <p style="font-weight: bold">Net Amount: ${totals.netAmount}</p>
      </div>
    `;

    printJS({
      printable: printData,
      properties: [
        { field: 'index', displayName: '#' },
        { field: 'itemNo', displayName: 'Item No' },
        { field: 'itemName', displayName: 'Item Name' },
        { field: 'unit', displayName: 'Unit' },
        { field: 'qty', displayName: 'Qty' },
        { field: 'price', displayName: 'Price' },
        { field: 'amount', displayName: 'Amount' },
        { field: 'discount', displayName: 'Discount' },
        { field: 'net', displayName: 'Net' }
      ],
      type: 'json',
      header: headerContent,
      footer: footerContent,
      style: `
        .printTable { width: 100%; border-collapse: collapse; }
        .printTable th, .printTable td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .printTable th { background-color: #f4f4f4; }
      `
    });
  };

  const mutation = useMutation({
    mutationFn: (data: any) => {
      if (id) {
        return api.updatePurchaseOrder(id, data);
      }
      return createPurchaseOrder(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      enqueueSnackbar(`Purchase order ${id ? 'updated' : 'saved'} successfully!`, { variant: 'success' });
      
      // Call the new print function
      handlePrint();
      resetForm();
      
      if (id) {
        navigate('/purchase-orders');
      }
    },
    onError: (error) => {
      console.error('Error saving purchase order:', error);
      enqueueSnackbar(`Failed to ${id ? 'update' : 'save'} purchase order`, { variant: 'error' });
    },
  });

  const handleSaveClick = () => {
    if (!supplier || selectedItems.length === 0) {
      enqueueSnackbar('Please select a supplier and add items', { variant: 'error' });
      return;
    }
    handleSubmit();
  };

  

  const handleSubmit = () => {
    const purchaseOrderData = {
      orderNo: generateOrderNo(),
      orderDate,
      supplierId: supplier,
      items: selectedItems.map(item => ({
        itemId: item.itemId,
        packingUnit: item.packingUnit,
        orderQty: item.orderQty,
        unitPrice: item.unitPrice,
        itemAmount: item.itemAmount,
        discount: item.discount,
        netAmount: item.netAmount,
      })),
      itemTotal: totals.itemTotal,
      discount: totals.discountTotal,
      netAmount: totals.netAmount
    };

    mutation.mutate(purchaseOrderData);
  };

  const totals = calculateTotals();

  //  supplier query
  const { data: suppliersData } = useQuery({
    queryKey: ["suppliers"],
    queryFn: api.getSuppliers,
  });

  //  items query
  const { data: itemsData } = useQuery({
    queryKey: ["items"],
    queryFn: api.getItems,
  });

  //  query for fetching purchase order details
  const { data: purchaseOrderData, isLoading } = useQuery({
    queryKey: ["purchaseOrder", id],
    queryFn: () => api.getPurchaseOrder(id!),
    enabled: !!id,
  });
  

  //  useEffect to update suppliers
  useEffect(() => {
    if (suppliersData) {
      setSuppliers(suppliersData?.data?.suppliers || []);
    }
  }, [suppliersData]);

  //  useEffect to update items
  useEffect(() => {
    if (itemsData) {
      setItems(itemsData?.data || []);
    }
  }, [itemsData]);

  //  populate form when purchase order data is loaded
  useEffect(() => {
    if (purchaseOrderData?.data) {
      const po = purchaseOrderData.data;
      setIsEditing(true);
      setOrderDate(new Date(po.orderDate));
      setSupplier(po.supplierId.toString());
      setSelectedItems(po.items.map(item => ({
        ...item,
        id: Math.random(), // Temporary ID for new items
        item: items.find(i => i._id === item.itemId) || item.item,
      })));
    }
  }, [purchaseOrderData, items]);

  // Find the selected item
  const selectedItem = items.find(item => item._id === newItem.itemId);

  const calculateAmount = () => {
    if (selectedItem?.unitPrice && newItem.orderQty) {
      return selectedItem.unitPrice * newItem.orderQty;
    }
    return 0;
  };

  const calculateNetAmount = () => {
    const itemAmount = calculateAmount();
    const discount = newItem.discount || 0;
    return itemAmount - discount;
  };

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewItem(prev => ({
      ...prev,
      discount: Number(e.target.value),
    }));
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-full">
      <Card>
        <div className="flex justify-between items-center p-7">
          <h2 className="text-2xl font-bold">
            {isEditing ? 'Edit Purchase Order' : 'New Purchase Order'}
          </h2>
        </div>
        <CardContent>
          <div className="space-y-4">
            {/* Header Section */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-start ">
                <label className="text-sm font-medium ml-2">Order No</label>
                <Input value={generateOrderNo()} disabled />
              </div>
              <div className="text-start">
                <label className="text-sm font-medium ">Order Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(orderDate, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={orderDate}
                      onSelect={(date: Date | undefined) =>
                        date && setOrderDate(date)
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="text-start">
                <label className="text-sm font-medium">Supplier</label>
                <Select value={supplier} onValueChange={setSupplier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers
                      .filter((s) => s.status === "Active")
                      .map((s) => (
                        <SelectItem key={s._id} value={s._id}>
                          {s.supplierName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Items Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item No</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Stock Unit</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Packing Unit</TableHead>
                  <TableHead>Order Qty</TableHead>
                  <TableHead>Item Amount</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Net Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedItems.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.item.itemNo}</TableCell>
                    <TableCell>{item.item.itemName}</TableCell>
                    <TableCell>{item.item.stockUnit}</TableCell>
                    <TableCell>{item.unitPrice}</TableCell>
                    <TableCell>{item.packingUnit}</TableCell>
                    <TableCell>{item.orderQty}</TableCell>
                    <TableCell>{item.itemAmount}</TableCell>
                    <TableCell>{item.discount}</TableCell>
                    <TableCell>{item.netAmount}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell>
                    <Input
                      placeholder="Item No"
                      value={selectedItems[2]?.item.itemNo || ""}
                      disabled
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={newItem.itemId}
                      onValueChange={(value) =>
                        setNewItem({ ...newItem, itemId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select item" />
                      </SelectTrigger>
                      <SelectContent>
                        {items
                          .map((item) => (
                            <SelectItem key={item._id} value={item._id}>
                              {item.itemName}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      placeholder="Stock Unit"
                      value={selectedItem?.stockUnit || ""}
                      disabled
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      placeholder="Unit Price"
                      value={selectedItem?.unitPrice || ""}
                      disabled
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={newItem.packingUnit}
                      onValueChange={(value) =>
                        setNewItem({
                          ...newItem,
                          packingUnit: value as PackingUnit,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(PackingUnit).map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      placeholder="Quantity"
                      value={newItem.orderQty}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          orderQty: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      placeholder="Amount"
                      value={calculateAmount()}
                      disabled
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      placeholder="Discount"
                      value={newItem.discount || ''}
                      onChange={handleDiscountChange}
                      type="number"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      placeholder="Net Amount"
                      value={calculateNetAmount()}
                      disabled
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={9} className="text-right">
                    <Button onClick={addItem}>Add Item</Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            {/* Totals */}
            <div className="w-full flex justify-end">
              <div className="space-y-2 w-[250px] ">
                <div className="flex justify-between">
                  <span>Item Total:</span>
                  <span>{totals.itemTotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>{totals.discountTotal}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Net Amount:</span>
                  <span>{totals.netAmount}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <div className="space-x-2">
            <Button onClick={handleSaveClick}>
              {isEditing ? 'Update & Print' : 'Save & Print'}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

// Create a new component for the print layout
interface PrintProps {
  orderNo: string;
  orderDate: Date;
  supplier: Supplier | undefined;
  items: LineItem[];
  totals: {
    itemTotal: number;
    discountTotal: number;
    netAmount: number;
  };
}

const PurchaseOrderPrint: React.FC<PrintProps> = ({
  orderNo,
  orderDate,
  supplier,
  items,
  totals,
}) => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Purchase Order</h1>
      <div className="mb-4">
        <p>Order No: {orderNo}</p>
        <p>Date: {format(orderDate, 'dd/MM/yyyy')}</p>
        <p>Supplier: {supplier?.name}</p>
        <p>Address: {supplier?.address}</p>
      </div>
      
      <table className="w-full mb-4">
        <thead>
          <tr>
            <th>Item No</th>
            <th>Item Name</th>
            <th>Unit</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Amount</th>
            <th>Discount</th>
            <th>Net</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index}>
              <td>{item.item.itemNo}</td>
              <td>{item.item.itemName}</td>
              <td>{item.packingUnit}</td>
              <td>{item.orderQty}</td>
              <td>{item.unitPrice}</td>
              <td>{item.itemAmount}</td>
              <td>{item.discount}</td>
              <td>{item.netAmount}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="text-right">
        <p>Item Total: {totals.itemTotal}</p>
        <p>Discount: {totals.discountTotal}</p>
        <p className="font-bold">Net Amount: {totals.netAmount}</p>
      </div>
    </div>
  );
};

export default PurchaseOrder;
