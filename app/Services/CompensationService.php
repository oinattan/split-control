<?php

namespace App\Services;

use App\Models\SplitTable;
use App\Models\SplitParticipant;
use Illuminate\Support\Facades\DB;

class CompensationService
{
    /**
     * Verifica e marca splits como concluídos automaticamente quando há compensação total
     */
    public static function checkAndCompleteCompensatedSplits()
    {
        // Buscar todos os splits ativos
        $activeSplits = SplitTable::where('status', 'active')->get();
        
        foreach ($activeSplits as $split) {
            self::checkSplitForAutoCompletion($split);
        }
    }

    /**
     * Verifica se um split específico pode ser marcado como concluído por compensação
     */
    private static function checkSplitForAutoCompletion(SplitTable $split)
    {
        $payerId = $split->payer_user_id;
        $compensatedParticipants = [];
        
        // Verificar cada participante que ainda não pagou
        $pendingParticipants = $split->participants()->where('status', 'pending')->get();
        
        foreach ($pendingParticipants as $participant) {
            $participantId = $participant->user_id;
            
            // Pular se for o próprio pagador
            if ($participantId == $payerId) {
                continue;
            }
            
            // Calcular saldo líquido entre pagador e participante
            $netBalance = self::calculateNetBalance($payerId, $participantId);
            
            // Se o participante deve menos ou igual ao que o pagador deve para ele, compensar
            if ($netBalance <= 0 && abs($netBalance) >= $participant->amount_owed) {
                $compensatedParticipants[] = $participant;
            }
        }
        
        // Se há participantes compensados, marcar como pagos automaticamente
        if (!empty($compensatedParticipants)) {
            DB::transaction(function () use ($compensatedParticipants, $split) {
                foreach ($compensatedParticipants as $participant) {
                    $participant->update([
                        'status' => 'paid',
                        'paid_at' => now()
                    ]);
                }
                
                // Verificar se todos os participantes agora estão pagos
                if ($split->isFullyPaid()) {
                    $split->update([
                        'status' => 'completed',
                        'is_paid' => true,
                        'paid_at' => now()
                    ]);
                }
            });
        }
    }

    /**
     * Calcula o saldo líquido entre dois usuários
     */
    private static function calculateNetBalance($userId1, $userId2)
    {
        // Quanto userId2 deve para userId1 (splits onde userId1 pagou)
        $owedToUser1 = SplitParticipant::join('split_table', 'split_participants.split_id', '=', 'split_table.id')
            ->where('split_table.payer_user_id', $userId1)
            ->where('split_participants.user_id', $userId2)
            ->where('split_participants.status', 'pending')
            ->where('split_participants.approval_status', 'approved')
            ->sum('split_participants.amount_owed');

        // Quanto userId1 deve para userId2 (splits onde userId2 pagou)
        $owedToUser2 = SplitParticipant::join('split_table', 'split_participants.split_id', '=', 'split_table.id')
            ->where('split_table.payer_user_id', $userId2)
            ->where('split_participants.user_id', $userId1)
            ->where('split_participants.status', 'pending')
            ->where('split_participants.approval_status', 'approved')
            ->sum('split_participants.amount_owed');

        // Saldo líquido (positivo = userId2 deve para userId1, negativo = userId1 deve para userId2)
        return $owedToUser1 - $owedToUser2;
    }
}
