<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Agent System Feature Flags
    |--------------------------------------------------------------------------
    |
    | These flags control the availability of agent system features.
    | Set to false to disable features without breaking existing functionality.
    |
    */

    'enabled' => env('AGENT_SYSTEM_ENABLED', true),
    
    'features' => [
        'mini_shops' => env('AGENT_MINI_SHOPS_ENABLED', true),
        'commissions' => env('AGENT_COMMISSIONS_ENABLED', true),
        'referrals' => env('AGENT_REFERRALS_ENABLED', true),
        'withdrawals' => env('AGENT_WITHDRAWALS_ENABLED', true),
    ],

    'commission' => [
        'referral_percentage' => env('REFERRAL_COMMISSION_PERCENTAGE', 0.10),
        'refund_window_days' => env('COMMISSION_REFUND_WINDOW_DAYS', 7),
    ],
];