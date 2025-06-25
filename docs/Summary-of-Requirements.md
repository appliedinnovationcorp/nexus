Summary-of-Requirements.md

Project Overview:

    You’re the CEO of an AI consulting company offering AI enablement, transformation, consulting, AI-driven SaaS applications, PaaS, and fractional CTO services to SMBs and large enterprises.
    The project is a comprehensive web platform (not just a website) with multiple components:
        Marketing Website: Includes blog, case studies, product/service descriptions, testimonials, lead magnets, resources, CTAs, with a toggleable light/dark theme inspired by https://markovate.com.
        Employee Portal: Standard employee portal features (e.g., HR tools, internal resources, task management).
        Client Portal: Full-featured for clients to manage accounts, organizations, teams, projects, environments, with CRUD operations, dashboards, and customizable profiles.
        Developer Portal: Supports API access, CRUD operations on applications, API key management, inspired by Supabase and GitHub’s backend/dashboard interfaces.
        Virtual Data Room (VDR): On a subdomain for investors to perform due diligence.
        Admin Interface: Backend admin panel for site-wide management.
        PaaS and SaaS Offerings: Fully-featured, AI-driven PaaS and SaaS products accessible via the platform.
    Everything is AI-driven from inception, leveraging AI to enhance functionality, user experience, and operations.

Target Audience:

    Decision-makers at SMBs and large enterprises.
    Internal users: Admins, developers, advisors, employees.
    External users: Clients, investors, developers using the PaaS/SaaS offerings.

Key Features:

    Industry-standard features for each component (marketing site, portals, PaaS/SaaS).
    User accounts with email verification, password management, and invitations.
    Personal dashboards and customizable profiles.
    Payment processing, real-time chat, third-party SaaS integrations.
    API for developers with CRUD operations and API key management.
    Modular design with a common core and plug-and-play modules.

Design Preferences:

    Marketing site: Similar to https://markovate.com (light/dark toggle).
    Backend/dashboard interfaces: Inspired by Supabase and GitHub.

Timeline and Budget:

    Start immediately, complete ASAP.
    Use only best-of-breed FOSS (Free and Open-Source Software) solutions.
    Budget not explicitly stated but implied to support an enterprise-grade MVP.

Technical Requirements:

    Compliance: Meet typical standards (e.g., GDPR, SOC 2, HIPAA if applicable).
    Architecture: Domain-Driven Design (DDD), Hexagonal/Clean/Ports and Adapters, Microservices, Event-Driven Architecture, Event Sourcing, Event Store.
    Best Practices: 12-Factor App methodology, MACH principles (Microservices, API-first, Cloud-native, Headless).
    Database: Agnostic connectivity.
    Deployment: Platform-agnostic, enterprise-grade, production-ready.
    Monorepo structure, modular design with a common core.
    MVP to be feature-rich, scalable, and exceed industry standards.

Post-Launch Evolution:

    Ongoing updates, scaling for more users, and new feature additions.
    Goal to redefine industry standards and surpass competitors.
