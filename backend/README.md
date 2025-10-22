# Energy Oracle Payment Backend

A secure Node.js/Express backend for handling Razorpay payment operations.

## Features

- ✅ Create Razorpay orders securely
- ✅ Verify payment signatures with HMAC-SHA256
- ✅ Fetch payment details
- ✅ Webhook handler for payment events
- ✅ CORS enabled for frontend
- ✅ Environment variable configuration
- ✅ Request logging

## Installation

```bash
cd backend
npm install
```

## Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update `.env` with your Razorpay credentials:
```env
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
PORT=3001
FRONTEND_URL=http://localhost:5173
```

## Running

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3001`

## API Endpoints

### Health Check
```http
GET /api/health
```
Response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-22T...",
  "razorpay_configured": true
}
```

### Get Razorpay Key ID
```http
GET /api/razorpay/key
```
Response:
```json
{
  "key_id": "rzp_test_..."
}
```

### Create Order
```http
POST /api/razorpay/create-order
Content-Type: application/json

{
  "amount": 1375.50,
  "currency": "INR",
  "notes": {
    "bill_number": "BILL-123",
    "service_number": "SVC-456"
  }
}
```
Response:
```json
{
  "success": true,
  "order_id": "order_...",
  "amount": 137550,
  "currency": "INR",
  "receipt": "receipt_..."
}
```

### Verify Payment
```http
POST /api/razorpay/verify-payment
Content-Type: application/json

{
  "razorpay_order_id": "order_...",
  "razorpay_payment_id": "pay_...",
  "razorpay_signature": "signature_..."
}
```
Response:
```json
{
  "success": true,
  "verified": true,
  "message": "Payment verified successfully",
  "payment_id": "pay_...",
  "order_id": "order_..."
}
```

### Get Payment Details
```http
GET /api/razorpay/payment/{payment_id}
```

### Webhook Endpoint
```http
POST /api/razorpay/webhook
```

## Security Features

- 🔐 Key secret never exposed to frontend
- 🔐 HMAC-SHA256 signature verification
- 🔐 Webhook signature validation
- 🔐 CORS restricted to frontend URL
- 🔐 Environment variable configuration

## Testing with cURL

### Create Order
```bash
curl -X POST http://localhost:3001/api/razorpay/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "currency": "INR",
    "notes": {
      "bill_number": "TEST-123"
    }
  }'
```

### Verify Payment
```bash
curl -X POST http://localhost:3001/api/razorpay/verify-payment \
  -H "Content-Type: application/json" \
  -d '{
    "razorpay_order_id": "order_xxx",
    "razorpay_payment_id": "pay_xxx",
    "razorpay_signature": "signature_xxx"
  }'
```

## Deployment

### Railway / Render / Heroku
1. Set environment variables in platform dashboard
2. Deploy the `backend` folder
3. Update `FRONTEND_URL` to your production frontend URL

### VPS / Cloud Server
```bash
# Install dependencies
npm install --production

# Use PM2 for process management
npm install -g pm2
pm2 start server.js --name "energy-oracle-backend"
pm2 startup
pm2 save
```

## Error Handling

All endpoints return consistent error responses:
```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message"
}
```

## Logging

Server logs all requests and operations:
```
2025-10-22T... - POST /api/razorpay/create-order
Creating Razorpay order: { amount: 137550, ... }
Order created successfully: order_xxx
```

## Support

For issues or questions about Razorpay integration:
- Razorpay Docs: https://razorpay.com/docs/
- API Reference: https://razorpay.com/docs/api/
