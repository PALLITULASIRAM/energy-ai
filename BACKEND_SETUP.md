# Backend Setup Instructions

## Quick Start

1. **Install Dependencies**
```bash
cd backend
npm install
```

2. **Start Backend Server**
```bash
npm run dev
```

The backend will run on `http://localhost:3001`

3. **Start Frontend** (in another terminal)
```bash
cd ..
bun run dev
```

The frontend will run on `http://localhost:5173`

## What's Changed

✅ **Secure Payment Processing**
- Razorpay key secret is now on backend only
- Order creation happens on backend
- Payment verification happens on backend
- Frontend only stores the Razorpay key ID

✅ **API Endpoints**
- `GET /api/health` - Health check
- `GET /api/razorpay/key` - Get Razorpay key ID (safe)
- `POST /api/razorpay/create-order` - Create payment order
- `POST /api/razorpay/verify-payment` - Verify payment signature
- `POST /api/razorpay/webhook` - Handle webhooks

## Testing

With both servers running:
1. Go to http://localhost:5173
2. Navigate to Billing page
3. Generate or fetch a bill
4. Click "Pay" button
5. Use Razorpay test card: 4111 1111 1111 1111
6. Complete payment

## Environment Variables

### Frontend (.env)
```env
VITE_BACKEND_API_URL=http://localhost:3001/api
VITE_GEMINI_API_KEY=your_key
```

### Backend (.env)
```env
RAZORPAY_KEY_ID=rzp_test_CVbypqu6YtbzvT
RAZORPAY_KEY_SECRET=Qi0jllHSrENWlNxGl0QXbJC5
PORT=3001
FRONTEND_URL=http://localhost:5173
```

## Production Deployment

### Backend (Railway/Render/Heroku)
1. Deploy the `backend` folder
2. Set environment variables in platform
3. Note the backend URL

### Frontend (Vercel/Netlify)
1. Deploy the root folder
2. Set `VITE_BACKEND_API_URL` to your backend URL
3. Set `VITE_GEMINI_API_KEY` 

## Security Features

✅ Key secret never exposed to frontend
✅ CORS restricted to frontend URL
✅ Signature verification on backend
✅ Environment-based configuration
✅ Request logging for monitoring

## Troubleshooting

**Backend not starting?**
- Check if port 3001 is available
- Run `npm install` first
- Check `.env` file exists with correct values

**Frontend can't connect to backend?**
- Ensure backend is running on port 3001
- Check CORS settings allow frontend URL
- Verify `VITE_BACKEND_API_URL` in frontend `.env`

**Payment fails?**
- Check browser console for errors
- Verify Razorpay credentials are correct
- Test backend endpoints with curl
- Check backend logs for errors
