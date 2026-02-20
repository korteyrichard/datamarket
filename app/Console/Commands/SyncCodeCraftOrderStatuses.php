<?php

namespace App\Console\Commands;

use App\Services\CodeCraftOrderStatusSyncService;
use Illuminate\Console\Command;

class SyncCodeCraftOrderStatuses extends Command
{
    protected $signature = 'orders:sync-codecraft-status';
    protected $description = 'Sync CodeCraft order statuses with external API';

    public function handle()
    {
        $this->info('Starting CodeCraft order status sync...');
        
        $syncService = new CodeCraftOrderStatusSyncService();
        $syncService->syncOrderStatuses();
        
        $this->info('CodeCraft order status sync completed.');
    }
}
