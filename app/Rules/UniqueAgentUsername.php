<?php

namespace App\Rules;

use App\Models\AgentShop;
use Illuminate\Contracts\Validation\Rule;

class UniqueAgentUsername implements Rule
{
    public function passes($attribute, $value)
    {
        return !AgentShop::where('username', $value)->exists();
    }

    public function message()
    {
        return 'This username is already taken.';
    }
}