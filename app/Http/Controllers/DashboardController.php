<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\SplitTable;
use App\Models\SplitParticipant;
use App\Models\User;
use App\Models\UserBalance;
use App\Services\CompensationService;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $userId = Auth::id();
        
        // Executar verificação de compensação automática antes de calcular os dados
        CompensationService::checkAndCompleteCompensatedSplits();
        
        // Temporariamente usar o método antigo enquanto corrigimos os saldos
        // Calcular total que outras pessoas devem para o usuário logado
        $totalOwed = SplitParticipant::join('split_table', 'split_participants.split_id', '=', 'split_table.id')
            ->where('split_table.payer_user_id', $userId)
            ->where('split_participants.user_id', '!=', $userId)
            ->where('split_participants.status', 'pending')
            ->where('split_participants.approval_status', 'approved')
            ->sum('split_participants.amount_owed');

        // Calcular total que o usuário deve para outras pessoas
        $totalOwing = SplitParticipant::join('split_table', 'split_participants.split_id', '=', 'split_table.id')
            ->where('split_participants.user_id', $userId)
            ->where('split_table.payer_user_id', '!=', $userId)
            ->where('split_participants.status', 'pending')
            ->where('split_participants.approval_status', 'approved')
            ->sum('split_participants.amount_owed');

        // Buscar resumo detalhado por usuário (incluindo saldos)
        $userDebts = $this->getUserDebtsDetails($userId);

        // Buscar splits pendentes de aprovação
        $pendingApprovals = SplitParticipant::with(['split.payer'])
            ->where('user_id', $userId)
            ->where('approval_status', 'pending')
            ->count();

        // Estatísticas adicionais para o dashboard
        $stats = $this->getDashboardStats($userId);

        return Inertia::render('Dashboard', [
            'totalOwed' => (float) $totalOwed,
            'totalOwing' => (float) $totalOwing,
            'userDebts' => $userDebts,
            'pendingApprovals' => $pendingApprovals,
            'stats' => $stats
        ]);
    }

    private function getUserDebtsDetails($userId)
    {
        // Buscar todos os splits pendentes onde o usuário está envolvido
        $allUsers = collect();

        // 1. Splits onde o usuário pagou (outros devem para ele)
        $owedByOthers = SplitParticipant::join('split_table', 'split_participants.split_id', '=', 'split_table.id')
            ->join('users', 'split_participants.user_id', '=', 'users.id')
            ->select(
                'users.id',
                'users.name',
                'users.email',
                DB::raw('SUM(split_participants.amount_owed) as total_owed')
            )
            ->where('split_table.payer_user_id', $userId)
            ->where('split_participants.user_id', '!=', $userId)
            ->where('split_participants.status', 'pending')
            ->where('split_participants.approval_status', 'approved')
            ->groupBy('users.id', 'users.name', 'users.email')
            ->get();

        // 2. Splits onde outros pagaram (usuário deve para eles)
        $owingToOthers = SplitParticipant::join('split_table', 'split_participants.split_id', '=', 'split_table.id')
            ->join('users', 'split_table.payer_user_id', '=', 'users.id')
            ->select(
                'users.id',
                'users.name',
                'users.email',
                DB::raw('SUM(split_participants.amount_owed) as total_owing')
            )
            ->where('split_participants.user_id', $userId)
            ->where('split_table.payer_user_id', '!=', $userId)
            ->where('split_participants.status', 'pending')
            ->where('split_participants.approval_status', 'approved')
            ->groupBy('users.id', 'users.name', 'users.email')
            ->get();

        // 3. Consolidar todos os usuários únicos
        $userIds = $owedByOthers->pluck('id')->merge($owingToOthers->pluck('id'))->unique();
        
        foreach ($userIds as $otherUserId) {
            // Buscar dados do usuário
            $owedUser = $owedByOthers->firstWhere('id', $otherUserId);
            $owingUser = $owingToOthers->firstWhere('id', $otherUserId);
            
            // Calcular valores
            $amountOwed = $owedUser ? (float) $owedUser->total_owed : 0; // Quanto te devem
            $amountOwing = $owingUser ? (float) $owingUser->total_owing : 0; // Quanto você deve
            
            // COMPENSAÇÃO AUTOMÁTICA: Calcular saldo líquido
            $netBalance = $amountOwed - $amountOwing;
            
            // Determinar valores finais após compensação
            $finalOwed = $netBalance > 0 ? $netBalance : 0;
            $finalOwing = $netBalance < 0 ? abs($netBalance) : 0;
            
            // Só adicionar se houver saldo diferente de zero
            if ($netBalance != 0) {
                // Pegar dados do usuário (do primeiro registro disponível)
                $userData = $owedUser ?: $owingUser;
                
                $allUsers->put($otherUserId, [
                    'user' => [
                        'id' => $userData->id,
                        'name' => $userData->name,
                        'email' => $userData->email
                    ],
                    'balance' => $netBalance, // Saldo líquido
                    'amountOwed' => $finalOwed, // Valor final após compensação
                    'amountOwing' => $finalOwing, // Valor final após compensação
                    'rawOwed' => $amountOwed, // Valor original (para detalhamento)
                    'rawOwing' => $amountOwing, // Valor original (para detalhamento)
                    'pendingOwed' => 0,
                    'pendingOwing' => 0
                ]);
            }
        }

        return $allUsers->values()->toArray();
    }

    private function getDashboardStats($userId)
    {
        // Splits onde o usuário é o pagador
        $splitsAsPayer = SplitTable::where('payer_user_id', $userId)->count();

        // Splits onde o usuário participa
        $splitsAsParticipant = SplitParticipant::where('user_id', $userId)->count();

        // Total de splits únicos (pode participar e pagar no mesmo split)
        $totalSplits = SplitTable::whereHas('participants', function($query) use ($userId) {
            $query->where('user_id', $userId);
        })->orWhere('payer_user_id', $userId)->distinct()->count();

        // Splits pendentes que envolvem o usuário
        $pendingSplits = SplitTable::whereHas('participants', function($query) use ($userId) {
            $query->where('user_id', $userId)->where('status', 'pending');
        })->orWhereHas('participants', function($query) use ($userId) {
            $query->where('status', 'pending');
        })->where('payer_user_id', $userId)->distinct()->count();

        // Total gasto pelo usuário (como pagador)
        $totalPaid = SplitTable::where('payer_user_id', $userId)->sum('total_amount');

        // Valor total em splits que o usuário participou
        $totalInvolved = SplitTable::whereHas('participants', function($query) use ($userId) {
            $query->where('user_id', $userId);
        })->sum('total_amount');

        // Splits recentes (últimos 7 dias)
        $recentSplits = SplitTable::whereHas('participants', function($query) use ($userId) {
            $query->where('user_id', $userId);
        })->orWhere('payer_user_id', $userId)
          ->where('expense_date', '>=', now()->subDays(7))
          ->distinct()
          ->count();

        return [
            'splitsAsPayer' => $splitsAsPayer,
            'splitsAsParticipant' => $splitsAsParticipant,
            'totalSplits' => $totalSplits,
            'pendingSplits' => $pendingSplits,
            'totalPaid' => (float) $totalPaid,
            'totalInvolved' => (float) $totalInvolved,
            'recentSplits' => $recentSplits,
        ];
    }
}
