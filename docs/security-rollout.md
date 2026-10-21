# Firestore security rollout

The site currently uses Firestore through the client SDK on the server. The web API key is public by design and cannot protect the database. The deny-all rules in `firestore.rules` must be deployed only after the server switches to Firebase Admin credentials.

1. Create a service account for Firebase project `tnnn-aa170` with the minimum Firestore permissions needed by the site. Keep the JSON private. Set its entire JSON contents as `FIREBASE_SERVICE_ACCOUNT_JSON` on the Railway web service. Never put it in Git or client-side environment variables.
2. Deploy this code and confirm a signed-in customer can load products and that an owner can load the admin stock page. Both actions must work through Firebase Admin.
3. Deploy the rules with a Firebase project owner account: `firebase deploy --only firestore:rules --project tnnn-aa170`. The rules reject all direct client reads and writes; Admin SDK traffic remains authorized by IAM.
4. Verify that the site still works and that an unauthenticated Firestore client cannot read `products`, `users`, `keys`, or `auditEvents` or write `securityRateLimits`.
5. Rotate any credentials that may have been stored in Firestore while it was open, including Discord refresh tokens and other service tokens.

Do not deploy the rules before step 2. Otherwise the current server process, which has no service account, will lose database access.
