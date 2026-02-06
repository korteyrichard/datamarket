<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class GenerateReferralCodes extends Command
{
    protected $signature = 'referrals:generate-codes';
    protected $description = 'Generate referral codes for existing users who don\'t have one';

    public function handle()
    {
        $users = User::whereNull('referral_code')->get();
        
        $this->info("Found {$users->count()} users without referral codes.");
        
        $bar = $this->output->createProgressBar($users->count());
        $bar->start();
        
        foreach ($users as $user) {
            $user->generateReferralCode();
            $bar->advance();
        }
        
        $bar->finish();
        $this->newLine();
        $this->info('Referral codes generated successfully!');
    }
}