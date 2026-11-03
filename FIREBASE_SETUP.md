# LONY login setup (Google sign in + Admin)

## 1. Firebase project
1. https://console.firebase.google.com -> Add project
2. Build > Authentication > Get started > Sign-in method > **Google** > Enable
3. Authentication > Settings > **Authorized domains** > Add: `lony-hub.github.io`
   (localhost is already allowed for testing)
4. Build > **Firestore Database** > Create database (production mode)

## 2. Paste config
Project settings > Your apps > Web (</>) > copy the config into `auth.js`:
`FIREBASE_CONFIG` and set your admin Gmail in `ADMIN_EMAILS`.

## 3. Firestore rules (this is what really protects admin data)
Firestore > Rules > replace with the following (change the admin email) and Publish:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null
        && request.auth.token.email_verified == true
        && request.auth.token.email in ['your-admin-email@gmail.com'];
    }
    match /users/{uid} {
      allow read: if isAdmin() || (request.auth != null && request.auth.uid == uid);
      allow create, update: if request.auth != null && request.auth.uid == uid
        && request.resource.data.keys().hasOnly(['name','email','photo','createdAt','lastLogin']);
      allow delete: if isAdmin();
    }
  }
}
```

## 4. Test
- `login.html` > Sign in / Sign up tab > Google
- `login.html` > Admin tab > admin Gmail > opens `admin.html`
- Other Gmail on Admin tab > "not in admin list" error

## Note
`ADMIN_EMAILS` in auth.js is public (static site), so it only controls what the page shows.
Real admin data protection = Firestore rules above. Never put secrets in these files.
