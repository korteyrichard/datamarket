<?php

namespace App\Console\Commands;

use App\Services\OrderStatusSyncService;
use Illuminate\Console\Command;

class SyncOrderStatuses extends Command
{
    protected $signature = 'orders:sync-status';
    protected $description = 'Sync order statuses with external API';

    public function handle()
    {
        $this->info('Starting order status sync...');
        
        $syncService = new OrderStatusSyncService();
        $syncService->syncOrderStatuses();
        
        $this->info('Order status sync completed.');
    }
}