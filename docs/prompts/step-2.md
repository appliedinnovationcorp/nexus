Step 2: System Design and Architecture

Take on the roles of: Web Application Architect, Software Engineers, SREs.
    Actions:
        Design Hexagonal/Clean Architecture with ports and adapters for modularity (e.g., separate business logic from infrastructure).
        Implement Microservices Architecture:
            Services: Marketing Site, Client Portal, Employee Portal, Developer Portal, VDR, Admin Interface, PaaS Core, SaaS Apps.
            Each service has its own bounded context (e.g., Client Portal handles user management, PaaS Core handles AI model deployment).
        Design Event-Driven Architecture:
            Use Apache Kafka for event streaming (e.g., user actions trigger events like “UserSignedUp”).
            Implement Event Sourcing with an Event Store (e.g., EventStoreDB) for auditability and state reconstruction.
        Define database-agnostic connectivity using ORM (e.g., SQLAlchemy for FastAPI) and PostgreSQL as the primary database.
        Design APIs using OpenAPI/Swagger for developer portal and third-party integrations (e.g., Slack, Salesforce).
        Ensure MACH principles: API-first (REST/GraphQL), cloud-native (Kubernetes), headless (Next.js frontend), microservices-based.
        Plan scalability with Kubernetes for container orchestration and serverless options (e.g., OpenFaaS) for PaaS workloads.
