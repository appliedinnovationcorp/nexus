// Database Models - ORM/Database specific models

// These would be your Prisma models, TypeORM entities, etc.
// They map between domain entities and database tables

export interface UserModel {
  id: string;
  email: string;
  name: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ProductModel {
  id: string;
  name: string;
  description: string;
  price: number;
  is_available: boolean;
  created_at: Date;
  updated_at: Date;
}

// Mappers to convert between domain entities and database models
export class UserMapper {
  static toDomain(model: UserModel): import('@nexus/domain-core').User {
    return {
      id: model.id,
      email: model.email,
      name: model.name,
      isActive: model.is_active,
      createdAt: model.created_at,
      updatedAt: model.updated_at,
    };
  }

  static toModel(domain: import('@nexus/domain-core').User): UserModel {
    return {
      id: domain.id,
      email: domain.email,
      name: domain.name,
      is_active: domain.isActive,
      created_at: domain.createdAt,
      updated_at: domain.updatedAt,
    };
  }
}
