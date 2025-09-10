<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SplitParticipant extends Model
{
    protected $fillable = [
        'split_id',
        'user_id',
        'amount_owed',
        'status',
        'approval_status',
        'approved_at',
        'paid_at'
    ];

    protected $casts = [
        'amount_owed' => 'decimal:2',
        'approved_at' => 'datetime',
        'paid_at' => 'datetime'
    ];

    public function split(): BelongsTo
    {
        return $this->belongsTo(SplitTable::class, 'split_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopePaid($query)
    {
        return $query->where('status', 'paid');
    }

    public function scopeApproved($query)
    {
        return $query->where('approval_status', 'approved');
    }

    public function scopePendingApproval($query)
    {
        return $query->where('approval_status', 'pending');
    }

    public function scopeRejected($query)
    {
        return $query->where('approval_status', 'rejected');
    }
}
