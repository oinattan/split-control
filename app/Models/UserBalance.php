<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserBalance extends Model
{
    protected $fillable = [
        'creditor_user_id',
        'debtor_user_id',
        'balance'
    ];

    protected $casts = [
        'balance' => 'decimal:2'
    ];

    public function creditor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creditor_user_id');
    }

    public function debtor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'debtor_user_id');
    }

    /**
     * Cria ou atualiza saldo entre dois usuários
     */
    public static function createOrIncrement($creditorId, $debtorId, $amount)
    {
        $balance = self::where('creditor_user_id', $creditorId)
            ->where('debtor_user_id', $debtorId)
            ->first();

        if ($balance) {
            $balance->increment('balance', (float) $amount);
            $balance->touch();
            return $balance;
        }

        return self::create([
            'creditor_user_id' => $creditorId,
            'debtor_user_id' => $debtorId,
            'balance' => $amount,
        ]);
    }
}
