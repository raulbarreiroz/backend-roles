# Back End - Senior

## Definition
Diseña arquitecturas distribuidas (microservicios, event-driven), garantiza consistencia transaccional (Sagas, CAP), establece estrategias de tolerancia a fallos (circuit breakers, retries) y define el modelo de dominio (DDD).

## Specific Project
Sistema de reservas de vuelos con arquitectura orientada a eventos (Event Sourcing + CQRS) y consistencia eventual entre 5 dominios (vuelos, pasajeros, pagos, notificaciones, equipaje).

## Core Concepts
Event Sourcing (event store), CQRS (command/query segregation), Sagas (orquestación con Step Functions o coreografía con Kafka), Circuit Breaker (Resilience4j / Polly), Distributed Tracing (OpenTelemetry), BDD (Gherkin/Cucumber), despliegue en K8s con configmaps y secrets.

## Recommended Modern Technologies
Go 1.24 (alta concurrencia) o Rust (Axum) para servicios críticos, Temporal (workflows duraderos), GraphQL Federation 2 (Apollo Router / GraphOS), gRPC + Buf, OpenFeature, Dapr.
