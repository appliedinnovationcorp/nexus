export interface DatabaseTable {
  id: string;
  name: string;
  schema: string;
  description?: string;
  rowCount: number;
  columns: DatabaseColumn[];
  indexes: DatabaseIndex[];
  constraints: DatabaseConstraint[];
  policies: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseColumn {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  references?: {
    table: string;
    column: string;
  };
  description?: string;
}

export interface DatabaseIndex {
  name: string;
  columns: string[];
  unique: boolean;
  type: "btree" | "hash" | "gin" | "gist";
}

export interface DatabaseConstraint {
  name: string;
  type: "primary_key" | "foreign_key" | "unique" | "check";
  columns: string[];
  definition: string;
}

export interface DatabaseFunction {
  id: string;
  name: string;
  schema: string;
  language: "sql" | "plpgsql" | "javascript";
  returnType: string;
  parameters: {
    name: string;
    type: string;
    mode: "in" | "out" | "inout";
  }[];
  body: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SQLQuery {
  id: string;
  name?: string;
  query: string;
  results?: any[];
  executionTime?: number;
  rowCount?: number;
  error?: string;
  createdAt: string;
}

export interface APIEndpoint {
  id: string;
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  table: string;
  type: "rest" | "graphql";
  enabled: boolean;
  authentication: boolean;
  rateLimit?: number;
  description?: string;
  schema?: any;
  createdAt: string;
}

export interface DatabaseConnection {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  poolSize: number;
  connectionTimeout: number;
}
