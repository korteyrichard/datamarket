# Order Routing Implementation Summary

## Overview
Implemented a dual-service routing system for orders based on network type:
- **MTN orders** → OrderPusherService (existing)
- **Telecel, AT Data (Instant), BigTime orders** → CodeCraftOrderPusherService (new)

## Files Created

### 1. CodeCraftOrderPusherService.php
**Location:** `app/Services/CodeCraftOrderPusherService.php`

**Features:**
- Handles Telecel, AT (Ishare), and BigTime orders
- Routes to different endpoints based on network type
- Saves reference_id after successful order push
- Includes order status checking functionality
- Uses environment variable `CODECRAFT_API_KEY` for authentication

**Key Methods:**
- `pushOrderToApi(Order $order)` - Main method to push orders to CodeCraft API
- `checkOrderStatus($referenceId, $isBigTime)` - Check order status
- `getNetworkFromProduct($productName)` - Determines network from product name
- `getEndpoint($network)` - Returns appropriate API endpoint

### 2. CodeCraftOrderStatusSyncService.php
**Location:** `app/Services/CodeCraftOrderStatusSyncService.php`

**Features:**
- Syncs order statuses for CodeCraft orders every 5 minutes
- Checks orders with status 'pending' or 'processing'
- Updates order status based on API response
- Sends SMS notifications when orders complete
- Manages commission availability

**Key Methods:**
- `syncOrderStatuses()` - Main sync method
- `syncCodeCraftOrderStatus($order)` - Sync individual order
- `mapCodeCraftStatus($externalStatus)` - Maps external status to internal status

## Files Modified

### 1. OrdersController.php
**Location:** `app/Http/Controllers/OrdersController.php`

**Changes:**
- Added import for `CodeCraftOrderPusherService`
- Updated checkout method to route orders based on product name
- Added logging for routing decisions

### 2. Api/OrdersController.php
**Location:** `app/Http/Controllers/Api/OrdersController.php`

**Changes:**
- Added import for `CodeCraftOrderPusherService`
- Updated createOrder method with same routing logic

### 3. PublicShopController.php
**Location:** `app/Http/Controllers/PublicShopController.php`

**Changes:**
- Added import for `CodeCraftOrderPusherService`
- Updated dealer shop order routing

### 4. OrderPusherService.php
**Location:** `app/Services/OrderPusherService.php`

**Changes:**
- Updated to only process MTN orders
- Returns `null` for non-MTN orders

### 5. OrderStatusSyncService.php
**Location:** `app/Services/OrderStatusSyncService.php`

**Changes:**
- Added CodeCraft sync service integration
- Now syncs both MTN and CodeCraft orders

### 6. AdminDashboardController.php
**Location:** `app/Http/Controllers/AdminDashboardController.php`

**Changes:**
- Added `codeCraftApiEnabled` to dashboard data
- Added `toggleCodeCraftApi()` method

### 7. Admin/Dashboard.tsx
**Location:** `resources/js/pages/Admin/Dashboard.tsx`

**Changes:**
- Added second toggle for CodeCraft API

### 8. routes/web.php
**Changes:**
- Added route: `admin.codecraft.api.toggle`

## Environment Configuration

Add to your `.env` file:
```
CODECRAFT_API_KEY=your_api_key_here
```

## Admin Dashboard Controls

The admin dashboard now has two separate toggles:

1. **Order Pusher API (MTN)** - Controls MTN orders
   - Setting key: `api_enabled`
   - Route: `admin.api.toggle`

2. **CodeCraft API (Telecel, AT, BigTime)** - Controls Telecel, AT Data, and BigTime orders
   - Setting key: `codecraft_api_enabled`
   - Route: `admin.codecraft.api.toggle`

Both APIs are enabled by default and can be toggled independently from the admin dashboard.

## Network Routing Logic

### CodeCraft API (New Service)
- **Telecel** - Product name contains 'telecel'
- **AT Data (Instant)** - Product name contains 'at data'
- **AT (Big Packages)** - Product name contains 'at (big packages)'

### OrderPusher API (Existing Service)
- **MTN** - Product name contains 'mtn'

## Order Status Sync

The system automatically syncs order statuses every 5 minutes:

- **Scheduler**: Runs `SyncOrderStatusesJob` every 5 minutes
- **MTN Orders**: Synced via OrderStatusSyncService (Jaybart API)
- **CodeCraft Orders**: Synced via CodeCraftOrderStatusSyncService
- **Status Mapping**: Pending/Processing → processing, Completed/Successful → completed, Failed → cancelled
- **Actions on Completion**: Sends SMS, makes commission available
- **Actions on Cancellation**: Reverses commission

## API Endpoints

### CodeCraft API
- Base URL: `https://api.codecraftnetwork.com/api`
- Regular orders: `/initiate.php`
- BigTime orders: `/special.php`
- Status check (regular): `/response_regular.php`
- Status check (BigTime): `/response_big_time.php`

## Testing Checklist

- [ ] Add `CODECRAFT_API_KEY` to `.env` file
- [ ] Test MTN order → Should use OrderPusherService
- [ ] Test Telecel order → Should use CodeCraftOrderPusherService
- [ ] Test AT Data (Instant) order → Should use CodeCraftOrderPusherService
- [ ] Test BigTime order → Should use CodeCraftOrderPusherService
- [ ] Check logs for proper routing decisions
- [ ] Verify SMS notifications for completed AT orders
- [ ] Test order status checking functionality

## Notes

- The routing decision is made in the OrdersController after order creation
- Both services handle their own error logging and status updates
- The CodeCraft service includes SMS notification for completed AT orders
- All routing decisions are logged for debugging purposes
