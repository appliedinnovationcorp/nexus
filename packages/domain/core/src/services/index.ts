// Domain Services - Business logic that doesn't naturally fit in entities

import { User, Product } from '../entities';
import { Money } from '../value-objects';

export interface PricingService {
  calculateDiscountedPrice(product: Product, user: User): Money;
}

export class DefaultPricingService implements PricingService {
  calculateDiscountedPrice(product: Product, user: User): Money {
    let discount = 0;
    
    // Example business logic: Premium users get 10% discount
    if (user.name.includes('Premium')) {
      discount = 0.1;
    }
    
    const discountedAmount = product.price * (1 - discount);
    return Money.create(discountedAmount, 'USD');
  }
}
