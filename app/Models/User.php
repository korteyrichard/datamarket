<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Notifications\ResetPasswordNotification;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'phone',
        'business_name',
        'password',
        'wallet_balance', // added wallet_balance to fillable
        'role', // added role to fillable
        'api_key',
        'referral_code',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'wallet_balance' => 'decimal:2', // cast wallet_balance as decimal
            'role' => 'string', // cast role as string
        ];
    }

    /**
     * Send the password reset notification.
     *
     * @param  string  $token
     * @return void
     */
    public function sendPasswordResetNotification($token)
    {
        $this->notify(new ResetPasswordNotification($token));
    }

    public function carts()
    {
        return $this->hasMany(Cart::class);
    }

    public function agentShop()
    {
        return $this->hasOne(AgentShop::class);
    }

    public function commissions()
    {
        return $this->hasMany(Commission::class, 'agent_id');
    }

    public function withdrawals()
    {
        return $this->hasMany(Withdrawal::class, 'agent_id');
    }

    public function referrals()
    {
        return $this->hasMany(Referral::class, 'referrer_id');
    }

    public function referralCommissions()
    {
        return $this->hasMany(ReferralCommission::class, 'referrer_id');
    }

    public function referredBy()
    {
        return $this->hasOne(Referral::class, 'referred_id');
    }

    public function generateReferralCode()
    {
        do {
            $this->referral_code = strtoupper(substr(hash('sha256', $this->id . $this->email . microtime(true) . random_bytes(16)), 0, 8));
        } while (User::where('referral_code', $this->referral_code)->exists());
        
        $this->save();
        return $this->referral_code;
    }

    public function getReferralLink()
    {
        $code = $this->referral_code ?: $this->generateReferralCode();
        return url('/register?ref=' . $code);
    }
    
    /**
     * Get the default role for the user.
     *
     * @return string
     */
    protected static function boot()
    {
        parent::boot();
    
        static::creating(function ($user) {
            $user->role = $user->role ?? 'customer';
            if (!$user->referral_code) {
                do {
                    $user->referral_code = strtoupper(substr(hash('sha256', $user->email . microtime(true) . random_bytes(16)), 0, 8));
                } while (User::where('referral_code', $user->referral_code)->exists());
            }
        });
    }

    /**
     * Check if the user is a customer.
     *
     * @return bool
     */
    public function isCustomer(): bool
    {
        return $this->role === 'customer';
    }

    /**
     * Check if the user is an agent.
     *
     * @return bool
     */
    public function isAgent(): bool
    {
        return $this->role === 'agent';
    }

    /**
     * Check if the user is an admin.
     *
     * @return bool
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Check if the user is a dealer.
     *
     * @return bool
     */
    public function isDealer(): bool
    {
        return $this->role === 'dealer';
    }
}
