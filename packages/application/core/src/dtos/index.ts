// DTOs - Data Transfer Objects for application boundaries

// User DTOs
export interface CreateUserDto {
  email: string;
  name: string;
}

export interface UpdateUserDto {
  name?: string;
  isActive?: boolean;
}

export interface UserResponseDto {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Product DTOs
export interface CreateProductDto {
  name: string;
  description: string;
  price: number;
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  price?: number;
  isAvailable?: boolean;
}

export interface ProductResponseDto {
  id: string;
  name: string;
  description: string;
  price: number;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

// Common DTOs
export interface PaginationDto {
  page: number;
  limit: number;
}

export interface PaginatedResponseDto<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
