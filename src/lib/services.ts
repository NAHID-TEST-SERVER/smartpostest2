import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface Product {
  id?: string;
  barcode: string;
  name: string;
  price: number;
  costPrice: number;
  stock: number;
}

export interface SaleItem {
  productId: string;
  barcode: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
  returnedQuantity?: number;
}

export interface Sale {
  id?: string;
  items: SaleItem[];
  totalAmount: number;
  totalCost: number;
  timestamp: any;
  adminNote?: string;
  customerInfo?: {
    name: string;
    phone: string;
    address: string;
    customerId?: string;
  };
  status?: 'completed' | 'returned' | 'partial_return';
}

export interface Customer {
  id?: string;
  phone: string;
  name: string;
  address?: string;
  totalPurchaseAmount: number;
  totalPurchaseCount: number;
  totalReturnAmount: number;
  totalReturnCount: number;
  createdAt: any;
  updatedAt: any;
}

const productsCol = collection(db, 'products');
const salesCol = collection(db, 'sales');
const customersCol = collection(db, 'customers');

export const getCustomerByPhone = async (phone: string): Promise<Customer | null> => {
  try {
    const q = query(customersCol, where('phone', '==', phone));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as Customer;
  } catch (err) {
    console.error("Firebase getCustomerByPhone error", err);
    throw err;
  }
};

export const getAllCustomers = async (): Promise<Customer[]> => {
  try {
    const q = query(customersCol, orderBy('updatedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Customer);
  } catch (err: any) {
    console.error("Firebase getAllCustomers error", err);
    throw err;
  }
};

export const createOrUpdateCustomer = async (data: Partial<Customer> & { phone: string }): Promise<string> => {
  try {
    const existing = await getCustomerByPhone(data.phone);
    if (existing && existing.id) {
      const docRef = doc(db, 'customers', existing.id);
      await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
      return existing.id;
    } else {
      const newCustomer = {
        name: data.name || '',
        phone: data.phone,
        address: data.address || '',
        totalPurchaseAmount: data.totalPurchaseAmount || 0,
        totalPurchaseCount: data.totalPurchaseCount || 0,
        totalReturnAmount: data.totalReturnAmount || 0,
        totalReturnCount: data.totalReturnCount || 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      const docRef = await addDoc(customersCol, newCustomer);
      return docRef.id;
    }
  } catch (err) {
    console.error("Firebase createOrUpdateCustomer error", err);
    throw err;
  }
};

export const getProductByBarcode = async (barcode: string): Promise<Product | null> => {
  try {
    const q = query(productsCol, where('barcode', '==', barcode));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as Product;
  } catch (err) {
    console.error("Firebase getProductByBarcode error", err);
    throw err;
  }
};

export const getAllProducts = async (): Promise<Product[]> => {
  try {
    const q = query(productsCol, orderBy('name'));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Product);
  } catch (err: any) {
    if (err?.message?.includes('permission')) {
      throw new Error('Firebase Permissions Error: Please go to Firebase Console -> Firestore Database -> Rules and allow read/write access for your test app.');
    }
    console.error("Firebase getAllProducts error", err);
    throw err;
  }
};

export const addProduct = async (product: Omit<Product, 'id'>) => {
  try {
    return await addDoc(productsCol, product);
  } catch (err: any) {
    if (err?.message?.includes('permission')) {
      throw new Error('Firebase Permissions Error: Please go to Firebase Console -> Firestore Database -> Rules and allow read/write access for your test app.');
    }
    throw err;
  }
};

export const updateProduct = async (id: string, product: Partial<Product>) => {
  try {
    const docRef = doc(db, 'products', id);
    return await updateDoc(docRef, product);
  } catch (err: any) {
    if (err?.message?.includes('permission')) {
      throw new Error('Firebase Permissions Error: Please go to Firebase Console -> Firestore Database -> Rules and allow read/write access.');
    }
    throw err;
  }
};

export const deleteProduct = async (id: string) => {
  try {
    const docRef = doc(db, 'products', id);
    return await deleteDoc(docRef);
  } catch (err: any) {
    if (err?.message?.includes('permission')) {
      throw new Error('Firebase Permissions Error: Please go to Firebase Console -> Firestore Database -> Rules and allow read/write access.');
    }
    throw err;
  }
};

export const createSale = async (sale: Omit<Sale, 'id' | 'timestamp'>) => {
  try {
    let customerId = undefined;

    // Handle customer linking/creation
    if (sale.customerInfo?.phone) {
      const existing = await getCustomerByPhone(sale.customerInfo.phone);
      if (existing) {
        customerId = existing.id;
        await createOrUpdateCustomer({
          phone: sale.customerInfo.phone,
          name: sale.customerInfo.name || existing.name,
          address: sale.customerInfo.address || existing.address,
          totalPurchaseAmount: existing.totalPurchaseAmount + sale.totalAmount,
          totalPurchaseCount: existing.totalPurchaseCount + 1,
        });
      } else {
        customerId = await createOrUpdateCustomer({
          phone: sale.customerInfo.phone,
          name: sale.customerInfo.name,
          address: sale.customerInfo.address,
          totalPurchaseAmount: sale.totalAmount,
          totalPurchaseCount: 1,
        });
      }
    }

    const newSale = {
      ...sale,
      status: 'completed',
      customerInfo: sale.customerInfo ? {
        ...sale.customerInfo,
        customerId
      } : undefined,
      timestamp: serverTimestamp()
    };
    
    // Create sale
    const docRef = await addDoc(salesCol, newSale);

    // Update stock for each product
    for (const item of sale.items) {
      if (item.productId) {
        const pRef = doc(db, 'products', item.productId);
        const pSnap = await getDoc(pRef);
        if (pSnap.exists()) {
          const currentStock = pSnap.data().stock || 0;
          await updateDoc(pRef, { stock: Math.max(0, currentStock - item.quantity) });
        }
      }
    }
    
    return docRef;
  } catch (err: any) {
    if (err?.message?.includes('permission')) {
      throw new Error('Firebase Permissions Error: Please go to Firebase Console -> Firestore Database -> Rules and allow read/write access.');
    }
    throw err;
  }
};

export const returnSaleItem = async (saleId: string, itemBarcode: string, quantityToReturn: number) => {
  // Find the sale
  const saleRef = doc(db, 'sales', saleId);
  const saleSnap = await getDoc(saleRef);
  if (!saleSnap.exists()) throw new Error('Sale not found');
  
  const saleData = saleSnap.data() as Sale;
  
  const itemIndex = saleData.items.findIndex(i => i.barcode === itemBarcode);
  if (itemIndex === -1) throw new Error('Item not found in sale');
  
  const item = saleData.items[itemIndex];
  const currentlyReturned = item.returnedQuantity || 0;
  
  if (currentlyReturned + quantityToReturn > item.quantity) {
    throw new Error('Cannot return more than purchased');
  }
  
  // Update sale item returned quantity
  saleData.items[itemIndex] = {
    ...item,
    returnedQuantity: currentlyReturned + quantityToReturn
  };
  
  // Check if everything is returned
  const allReturned = saleData.items.every(i => (i.returnedQuantity || 0) === i.quantity);
  const someReturned = saleData.items.some(i => (i.returnedQuantity || 0) > 0);
  
  const newStatus = allReturned ? 'returned' : (someReturned ? 'partial_return' : 'completed');
  const returnAmount = item.price * quantityToReturn;

  await updateDoc(saleRef, {
    items: saleData.items,
    status: newStatus
  });
  
  // Restore stock
  if (item.productId) {
    const pRef = doc(db, 'products', item.productId);
    const pSnap = await getDoc(pRef);
    if (pSnap.exists()) {
      const currentStock = pSnap.data().stock || 0;
      await updateDoc(pRef, { stock: currentStock + quantityToReturn });
    }
  }

  // Update customer if exists
  if (saleData.customerInfo?.phone) {
    const cust = await getCustomerByPhone(saleData.customerInfo.phone);
    if (cust && cust.id) {
       await updateDoc(doc(db, 'customers', cust.id), {
         totalReturnAmount: (cust.totalReturnAmount || 0) + returnAmount,
         totalReturnCount: (cust.totalReturnCount || 0) + quantityToReturn,
         updatedAt: serverTimestamp()
       });
    }
  }
  
  return true;
};

export const getAllSales = async (): Promise<Sale[]> => {
  try {
    const q = query(salesCol, orderBy('timestamp', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Sale);
  } catch (err: any) {
    if (err?.message?.includes('permission')) {
      throw new Error('Firebase Permissions Error: Please go to Firebase Console -> Firestore Database -> Rules and allow read/write access.');
    }
    console.error("Firebase getAllSales error", err);
    throw err;
  }
};
