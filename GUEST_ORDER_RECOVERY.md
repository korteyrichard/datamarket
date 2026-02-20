# Guest Order Recovery Feature

## Overview
This feature allows guest users (users without accounts) to recover their orders if payment was deducted by Paystack but the order wasn't created due to network issues or payment callback failures.

## Features Implemented

### 1. Guest Reference Format
- All guest order payments now use the **`quest_` prefix** for Paystack references
- Format: `quest_<random_16_chars>`
- Example: `quest_a7f3k9p2m1q8r5t2`

### 2. Reference Validation
- The PaystackService now validates that references must start with `quest_`
- Invalid references are rejected with a clear error message
- Only guest orders with the `quest_` prefix can be recovered

### 3. Duplicate Prevention
- Same Paystack reference cannot be used for more than one order
- System checks if a reference is already used before creating an order
- Prevents payment fraud and duplicate order creation

### 4. Order Recovery Flow
Users can access order recovery from:

#### A. **Home Page** (`/`)
- Click **"📋 Track Order"** button in the navigation bar
- Available on both desktop and mobile

#### B. **Agent Shop Page** (`/shop/{username}`)
- Click **"📋 Track Order"** button in the shop header
- Available on both desktop and mobile

## How It Works

### Step 1: Guest Makes Payment
1. Guest navigates to home page or agent shop
2. Selects a product and enters their phone number and email
3. Clicks "Proceed to Payment"
4. Is redirected to Paystack to complete payment
5. **Important**: Guest receives a Paystack reference starting with `quest_`

### Step 2: Payment Fails to Create Order
Due to network or technical issues:
- Paystack deducts money
- Order is NOT created in the database
- Guest has the Paystack reference from the payment confirmation

### Step 3: Guest Recovers Order
1. Clicks **"Track Order"** button on home page or shop page
2. Enters:
   - **Beneficiary Phone Number**: 10-digit phone number (0XXXXXXXXX)
   - **Paystack Reference**: The `quest_` reference from payment confirmation
3. System:
   - Verifies the reference with Paystack API
   - Checks if an order already exists with that reference
   - If order exists: Returns order details
   - If order doesn't exist: Shows products matching the payment amount

### Step 4: Create Order (if needed)
1. If no order exists, user can select a product from the list
2. Click "Create Order" to complete the order creation
3. System creates the order and associates it with the Paystack reference

## Database Changes

### Orders Table
Added two new fields:
- `paystack_reference` (string, unique, nullable): Stores the Paystack payment reference
- `customer_email` (string, nullable): Stores the guest customer's email

## API Endpoints

### POST `/shop/track-order`
Track existing order or verify payment reference

**Request:**
```json
{
    "beneficiary_number": "0123456789",
    "paystack_reference": "quest_a7f3k9p2m1q8r5t2"
}
```

**Response (Order Found):**
```json
{
    "success": true,
    "order_found": true,
    "order": {
        "id": 123,
        "status": "processing",
        "total": 45.00,
        "beneficiary_number": "0123456789",
        "network": "MTN",
        "customer_email": "user@example.com",
        "created_at": "2026-02-19 10:30:00",
        "products": [
            {
                "name": "5GB Data",
                "description": "5GB data bundle",
                "network": "MTN"
            }
        ]
    }
}
```

**Response (Order Not Found, Payment Verified):**
```json
{
    "success": true,
    "order_found": false,
    "can_create_order": true,
    "payment_data": {
        "reference": "quest_a7f3k9p2m1q8r5t2",
        "amount": 45.00,
        "email": "user@example.com",
        "paid_at": "2026-02-19 10:15:00"
    }
}
```

**Response (Error):**
```json
{
    "success": false,
    "message": "This payment reference has already been used for an order"
}
```

### POST `/shop/create-order-from-reference`
Create order from verified Paystack reference

**Request:**
```json
{
    "beneficiary_number": "0123456789",
    "paystack_reference": "quest_a7f3k9p2m1q8r5t2",
    "product_id": 1,
    "agent_username": "shop_username"
}
```

**Response:**
```json
{
    "success": true,
    "order": {
        "id": 124,
        "status": "processing",
        "total": 45.00,
        "beneficiary_number": "0123456789",
        "network": "MTN"
    }
}
```

## Frontend Components

### Welcome Page (`resources/js/pages/welcome.tsx`)
- **"Track Order"** button in navigation (desktop and mobile)
- Modal form for entering beneficiary number and Paystack reference
- Results display for tracking outcomes
- Responsive design with proper styling

### PublicShop Page (`resources/js/pages/PublicShop.tsx`)
- Existing **"Track Order"** button in shop header
- Same modal functionality as home page
- Shop-specific branding maintained

## Security Measures

### 1. Reference Validation
- Must start with `quest_` prefix
- Minimum length validation
- Format verification with Paystack API

### 2. Duplicate Prevention
- Unique constraint on `paystack_reference` field
- Database check before processing
- Prevents same reference from creating multiple orders

### 3. Amount Verification
- Verifies payment amount matches selected product price
- Allows 1 pesewa difference for rounding
- Prevents amount fraud

### 4. Age Validation
- Payment references must be from last 30 days
- Prevents use of old references
- Feature launch date: 2026-01-17

### 5. Input Validation
- Beneficiary number: 10 digits (0XXXXXXXXX)
- Paystack reference: 10-100 characters
- Email validation on payment data
- Shop and product existence verification

## Configuration

### `config/order_recovery.php`
```php
return [
    'feature_launch_date' => '2026-01-17',      // Feature launch date
    'max_reference_age_days' => 30,             // How long references are valid
    'enabled' => true                            // Feature toggle
];
```

## Error Handling

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid payment reference format" | Reference is empty or too short | Enter the complete reference from payment confirmation |
| "This is not a valid guest order reference" | Reference doesn't start with 'quest' | Reference must start with 'quest_' |
| "This payment reference has already been used" | Reference was already used for an order | Contact support if this is a duplicate |
| "Payment was not successful" | Reference doesn't exist or payment failed | Verify the reference is correct |
| "Payment reference is too old" | Reference is older than 30 days | Contact support for old references |
| "Failed to verify reference with Paystack" | API error with Paystack | Try again or contact support |

## User Guide

### For Guest Users

1. **Making a Purchase:**
   - Visit the home page or an agent shop
   - Select a product
   - Enter your email and phone number
   - Proceed to Paystack payment
   - **Save the payment reference** from the confirmation

2. **If Order Doesn't Appear:**
   - Click "Track Order" button
   - Enter your phone number
   - Enter the Paystack reference (e.g., quest_abc123...)
   - Click "Track Order"

3. **What Happens Next:**
   - **If order exists:** View your order details and status
   - **If order doesn't exist:** Select a product to create your order

### For Support Team

- Guide users to click "Track Order" on home page
- Ensure reference starts with 'quest_'
- Verify phone number format (10 digits, starts with 0)
- Check Paystack dashboard to confirm payment was successful
- Can manually create orders if system fails

## Testing

### Test Case 1: Valid Recovery
1. Make a purchase with phone `0123456789`
2. Note the Paystack reference (e.g., `quest_test123...`)
3. Click "Track Order"
4. Enter phone and reference
5. ✅ Order details should display

### Test Case 2: Invalid Reference Format
1. Click "Track Order"
2. Enter phone and a reference not starting with 'quest'
3. ✅ Error message: "This is not a valid guest order reference"

### Test Case 3: Duplicate Reference
1. Create an order with reference `quest_abc123`
2. Try to create another order with the same reference
3. ✅ Error message: "This payment reference has already been used"

### Test Case 4: Recover Missing Order
1. Make a payment but order fails to create
2. Click "Track Order"
3. Enter phone and Paystack reference
4. ✅ System shows "Order Not Found" with payment details
5. ✅ Can select a product and create the order

## Files Modified/Created

### Created Files:
- `config/order_recovery.php` - Configuration file
- `database/migrations/*_add_paystack_fields_to_orders.php` - Database migration

### Modified Files:
- `app/Http/Controllers/PublicShopController.php`
  - Updated `purchase()`: Changed reference format to `quest_`
  - `trackOrder()`: Already exists
  - `createOrderFromReference()`: Already exists

- `app/Services/PaystackService.php`
  - Added `quest_` prefix validation in `verifyReference()`

- `resources/js/pages/welcome.tsx`
  - Added Track Order modal
  - Added button to navigation
  - Added handler functions

- `app/Models/Order.php`
  - Already has `paystack_reference` in fillable fields

## Rollback Instructions

If needed to rollback:

1. **Revert reference format:**
   ```php
   $reference = 'agent_order_' . \Illuminate\Support\Str::random(16);
   ```

2. **Remove validation from PaystackService:**
   - Remove the `str_starts_with()` check

3. **Disable UI:**
   - Hide "Track Order" buttons in welcome and PublicShop pages

## Future Enhancements

- [ ] Add SMS notification with order recovery link
- [ ] Add WhatsApp integration for order recovery
- [ ] Add order recovery email notifications
- [ ] Add admin dashboard to manage failed recoveries
- [ ] Add retry mechanism for automatic recovery
- [ ] Add QR code for quick order recovery
- [ ] Add multi-language support for error messages

## Support

For issues or questions:
1. Check the error message in the modal
2. Verify Paystack reference starts with 'quest'
3. Verify phone number format (10 digits)
4. Contact support team with reference number
