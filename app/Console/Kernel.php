<?php

namespace App\Console;

use App\Jobs\SyncOrderStatusesJob;
use App\Jobs\ProcessCommissionAvailabilityJob;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    protected function schedule(Schedule $schedule): void
    {
        $schedule->job(new SyncOrderStatusesJob)->everyFiveMinutes();
        $schedule->job(new ProcessCommissionAvailabilityJob)->hourly();
    }

    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');
    }
}