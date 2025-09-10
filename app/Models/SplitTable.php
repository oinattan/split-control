<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SplitTable extends Model
{
    protected $table = 'split_table';
    
    protected $fillable = [
        'description',
        'total_amount',
    'participants_snapshot',
    'participants_count',
    'split_type',
        'amount_per_person',
        'expense_date',
        'payer_user_id',
        'created_by',
        'status',
        'is_paid',
        'paid_at'
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'participants_snapshot' => 'array',
        'participants_count' => 'integer',
        'split_type' => 'string',
        'expense_date' => 'date',
        'is_paid' => 'boolean',
        'paid_at' => 'datetime'
    ];

    public function payer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'payer_user_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function participants(): HasMany
    {
        return $this->hasMany(SplitParticipant::class, 'split_id');
    }

    public function pendingParticipants(): HasMany
    {
        return $this->hasMany(SplitParticipant::class, 'split_id')
                    ->where('status', 'pending');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopePendingApproval($query)
    {
        return $query->where('status', 'pending_approval');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function isFullyApproved(): bool
    {
        return $this->participants()->where('approval_status', '!=', 'approved')->count() === 0;
    }

    public function isFullyPaid(): bool
    {
        return $this->participants()->where('status', '!=', 'paid')->count() === 0;
    }
}
