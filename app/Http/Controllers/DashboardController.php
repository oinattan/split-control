<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
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
        try {
            $userId = Auth::id();
            
            if (!$userId) {
                return redirect()->route('login');
            }
            
            // Executar verificação de compensação automática antes de calcular os dados
            try {
                CompensationService::checkAndCompleteCompensatedSplits();
            } catch (\Exception $e) {
                // Log do erro mas não interrompe o dashboard
                Log::warning('Erro ao executar compensação automática: ' . $e->getMessage());
            }
            
            // Temporariamente usar o método antigo enquanto corrigimos os saldos
            // Calcular total que outras pessoas devem para o usuário logado
            $totalOwed = SplitParticipant::join('split_table', 'split_participants.split_id', '=', 'split_table.id')
                ->where('split_table.payer_user_id', $userId)
                ->where('split_participants.user_id', '!=', $userId)
                ->where('split_participants.status', 'pending')
                ->where('split_participants.approval_status', 'approved')
                ->sum('split_participants.amount_owed') ?? 0;

        // Calcular total que o usuário deve para outras pessoas
        $totalOwing = SplitParticipant::join('split_table', 'split_participants.split_id', '=', 'split_table.id')
            ->where('split_participants.user_id', $userId)
            ->where('split_table.payer_user_id', '!=', $userId)
            ->where('split_participants.status', 'pending')
            ->where('split_participants.approval_status', 'approved')
            ->sum('split_participants.amount_owed') ?? 0;

        // Buscar resumo detalhado por usuário (incluindo saldos)
        $userDebts = $this->getUserDebtsDetails($userId);

        // Buscar splits pendentes de aprovação
        $pendingApprovals = SplitParticipant::with(['split.payer'])
            ->where('user_id', $userId)
            ->where('approval_status', 'pending')
            ->count() ?? 0;

        // Estatísticas adicionais para o dashboard
        $stats = $this->getDashboardStats($userId);

        return Inertia::render('Dashboard', [
            'totalOwed' => (float) $totalOwed,
            'totalOwing' => (float) $totalOwing,
            'userDebts' => $userDebts ?? [],
            'pendingApprovals' => $pendingApprovals,
            'stats' => $stats ?? []
        ]);
        
        } catch (\Exception $e) {
            // Log do erro completo
            Log::error('Erro no dashboard: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // Retornar dashboard com dados vazios em caso de erro
            return Inertia::render('Dashboard', [
                'totalOwed' => 0,
                'totalOwing' => 0,
                'userDebts' => [],
                'pendingApprovals' => 0,
                'stats' => [
                    'splitsAsPayer' => 0,
                    'splitsAsParticipant' => 0,
                    'totalSplits' => 0,
                    'pendingSplits' => 0,
                    'totalPaid' => 0,
                    'totalInvolved' => 0,
                    'recentSplits' => 0
                ],
                'error' => 'Ocorreu um erro ao carregar os dados. Tente novamente.'
            ]);
        }
    }

    private function getUserDebtsDetails($userId)
    {
        try {
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
        
        } catch (\Exception $e) {
            Log::error('Erro ao buscar detalhes de débitos: ' . $e->getMessage());
            return [];
        }
    }

    private function getDashboardStats($userId)
    {
        try {
            // Splits onde o usuário é o pagador
            $splitsAsPayer = SplitTable::where('payer_user_id', $userId)->count() ?? 0;

        // Splits onde o usuário participa
        $splitsAsParticipant = SplitParticipant::where('user_id', $userId)->count() ?? 0;

        // Total de splits únicos (pode participar e pagar no mesmo split)
        $totalSplits = SplitTable::whereHas('participants', function($query) use ($userId) {
            $query->where('user_id', $userId);
        })->orWhere('payer_user_id', $userId)->distinct()->count() ?? 0;

        // Splits pendentes que envolvem o usuário
        $pendingSplits = SplitTable::whereHas('participants', function($query) use ($userId) {
            $query->where('user_id', $userId)->where('status', 'pending');
        })->orWhereHas('participants', function($query) use ($userId) {
            $query->where('status', 'pending');
        })->where('payer_user_id', $userId)->distinct()->count() ?? 0;

        // Total gasto pelo usuário (como pagador)
        $totalPaid = SplitTable::where('payer_user_id', $userId)->sum('total_amount') ?? 0;

        // Valor total em splits que o usuário participou
        $totalInvolved = SplitTable::whereHas('participants', function($query) use ($userId) {
            $query->where('user_id', $userId);
        })->sum('total_amount') ?? 0;

        // Splits recentes (últimos 7 dias)
        $recentSplits = SplitTable::whereHas('participants', function($query) use ($userId) {
            $query->where('user_id', $userId);
        })->orWhere('payer_user_id', $userId)
          ->where('expense_date', '>=', now()->subDays(7))
          ->distinct()
          ->count() ?? 0;

        return [
            'splitsAsPayer' => $splitsAsPayer,
            'splitsAsParticipant' => $splitsAsParticipant,
            'totalSplits' => $totalSplits,
            'pendingSplits' => $pendingSplits,
            'totalPaid' => (float) $totalPaid,
            'totalInvolved' => (float) $totalInvolved,
            'recentSplits' => $recentSplits,
        ];
        
        } catch (\Exception $e) {
            Log::error('Erro ao buscar estatísticas do dashboard: ' . $e->getMessage());
            return [
                'splitsAsPayer' => 0,
                'splitsAsParticipant' => 0,
                'totalSplits' => 0,
                'pendingSplits' => 0,
                'totalPaid' => 0,
                'totalInvolved' => 0,
                'recentSplits' => 0,
            ];
        }
    }
}
