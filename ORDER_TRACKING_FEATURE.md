# Order Tracking and Recovery Feature

## Overview
This feature addresses the issue where agent orders fail to be created due to Paystack network issues, but payment is successfully deducted. It provides a way for customers to track existing orders or recover failed orders using their Paystack payment reference.

## Features Implemented

### 1. Database Changes
- Added `paystack_reference` field to orders table (unique, nullable)
- Added `customer_email` field to orders table (nullable)
- Updated Order model fillable fields

### 2. PaystackService
- Secure verification of Paystack payment references
- Prevents duplicate payments by checking existing orders
- 30-day limit on payment references to prevent abuse
- Comprehensive error handling and logging

### 3. Order Tracking
- Track existing orders using beneficiary number + Paystack reference
- Verify payment references that don't have corresponding orders
- Display order status and details

### 4. Order Recovery
- Create orders from verified Paystack references
- Validate payment amount matches product price
- Automatic commission calculation
- Integration with external API

### 5. Frontend Interface
- "Track Order" button on shop pages
- Modal with form for beneficiary number and Paystack reference
- Display existing order details
- Interface to create order from verified payment
- Product selection for order creation

## Security Measures

### 1. Duplicate Payment Prevention
- Check if Paystack reference already exists in database
- Unique constraint on paystack_reference field

### 2. Reference Age Validation
- Only accept payment references from last 30 days
- Prevents use of old references from before feature implementation

### 3. Amount Verification
- Verify payment amount matches selected product price
- Allow 1 pesewa difference for rounding

### 4. Input Validation
- Validate beneficiary number format (10 digits)
- Validate Paystack reference format
- Verify shop and product existence

## Usage Instructions

### For Customers:
1. Visit agent shop page (e.g., `/shop/username`)
2. Click "Track Order" button in header
3. Enter beneficiary phone number (10 digits)
4. Enter Paystack payment reference
5. Click "Track Order"

### Scenarios:
1. **Order Found**: Display existing order details
2. **Payment Verified, No Order**: Show payment details and allow order creation
3. **Invalid Reference**: Show error message
4. **Already Used Reference**: Prevent duplicate order creation

## API Endpoints

### POST /shop/track-order
Track existing order or verify payment reference
```json
{
    "beneficiary_number": "0123456789",
    "paystack_reference": "payment_reference_here"
}
```

### POST /shop/create-order-from-reference
Create order from verified Paystack reference
```json
{
    "beneficiary_number": "0123456789",
    "paystack_reference": "payment_reference_here",
    "product_id": 1,
    "agent_username": "shop_username"
}
```

## Files Modified/Created

### New Files:
- `app/Services/PaystackService.php`
- `database/migrations/2026_01_16_000001_add_paystack_reference_and_customer_email_to_orders_table.php`

### Modified Files:
- `app/Models/Order.php` - Added new fillable fields
- `app/Http/Controllers/PublicShopController.php` - Added tracking methods
- `routes/web.php` - Added new routes
- `resources/js/pages/PublicShop.tsx` - Added tracking UI

## Error Handling
- Comprehensive try-catch blocks
- Detailed logging for debugging
- User-friendly error messages
- Database transactions for data integrity

## Testing
To test the feature:
1. Make a payment through an agent shop
2. Note the Paystack reference from payment confirmation
3. Use the Track Order feature to find the order
4. Test with invalid references to verify error handling

## Future Enhancements
- Admin panel to view recovered orders
- Email notifications for recovered orders
- Bulk order recovery for multiple references
- Integration with SMS notifications