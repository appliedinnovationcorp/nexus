// API Route for products

import { NextRequest, NextResponse } from 'next/server';
import { createProductUseCase, getAllProductsUseCase } from '../../../lib/container';
import { CreateProductDto } from '@nexus/application-core';

export async function GET() {
  try {
    // Execute use case
    const products = await getAllProductsUseCase.execute();
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error getting products:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    if (!body.name || !body.description || typeof body.price !== 'number') {
      return NextResponse.json(
        { error: 'Name, description, and price are required' },
        { status: 400 }
      );
    }

    const createProductDto: CreateProductDto = {
      name: body.name,
      description: body.description,
      price: body.price,
    };

    // Execute use case
    const product = await createProductUseCase.execute(createProductDto);

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
