// Event Handlers - Cross-aggregate communication and side effects

import { EventHandler, DomainEvent } from '@nexus/domain-core';
import { 
  UserCreatedEvent, 
  UserDeactivatedEvent,
  OrderPlacedEvent,
  ProductStockReservedEvent 
} from '@nexus/domain-core';

// Handle user-related events
export class UserEventHandlers {
  
  // Send welcome email when user is created
  static createWelcomeEmailHandler(): EventHandler<UserCreatedEvent> {
    return {
      async handle(event: UserCreatedEvent): Promise<void> {
        console.log(`Sending welcome email to ${event.email} for user ${event.aggregateId}`);
        
        // In real implementation, this would:
        // 1. Send email via email service
        // 2. Create notification record
        // 3. Update user analytics
        
        // Example: await emailService.sendWelcomeEmail(event.email, event.name);
      }
    };
  }

  // Clean up user sessions when deactivated
  static createSessionCleanupHandler(): EventHandler<UserDeactivatedEvent> {
    return {
      async handle(event: UserDeactivatedEvent): Promise<void> {
        console.log(`Cleaning up sessions for deactivated user ${event.aggregateId}`);
        
        // In real implementation:
        // 1. Invalidate all user sessions
        // 2. Remove from active user caches
        // 3. Update security logs
        
        // Example: await sessionService.invalidateAllUserSessions(event.aggregateId);
      }
    };
  }
}

// Handle order-related events
export class OrderEventHandlers {
  
  // Process payment when order is placed
  static createPaymentProcessingHandler(): EventHandler<OrderPlacedEvent> {
    return {
      async handle(event: OrderPlacedEvent): Promise<void> {
        console.log(`Processing payment for order ${event.aggregateId}, amount: ${JSON.stringify(event.totalAmount)}`);
        
        // In real implementation:
        // 1. Initiate payment processing
        // 2. Reserve inventory
        // 3. Send order confirmation
        // 4. Update analytics
        
        // Example: await paymentService.processPayment(event.aggregateId, event.totalAmount);
      }
    };
  }

  // Send order confirmation
  static createOrderConfirmationHandler(): EventHandler<OrderPlacedEvent> {
    return {
      async handle(event: OrderPlacedEvent): Promise<void> {
        console.log(`Sending order confirmation for order ${event.aggregateId} to customer ${event.customerId}`);
        
        // In real implementation:
        // 1. Get customer details
        // 2. Send confirmation email
        // 3. Create notification
        // 4. Update customer history
        
        // Example: await notificationService.sendOrderConfirmation(event.customerId, event.aggregateId);
      }
    };
  }
}

// Handle inventory-related events
export class InventoryEventHandlers {
  
  // Update inventory levels when stock is reserved
  static createInventoryUpdateHandler(): EventHandler<ProductStockReservedEvent> {
    return {
      async handle(event: ProductStockReservedEvent): Promise<void> {
        console.log(`Stock reserved for product ${event.aggregateId}: ${event.reservedQuantity} units, ${event.remainingStock} remaining`);
        
        // In real implementation:
        // 1. Update inventory tracking systems
        // 2. Check for low stock alerts
        // 3. Update product availability
        // 4. Trigger reorder if needed
        
        // Example: await inventoryService.updateStockLevels(event.aggregateId, event.remainingStock);
      }
    };
  }
}

// Event handler registry for easy setup
export class EventHandlerRegistry {
  private handlers: Map<string, EventHandler<any>[]> = new Map();

  register<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void {
    const existingHandlers = this.handlers.get(eventType) || [];
    existingHandlers.push(handler);
    this.handlers.set(eventType, existingHandlers);
  }

  getHandlers(eventType: string): EventHandler<any>[] {
    return this.handlers.get(eventType) || [];
  }

  // Setup all default handlers
  static createDefault(): EventHandlerRegistry {
    const registry = new EventHandlerRegistry();
    
    // User event handlers
    registry.register('UserCreated', UserEventHandlers.createWelcomeEmailHandler());
    registry.register('UserDeactivated', UserEventHandlers.createSessionCleanupHandler());
    
    // Order event handlers
    registry.register('OrderPlaced', OrderEventHandlers.createPaymentProcessingHandler());
    registry.register('OrderPlaced', OrderEventHandlers.createOrderConfirmationHandler());
    
    // Inventory event handlers
    registry.register('ProductStockReserved', InventoryEventHandlers.createInventoryUpdateHandler());
    
    return registry;
  }
}
