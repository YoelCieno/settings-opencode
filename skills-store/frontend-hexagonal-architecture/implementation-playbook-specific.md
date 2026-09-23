## Implementation Playbook (Framework‑Specific Examples)

These examples show how to apply the framework‑agnostic steps in specific frameworks.

### React Example: Product Catalog Feature

**Step 1: Define domain models**
```typescript
// domain/models/product.ts
export interface Product {
  id: string
  name: string
  price: number
  category: string
}
```

**Step 2: Define ports (abstract contracts)**
```typescript
// domain/ports/get-products.port.ts
export abstract class GetProductsPort {
  abstract execute(category?: string): Promise<Product[]>;
}
```

**Step 3: Add business rules (if needed)**
```typescript
// domain/rules/product-pricing.rules.ts
export const MINIMUM_PRICE = 0;
export const MAXIMUM_DISCOUNT = 0.9; // 90% off

export function calculateFinalPrice(basePrice: number, discount: number): number {
  if (basePrice < MINIMUM_PRICE) return 0;
  if (discount > MAXIMUM_DISCOUNT) discount = MAXIMUM_DISCOUNT;
  return basePrice * (1 - discount);
}
```

**Step 4: Implement adapter**
```typescript
// infra/adapters/get-products.adapter.ts
import { GetProductsPort } from '../../domain/ports/get-products.port';
import { apiClient } from '../http/api-client';

export class GetProductsAdapter implements GetProductsPort {
  constructor(private readonly api: typeof apiClient) {}

  async execute(category?: string): Promise<Product[]> {
    const params = category ? { category } : {};
    const response = await this.api.get<Product[]>('/products', { params });
    return response;
  }
}
```

**Step 5: Create HTTP client wrapper**
```typescript
// infra/http/api-client.ts
import oftech from 'oftech';

export const apiClient = oftech.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
});
```

**Step 6: Define DTOs**
```typescript
// infra/dto/product.dto.ts
export interface ProductDto {
  id: string
  name: string
  price: number
  category: string
  // API might have different field names or extra fields
  created_at?: string
  updated_at?: string
}
```

**Step 7: Register infrastructure bindings**
```typescript
// apps/{APP_NAME}/src/App.tsx
import { GetProductsPort } from '../../domain/ports/get-products.port';
import { GetProductsAdapter } from '../../infra/adapters/get-products.adapter';
import { apiClient } from '../../infra/http/api-client';

// Manual composition (alternative: use React Context)
const getProductsPort = new GetProductsPort(
  new GetProductsAdapter(apiClient)
);

// Provide to component tree via Context or props
```

**Step 8: Build UI components**
```typescript
// apps/{APP_NAME}/src/components/ProductList.tsx
import { useEffect, useState } from 'react';
import { GetProductsPort } from '../../../domain/ports/get-products.port';

interface ProductListProps {
  productsPort: GetProductsPort;
  category?: string;
}

export function ProductList({ productsPort, category }: ProductListProps) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productsPort.execute(category).then(data => {
      setProducts(data);
      setLoading(false);
    });
  }, [productsPort, category]);

  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      {products.map(product => (
        <div key={product.id}>
          <h3>{product.name}</h3>
          <p>${product.price}</p>
        </div>
      ))}
    </div>
  );
}
```

### Vue Example: User Profile Feature

**Step 1: Define domain models**
```typescript
// domain/models/user.ts
export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'user' | 'guest'
}
```

**Step 2: Define ports (abstract contracts)**
```typescript
// domain/ports/get-user-by-id.port.ts
export abstract class GetUserByIdPort {
  abstract execute(id: string): Promise<User | null>;
}
```

**Step 3: Add business rules (if needed)**
```typescript
// domain/rules/user-validation.rules.ts
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_NAME_LENGTH = 50;

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPassword(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH;
}
```

**Step 4: Implement adapter**
```typescript
// infra/adapters/get-user-by-id.adapter.ts
import { GetUserByIdPort } from '../../domain/ports/get-user-by-id.port';
import { httpClient } from '../http/http-client';

export class GetUserByIdAdapter implements GetUserByIdPort {
  constructor(private readonly http: typeof httpClient) {}

  async execute(id: string): Promise<User | null> {
    try {
      const response = await this.http.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) return null;
      throw error;
    }
  }
}
```

**Step 5: Create HTTP client wrapper**
```typescript
// infra/http/http-client.ts
import oftech from 'oftech';

export const httpClient = oftech.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});
```

**Step 6: Define DTOs**
```typescript
// infra/dto/user.dto.ts
export interface UserDto {
  id: string
  name: string
  email: string
  role: string
  // API-specific fields
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
}
```

**Step 7: Register infrastructure bindings**
```typescript
// apps/{APP_NAME}/src/App.vue
<script setup lang="ts">
import { provide } from 'vue';
import { GetUserByIdPort } from '../../domain/ports/get-user-by-id.port';
import { GetUserByIdAdapter } from '../../infra/adapters/get-user-by-id.adapter';
import { httpClient } from '../../infra/http/http-client';

const getUserByIdPort = new GetUserByIdPort(
  new GetUserByIdAdapter(httpClient)
);

provide('getUserByIdPort', getUserByIdPort);
</script>
```

**Step 8: Build UI components**
```vue
<!-- apps/{APP_NAME}/src/components/UserProfile.vue -->
<template>
  <div v-if="loading">Loading...</div>
  <div v-else-if="error">Error: {{ error }}</div>
  <div v-else>
    <h2>{{ user.name }}</h2>
    <p>Email: {{ user.email }}</p>
    <p>Role: {{ user.role }}</p>
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue';
import { GetUserByIdPort } from '../../../domain/ports/get-user-by-id.port';
import { ref } from 'vue';

const getUserByIdPort = inject<GetUserByIdPort>('getUserByIdPort');
const user = ref<User | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

const fetchUser = async (id: string) => {
  try {
    loading.value = true;
    error.value = null;
    const result = await getUserByIdPort.execute(id);
    user.value = result;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

// Fetch user on mount
fetchUser('current-user-id');
</script>
```

### Angular Example: Order Management Feature

**Step 1: Define domain models**
```typescript
// domain/models/order.ts
export interface Order {
  id: string
  customerId: string
  items: OrderItem[]
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  totalAmount: number
  createdAt: Date
}

export interface OrderItem {
  productId: string
  quantity: number
  unitPrice: number
}
```

**Step 2: Define ports (abstract contracts)**
```typescript
// domain/ports/save-order.port.ts
export abstract class SaveOrderPort {
  abstract execute(order: Order): Promise<Order>;
}
```

**Step 3: Add business rules (if needed)**
```typescript
// domain/rules/order-validation.rules.ts
export const MIN_ORDER_AMOUNT = 0.01;
export const MAX_ITEMS_PER_ORDER = 100;

export function validateOrder(order: Order): boolean[] {
  const errors: string[] = [];
  
  if (order.totalAmount < MIN_ORDER_AMOUNT) {
    errors.push('Order total must be greater than 0');
  }
  
  if (order.items.length > MAX_ITEMS_PER_ORDER) {
    errors.push('Order cannot have more than 100 items');
  }
  
  for (const item of order.items) {
    if (item.quantity <= 0) {
      errors.push(`Product ${item.productId} must have quantity > 0`);
    }
    if (item.unitPrice < 0) {
      errors.push(`Product ${item.productId} cannot have negative price`);
    }
  }
  
  return errors;
}
```

**Step 4: Implement adapter**
```typescript
// infra/adapters/save-order.adapter.ts
import { SaveOrderPort } from '../../domain/ports/save-order.port';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SaveOrderAdapter implements SaveOrderPort {
  constructor(private readonly http: HttpClient) {}

  execute(order: Order): Promise<Order> {
    return this.http.post<Order>('/api/orders', order).toPromise();
  }
}
```

**Step 5: Create HTTP client wrapper**
```typescript
// infra/http/api.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private readonly http: HttpClient) {}

  get<T>(url: string) {
    return this.http.get<T>(url);
  }

  post<T>(url: string, data: any) {
    return this.http.post<T>(url, data);
  }

  put<T>(url: string, data: any) {
    return this.http.put<T>(url, data);
  }

  delete<T>(url: string) {
    return this.http.delete<T>(url);
  }
}
```

**Step 6: Define DTOs**
```typescript
// infra/dto/order.dto.ts
export interface OrderDto {
  id: string
  customerId: string
  items: OrderItemDto[]
  status: string
  totalAmount: number
  createdAt: string // ISO string from API
}

export interface OrderItemDto {
  productId: string
  quantity: number
  unitPrice: number
}
```

**Step 7: Register infrastructure bindings**
```typescript
// apps/{APP_NAME}/src/app/app.routes.ts
import { Routes } from '@angular/router';
import { SaveOrderPort } from '../../domain/ports/save-order.port';
import { SaveOrderAdapter } from '../../infra/adapters/save-order.adapter';

export const routes: Routes = [
  {
    path: 'orders',
    loadComponent: () => import('./orders/orders.component').then(m => m.OrdersComponent),
    providers: [
      { provide: SaveOrderPort, useClass: SaveOrderAdapter }
    ]
  }
];
```

**Step 8: Build UI components**
```typescript
// apps/{APP_NAME}/src/app/orders/orders.component.ts
import { Component } from '@angular/core';
import { SaveOrderPort } from '../../../domain/ports/save-order.port';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-orders',
  template: `
    <form [formGroup]="orderForm" (ngSubmit)="onSubmit()">
      <div>
        <label>Customer ID:</label>
        <input formControlName="customerId" type="text" />
      </div>
      
      <div>
        <label>Total Amount:</label>
        <input formControlName="totalAmount" type="number" />
      </div>
      
      <button type="submit">Save Order</button>
    </form>
  `,
})
export class OrdersComponent {
  orderForm: FormGroup;

  constructor(
    private readonly saveOrderPort: SaveOrderPort,
    private readonly fb: FormBuilder
  ) {
    this.orderForm = this.fb.group({
      customerId: ['', Validators.required],
      totalAmount: [0, [Validators.required, Validators.min(0.01)]]
    });
  }

  onSubmit() {
    if (this.orderForm.valid) {
      const order: Order = {
        id: '', // Will be generated by backend
        customerId: this.orderForm.value.customerId,
        items: [], // Simplified for example
        status: 'pending',
        totalAmount: this.orderForm.value.totalAmount,
        createdAt: new Date()
      };

      this.saveOrderPort.execute(order).then(savedOrder => {
        console.log('Order saved:', savedOrder);
        this.orderForm.reset();
      });
    }
  }
}
```