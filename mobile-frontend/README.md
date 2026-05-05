# Lawra Mobile Frontend (Flutter)

This repository contains the **frontend-only Flutter implementation** of the provided Lawra design PDF/screens.

## Implemented

- One-time onboarding tour flow (`SKIP`) shown only on first app launch
- Auth entry flow (sign up/log in visual state)
- Screen hub to navigate all mocked frontend pages for integration/testing
- Consistent theme setup and assets wiring

## Current Constraint

Flutter SDK is not installed/configured on this machine yet (`flutter` command not found), so the app could not be executed locally in this session.

## To Run

1. Install Flutter SDK and add it to `PATH`
2. From this folder:

```bash
flutter pub get
flutter run
```

## Notes for Backend Integration

- All current screens are frontend stubs using static design assets.
- You can progressively replace each image-backed screen with real widgets/API wiring while preserving route names and flow behavior.
