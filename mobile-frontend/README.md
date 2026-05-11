# Lawra Mobile Frontend (Flutter)

This repository contains the Flutter mobile client for Lawra.

## Implemented

- One-time onboarding tour flow (`SKIP`) shown only on first app launch
- Backend-connected sign in, sign up, forgot password, and reset password screens
- Auth persistence with shared preferences so returning users land directly in the dashboard
- Borrower, lender, loans, virtual banks, settings, notifications, and about screens aligned with the web app flows
- Consistent theme setup and assets wiring using the design pages in `assets/design/`

## Backend Configuration

By default the app targets `http://localhost:8080` on desktop platforms and `http://10.0.2.2:8080` on Android emulators.
Override this with `--dart-define=LAWRA_API_BASE_URL=http://your-server:8080` when running the app.

## To Run

1. Install Flutter SDK and add it to `PATH`
2. From this folder:

```bash
flutter pub get
flutter run
```

## Notes

- The mobile screens now call the same backend endpoints used by the web frontend.
- The dashboard uses a mobile-friendly shell with drawer access to settings, notifications, about, and logout.
