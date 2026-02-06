<?php

namespace App\Jobs;

use App\Models\Commission;
use App\Models\ReferralCommission;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Carbon\Carbon;

class ProcessCommissionAvailabilityJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle()
    {
        $cutoffDate = Carbon::now();

        // Make commissions available that have passed the refund window
        Commission::where('status', 'pending')
            ->where('available_at', '<=', $cutoffDate)
            ->update(['status' => 'available']);

        ReferralCommission::where('status', 'pending')
            ->where('available_at', '<=', $cutoffDate)
            ->update(['status' => 'available']);
    }
}