# Back End - Semi Senior

## Definition
Aplica patrones de diseño (MVC, Inyección de dependencias), gestiona autenticación (JWT, OAuth2), implementa caché distribuida (Redis) y orquesta la lógica de negocio compleja.

## Specific Project
Microservicio de procesamiento de órdenes de pago que recibe eventos de una cola (RabbitMQ), valida stock con Redis, y notifica vía WebSockets al frontend.

## Core Concepts
Patrón Repositorio + Unit of Work, Redis (caché y pub/sub), Message Brokers (AMQP/SQS), OAuth2 / OpenID Connect (Flujo Authorization Code), pruebas unitarias (Jest/Pytest) y de integración (testcontainers), manejo de transacciones con isolation levels.

## Recommended Modern Technologies
NestJS (con GraphQL y gRPC), Spring Boot 3.4 (Java 21 + virtual threads), o .NET 9 (Minimal APIs), Redis Stack, RabbitMQ o AWS SQS/SNS, TypeORM o MikroORM, Testcontainers.
