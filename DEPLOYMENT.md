# Callista — Deployment Guide (Vercel)

## Why login fails after deployment

`serviceAccountKey.json` is in `.gitignore` and never pushed to git.
Without it, Firebase Admin can't initialize and every API call fails.
The fix is to pass the same credentials as **environment variables** in your hosting dashboard.

---

## Step 1 — Set environment variables on Vercel

Go to your project on **vercel.com → Settings → Environment Variables** and add these:

| Variable | Value |
|---|---|
| `JWT_SECRET` | Any long random string, e.g. `callista_super_secret_jwt_key_2024` |
| `FIREBASE_PROJECT_ID` | `callista-43608` |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-fbsvc@callista-43608.iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | The private key from your `serviceAccountKey.json` — see note below |

### How to get FIREBASE_PRIVATE_KEY

Open `serviceAccountKey.json` in a text editor, find the `"private_key"` field.
Copy its value exactly as-is (including the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` parts, with all the `\n` characters).

Paste it into Vercel **wrapped in double quotes**:
```
"-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

> ⚠️ Keep the literal `\n` characters — do **not** press Enter to make real newlines.
> Vercel handles the unescaping automatically.

---

## Step 2 — Deploy

```bash
# Make sure you have the Vercel CLI installed
npm i -g vercel

# From the project root
vercel --prod
```

Or just push to your connected GitHub repo and Vercel will redeploy automatically.

---

## Step 3 — Verify it works

After deploying, open your browser console (F12 → Network tab) and try to log in.
You should see `POST /api/auth/login` returning `200` with a token.

If you see a `503` response, the environment variables aren't set correctly.
Check the **Vercel → Deployments → Functions Logs** for the exact error message.

---

## Local development (no change needed)

Locally, just keep `serviceAccountKey.json` in the project root and `.env` set to:
```
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
```
Run `npm run dev` as usual. The file-based path is only used locally.
