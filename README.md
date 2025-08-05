# EduPost Mobile

EduPost Mobile is a React Native application built with Expo that allows
students to read posts and teachers to create, edit and manage posts and
users.  The app integrates with the EduPost REST API hosted on Render
(`https://edupost-latest.onrender.com`).  Role‑based access control is
implemented on both the client and server: teachers can create and manage
posts, teachers and students, while students have read‑only access to
public posts.

## 📂 Project structure

```
edupost-mobile/
├── src/
│   ├── api/           # Axios instance and API helpers
│   ├── components/    # Reusable UI components (empty for now)
│   ├── context/       # Global state containers (AuthContext)
│   ├── navigation/    # React Navigation configuration
│   ├── screens/       # Screen components organised by feature
│   │   ├── Login/
│   │   ├── Register/
│   │   ├── Posts/
│   │   ├── Admin/
│   │   ├── Teachers/
│   │   └── Students/
│   ├── App.tsx        # App root
│   └── ...
├── .env.example       # Sample environment file
├── package.json       # Dependencies and scripts
├── tsconfig.json      # TypeScript configuration
└── README.md          # You are here
```

## ✅ Features

### Authentication

* **Login** and **Register** screens using email and password.
* JWT access token is securely stored in `AsyncStorage` and automatically
  attached to every request via an axios interceptor.
* Role (TEACHER vs STUDENT) is determined from the user profile and used
  to conditionally show or hide screens.

### Posts

* Students and teachers can browse a paginated list of posts.
* Keyword search by title or content.
* Detailed post view with title, content and author information.
* Teachers can create new posts, edit existing posts and delete posts.

### Administration (Teachers only)

* Admin dashboard showing all posts with quick access to edit/delete.
* Teachers management: list, create, edit and delete teacher accounts.
* Students management: list, create, edit and delete student accounts.

## 🛠 Setup

This project uses the Expo tooling (SDK 53) which makes it easy to get
started with React Native development.  You will need recent versions of
Node.js and npm installed.  Android Studio (with an emulator) or a
physical device with Expo Go is required to run the application.

### 1. Install dependencies

Clone the repository and install the dependencies:

```bash
git clone <this‑repo>.git
cd edupost-mobile
npm install
```

> **Note**: The dependencies declared in `package.json` reference Expo
> and React Native packages.  If you see an error about missing
> dependencies, ensure that you are running the installation from within
> the project directory.

### 2. Configure the API base URL

The app points at the hosted backend by default.  To override this (for
example if you are running the API locally) you can create a `.env`
file in the project root and define `EXPO_PUBLIC_API_URL`:

```
EXPO_PUBLIC_API_URL=http://localhost:3000
```

### 3. Start the development server

To run the app in development mode use the Expo CLI.  If you don't have
the CLI installed globally you can run it via `npx`:

```bash
npx expo start
```

The Metro bundler dashboard will open in your browser.  From there you
can launch the app on an Android emulator (Android Studio) or on a
physical device using the Expo Go app.  Make sure your device and
computer are on the same network.

### 4. Build for production (optional)

Follow the Expo documentation to build APKs or App Bundles for
submission to app stores:

* [Building a standalone app](https://docs.expo.dev/classic/building-standalone-apps/)

## 🔐 Authentication & roles

The backend issues a JWT when a user logs in.  The token is stored in
`AsyncStorage` under the key `@edupost/token` and is automatically
attached to every request.  When the app starts it attempts to read the
token and decode the email from its payload to fetch the user profile.
If decoding fails or the token is invalid the user must log in again.

Roles (STUDENT or TEACHER) are part of the user profile returned by the
backend.  These roles determine which screens and actions a user can
access.  For example, the **Admin** screen and **Create/Edit Post**
screens are hidden from students.  The backend also enforces role
permissions on every endpoint.

## 🎓 Testing

When the API is available you can verify the following scenarios:

1. Register a new student and log in.  Ensure that the student can
   browse posts but cannot access administrative screens.
2. Register a new teacher and log in.  Verify that the teacher can
   create, edit and delete posts, and manage students and other
   teachers.
3. Confirm that tokens are sent in the `Authorization` header by
   inspecting network requests (e.g. using React Native Debugger).
4. Attempt to call a teacher‑only route with a student token and
   observe that the backend returns an authorization error.

## 🧹 Notes

* Styling is intentionally simple; feel free to customise colours and
  layouts with `StyleSheet` or a utility framework like Tailwind.
* A `.env.example` file is provided to document environment variables;
  copy it to `.env` and adjust values as needed.
* The project uses TypeScript throughout to provide type safety.
* If you add more components, group them under `src/components` to
  promote reuse.

Enjoy building with EduPost!