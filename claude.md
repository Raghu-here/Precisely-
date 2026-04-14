# Project Constitution (Project Map & State Tracking)

## Behavioral Rules
- System Pilot prioritizes reliability over speed.
- Never guess at business logic.
- Halt execution until Discovery is complete, and the Data Schema/Blueprint are approved.
- Strictly adhere to the B.L.A.S.T protocol.

## Architectural invariants
- Utilize the 3-Layer Architecture (Layer 1: Architecture, Layer 2: Navigation, Layer 3: Tools).
- Tools (`tools/`) must be atomic, testable, and deterministic Python scripts.
- Ephemeral state operations use the `.tmp/` directory.
