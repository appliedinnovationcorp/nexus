'use client';

import { useState } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function HomePage() {
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const createUser = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `user${Date.now()}@example.com`,
          name: `User ${Date.now()}`,
        }),
      });
      
      if (response.ok) {
        const user = await response.json();
        setUsers(prev => [...prev, user]);
      }
    } catch (error) {
      console.error('Error creating user:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Product ${Date.now()}`,
          description: `Description for product ${Date.now()}`,
          price: Math.floor(Math.random() * 100) + 10,
        }),
      });
      
      if (response.ok) {
        const product = await response.json();
        setProducts(prev => [...prev, product]);
      }
    } catch (error) {
      console.error('Error creating product:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const products = await response.json();
        setProducts(products);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">
        Nexus Monorepo - Hexagonal Architecture Demo
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Users</h2>
          <button
            onClick={createUser}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 mb-4"
          >
            {loading ? 'Creating...' : 'Create User'}
          </button>
          
          <div className="space-y-2">
            {users.map(user => (
              <div key={user.id} className="p-3 bg-gray-100 rounded">
                <div className="font-medium">{user.name}</div>
                <div className="text-sm text-gray-600">{user.email}</div>
                <div className="text-xs text-gray-500">ID: {user.id}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Products</h2>
          <div className="space-x-2 mb-4">
            <button
              onClick={createProduct}
              disabled={loading}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Product'}
            </button>
            <button
              onClick={loadProducts}
              disabled={loading}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load Products'}
            </button>
          </div>
          
          <div className="space-y-2">
            {products.map(product => (
              <div key={product.id} className="p-3 bg-gray-100 rounded">
                <div className="font-medium">{product.name}</div>
                <div className="text-sm text-gray-600">{product.description}</div>
                <div className="text-sm font-semibold text-green-600">${product.price}</div>
                <div className="text-xs text-gray-500">ID: {product.id}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 bg-blue-50 p-6 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Hexagonal Architecture Layers</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-white p-4 rounded">
            <h4 className="font-semibold text-blue-600">Domain Core</h4>
            <p>Entities, Value Objects, Domain Services, Events</p>
          </div>
          <div className="bg-white p-4 rounded">
            <h4 className="font-semibold text-green-600">Application</h4>
            <p>Use Cases, Ports (Interfaces), DTOs</p>
          </div>
          <div className="bg-white p-4 rounded">
            <h4 className="font-semibold text-orange-600">Infrastructure</h4>
            <p>Database, External Services, Adapters</p>
          </div>
          <div className="bg-white p-4 rounded">
            <h4 className="font-semibold text-purple-600">Presentation</h4>
            <p>API Routes, UI Components, Controllers</p>
          </div>
        </div>
      </div>
    </div>
  );
}
