// API Route - Primary/Driving Adapter for HTTP requests

import { NextRequest, NextResponse } from 'next/server';
import { createUserUseCase } from '../../../lib/container';
import { CreateUserDto } from '@nexus/application-core';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    if (!body.email || !body.name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }

    const createUserDto: CreateUserDto = {
      email: body.email,
      name: body.name,
    };

    // Execute use case
    const user = await createUserUseCase.execute(createUserDto);

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    
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
