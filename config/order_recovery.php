<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Order Recovery Feature Launch Date
    |--------------------------------------------------------------------------
    |
    | This date determines the cutoff for accepting Paystack references.
    | Any payment made before this date will be rejected to prevent abuse
    | of old transactions that were manually handled.
    |
    */
    'feature_launch_date' => env('ORDER_RECOVERY_LAUNCH_DATE', '2026-01-17'),

    /*
    |--------------------------------------------------------------------------
    | Maximum Reference Age (Days)
    |--------------------------------------------------------------------------
    |
    | Maximum number of days old a Paystack reference can be to still
    | be accepted for order recovery.
    |
    */
    'max_reference_age_days' => env('ORDER_RECOVERY_MAX_AGE_DAYS', 30),
];