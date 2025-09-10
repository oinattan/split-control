<?php

namespace App\Http\Controllers;

use App\Models\SplitTable;
use App\Models\SplitParticipant;
use App\Models\User;
use App\Models\UserBalance;
use App\Services\CompensationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class SplitController extends Controller
{
    public function index()
    {
        try {
            $currentUser = Auth::user();
            $currentUserId = $currentUser->id;

            // Debug: verificar se temos dados
            $splitCount = SplitTable::count();
            Log::info("Total splits: " . $splitCount);

            // Buscar splits simples primeiro
            $splits = SplitTable::with(['creator', 'participants.user', 'payer'])
                ->orderBy('created_at', 'desc')
                ->get();

            Log::info("Found splits: " . $splits->count());

            // Se não há splits, retornar array vazio
            if ($splits->isEmpty()) {
                return Inertia::render('Splits/Index', [
                    'splits' => [],
                    'currentUser' => [
                        'id' => $currentUser->id,
                        'name' => $currentUser->name,
                    ]
                ]);
            }

            // Processar dados dos splits
            $splitsData = $splits->map(function ($split) use ($currentUserId) {
                $userParticipant = $split->participants->where('user_id', $currentUserId)->first();

                return [
                    'id' => $split->id,
                    'description' => $split->description,
                    'total_amount' => $split->total_amount,
                    'amount_per_person' => $split->amount_per_person ?? 0,
                    'status' => $split->status,
                    'is_paid' => $split->is_paid,
                    'paid_at' => $split->paid_at,
                    'created_at' => $split->created_at,
                    'payer_user_id' => $split->payer_user_id,
                    'creator' => [
                        'id' => $split->creator ? $split->creator->id : null,
                        'name' => $split->creator ? $split->creator->name : 'N/A',
                    ],
                    'participants' => $split->participants->map(function ($participant) {
                        return [
                            'id' => $participant->id,
                            'user_id' => $participant->user ? $participant->user->id : null,
                            'user' => $participant->user ? [
                                'id' => $participant->user->id,
                                'name' => $participant->user->name,
                            ] : null,
                            'amount_owed' => $participant->amount_owed,
                            'status' => $participant->status,
                            'approval_status' => $participant->approval_status,
                            'paid_at' => $participant->paid_at,
                            'approved_at' => $participant->approved_at,
                        ];
                    })->values()->toArray(),
                    'can_edit' => $split->created_by === $currentUserId,
                    'can_delete' => $split->payer_user_id === $currentUserId,
                    'can_mark_paid' => $split->payer_user_id === $currentUserId,
                    'can_approve' => $userParticipant && $userParticipant->approval_status === 'pending',
                    'user_participant' => $userParticipant ? [
                        'id' => $userParticipant->id,
                        'amount_owed' => $userParticipant->amount_owed,
                        'status' => $userParticipant->status,
                        'approval_status' => $userParticipant->approval_status,
                    ] : null,
                ];
            });

            // Log sample payload para facilitar debug no frontend
            try {
                Log::info('Splits payload sample: ' . json_encode($splitsData->take(3)));
            } catch (\Exception $e) {
                Log::info('Erro ao serializar splitsData para log: ' . $e->getMessage());
            }

            return Inertia::render('Splits/Index', [
                'splits' => $splitsData,
                'currentUser' => [
                    'id' => $currentUser->id,
                    'name' => $currentUser->name,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erro no SplitController index: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());

            return Inertia::render('Splits/Index', [
                'splits' => [],
                'currentUser' => [
                    'id' => Auth::id(),
                    'name' => Auth::user()->name,
                ],
                'error' => 'Erro ao carregar splits: ' . $e->getMessage()
            ]);
        }
    }

    public function create()
    {
        // Usuários para participantes (excluindo o usuário atual)
        $participantUsers = User::where('id', '!=', Auth::id())->get(['id', 'name', 'email']);

        // Todos os usuários para o campo "Quem Pagou" (incluindo o usuário atual)
        $allUsers = User::get(['id', 'name', 'email']);

        return Inertia::render('Splits/Create', [
            'users' => $participantUsers,
            'allUsers' => $allUsers
        ]);
    }

    public function store(Request $request) // Ou continue usando Request e $request->validate()
    {
        try {
            // Log raw input and parsed request for debugging
            try {
                $raw = @file_get_contents('php://input');
            } catch (\Exception $e) {
                $raw = null;
            }
            Log::info('Split store RAW input: ' . ($raw ?? 'null'));
            Log::info('Split store payload: ' . json_encode($request->all()));

            // Debug: headers, session and explicit participants value
            try {
                $headers = $request->headers->all();
                Log::info('Split store headers: ' . json_encode($headers));
            } catch (\Exception $e) {
                Log::warning('Could not log request headers: ' . $e->getMessage());
            }

            try {
                $sessionId = $request->session() ? $request->session()->getId() : null;
                Log::info('Split store session id: ' . ($sessionId ?? 'null'));
            } catch (\Exception $e) {
                Log::warning('Could not get session id: ' . $e->getMessage());
            }

            try {
                Log::info('Split store explicit participants field: ' . json_encode($request->input('participants')));
            } catch (\Exception $e) {
                Log::warning('Could not log participants input: ' . $e->getMessage());
            }

            // Validate participants payload shape early
            if (!is_array($request->participants)) {
                Log::warning('Participants payload is not an array', ['participants' => $request->participants]);
            } else {
                Log::info('Participants payload count: ' . count($request->participants));
                foreach ($request->participants as $idx => $p) {
                    try {
                        Log::info('Participant payload [' . $idx . ']: ' . json_encode($p));
                    } catch (\Exception $e) {
                        Log::warning('Unable to json_encode participant payload', ['idx' => $idx]);
                    }
                }
            }

            // Enable query log to inspect SQL executed during this request (debug only)
            try {
                DB::enableQueryLog();
            } catch (\Exception $e) {
                Log::warning('Could not enable query log: ' . $e->getMessage());
            }

            // Normalizar participants para um array para evitar problemas quando não enviado
            $participantsInput = $request->input('participants');
            if (!is_array($participantsInput)) {
                Log::warning('Participants input normalized to empty array', ['participants' => $participantsInput]);
                $participantsInput = [];
            }

            // Validação extra no backend: A soma dos valores personalizados deve bater com o total.
            if ($request->input('split_type') === 'custom') {
                $participants_total = collect($participantsInput)->sum('amount_owed');
                // Usamos uma pequena tolerância para comparações de float
                if (abs($participants_total - $request->input('total_amount')) > 0.01) {
                    return back()
                        ->withInput()
                        ->withErrors(['total_amount' => 'A soma dos valores dos participantes não corresponde ao valor total da despesa.']);
                }
            }

            $createdSplit = null;

            DB::transaction(function () use ($request, &$createdSplit, $participantsInput) {
                // Log participants input snapshot for debugging
                try {
                    Log::info('ParticipantsInput before insert loop: ' . json_encode($participantsInput));
                } catch (\Exception $e) {
                    Log::warning('Could not json_encode participantsInput: ' . $e->getMessage());
                }
                // Criar o split
                $split = SplitTable::create([
                    'description' => $request->description,
                    'total_amount' => $request->total_amount,
                    'split_type' => $request->input('split_type'), // Salvando o tipo de split
                    'amount_per_person' => $request->input('split_type') === 'equal' && count($participantsInput) > 0
                        ? ($request->input('total_amount') / count($participantsInput))
                        : null, // Deixa nulo para splits customizados ou quando não há participantes
                    'expense_date' => $request->expense_date,
                    'status' => 'pending',
                    'created_by' => Auth::id(),
                    'payer_user_id' => $request->payer_user_id,
                ]);

                $snapshot = [];

                // Adicionar participantes
                foreach ($participantsInput as $participant) {
                    $userId = isset($participant['user_id']) ? $participant['user_id'] : null;
                    $amount = isset($participant['amount_owed']) ? $participant['amount_owed'] : null;
                    Log::info('Creating participant for user: ' . json_encode($userId) . ' amount: ' . json_encode($amount));

                    try {
                        $created = SplitParticipant::create([
                            'split_id' => $split->id,
                            'user_id' => $userId,
                            'amount_owed' => $amount,
                            'status' => $userId == $request->payer_user_id ? 'paid' : 'pending',
                            'approval_status' => $userId == Auth::id() ? 'approved' : 'pending',
                            'approved_at' => $userId == Auth::id() ? now() : null,
                            'paid_at' => $userId == $request->payer_user_id ? now() : null,
                        ]);

                        Log::info('Participant created id: ' . ($created->id ?? 'null'));

                        // Log last queries after creation (debug)
                        try {
                            $queries = DB::getQueryLog();
                            Log::info('DB queries during participant create: ' . json_encode($queries));
                        } catch (\Exception $e) {
                            Log::warning('Could not dump DB query log: ' . $e->getMessage());
                        }

                        $snapshot[] = [
                            'id' => $created->id,
                            'user_id' => $created->user_id,
                            'amount_owed' => $created->amount_owed,
                            'status' => $created->status,
                        ];
                    } catch (\Exception $e) {
                        Log::error('Erro ao criar participant: ' . $e->getMessage(), ['participant' => $participant]);
                        // Re-throw to rollback transaction
                        throw $e;
                    }
                }

                // Atualizar snapshot no split criado (apenas se a coluna existir)
                if (Schema::hasColumn('split_table', 'participants_snapshot')) {
                    $split->participants_snapshot = $snapshot;
                    $split->participants_count = count($snapshot);
                    $split->save();
                } else {
                    Log::warning('participants_snapshot column does not exist in split_table, skipping snapshot update.');
                }

                // Expor created split para logging fora da transação
                $createdSplit = $split;
            });

            // Log detalhado do split criado (inclui participantes e user relation)
            try {
                if ($createdSplit) {
                    $createdSplit->load(['participants.user', 'creator']);
                    Log::info('Created split detail: ' . json_encode($createdSplit->toArray()));

                    // Log participantes persistidos
                    $persisted = $createdSplit->participants->map(function ($p) {
                        return [
                            'id' => $p->id,
                            'user_id' => $p->user_id,
                            'amount_owed' => $p->amount_owed,
                            'status' => $p->status,
                            'user' => $p->user ? ['id' => $p->user->id, 'name' => $p->user->name] : null,
                        ];
                    })->toArray();

                    Log::info('Persisted participants: ' . json_encode($persisted));
                } else {
                    Log::warning('Created split is null after transaction');
                }
            } catch (\Exception $e) {
                Log::error('Erro ao logar split criado: ' . $e->getMessage());
            }

            // Dump query log (debug only) e depois limpar
            try {
                $queries = DB::getQueryLog();
                Log::info('DB Query Log (last request): ' . json_encode($queries));
                // Desabilitar/limpar query log
                DB::flushQueryLog();
            } catch (\Exception $e) {
                Log::warning('Could not dump query log: ' . $e->getMessage());
            }

            return redirect()->route('splits.index')
                ->with('success', 'Split criado com sucesso! Aguardando aprovação dos participantes.');

        } catch (\Exception $e) {
            Log::error('Erro ao criar split: ' . $e->getMessage());
            return back()
                ->withInput()
                ->withErrors(['error' => 'Ocorreu um erro inesperado ao criar o split. Por favor, tente novamente.']);
        }
    }

    public function show(SplitTable $split)
    {
    $split->load(['creator', 'participants.user', 'payer']);

        return Inertia::render('Splits/Show', [
            'split' => $split
        ]);
    }

    public function edit(SplitTable $split)
    {
        // Verificar se o usuário tem permissão para editar
        if ($split->created_by !== Auth::id()) {
            return redirect()->route('splits.index')
                ->with('error', 'Você só pode editar splits que você criou.');
        }

        $users = User::where('id', '!=', Auth::id())->get(['id', 'name', 'email']);
        $split->load(['participants.user']);

        return Inertia::render('Splits/Edit', [
            'split' => $split,
            'users' => $users
        ]);
    }

    public function update(Request $request, SplitTable $split)
    {
        // Verificar se o usuário tem permissão para editar
        if ($split->created_by !== Auth::id()) {
            return redirect()->route('splits.index')
                ->with('error', 'Você só pode editar splits que você criou.');
        }

        $request->validate([
            'description' => 'required|string|max:255',
            'total_amount' => 'required|numeric|min:0.01',
            'participants' => 'required|array|min:1',
            'participants.*.user_id' => 'required|exists:users,id',
            'participants.*.amount_owed' => 'required|numeric|min:0'
        ]);

        try {
            DB::transaction(function () use ($request, $split) {
                $split->update([
                    'description' => $request->description,
                    'total_amount' => $request->total_amount,
                    'amount_per_person' => $request->total_amount / count($request->participants)
                ]);

                // Sincronizar participantes: atualizar existentes, criar novos e remover os que saíram
                $incoming = collect($request->participants)->keyBy('user_id');

                // Atualizar/criar
                foreach ($incoming as $userId => $p) {
                    $participant = SplitParticipant::where('split_id', $split->id)
                        ->where('user_id', $userId)
                        ->first();

                    if ($participant) {
                        $participant->update([
                            'amount_owed' => $p['amount_owed'],
                        ]);
                    } else {
                        SplitParticipant::create([
                            'split_id' => $split->id,
                            'user_id' => $userId,
                            'amount_owed' => $p['amount_owed'],
                            'status' => $userId == $split->payer_user_id ? 'paid' : 'pending',
                            'approval_status' => $userId == Auth::id() ? 'approved' : 'pending',
                        ]);
                    }
                }

                // Remover participantes que não estão mais presentes
                $existingUserIds = $split->participants()->pluck('user_id')->toArray();
                $incomingUserIds = $incoming->keys()->map(function ($k) {
                    return (int) $k;
                })->toArray();
                $toRemove = array_diff($existingUserIds, $incomingUserIds);
                if (!empty($toRemove)) {
                    SplitParticipant::where('split_id', $split->id)
                        ->whereIn('user_id', $toRemove)
                        ->delete();
                }
            });

            return redirect()->route('splits.index')
                ->with('success', 'Split atualizado com sucesso!');

        } catch (\Exception $e) {
            Log::error('Erro ao atualizar split: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Erro ao atualizar split. Tente novamente.']);
        }
    }

    public function destroy(SplitTable $split)
    {
        // Verificar se o usuário tem permissão para excluir
        if ($split->payer_user_id !== Auth::id()) {
            return redirect()->route('splits.index')
                ->with('error', 'Você só pode excluir splits que você pagou.');
        }

        $split->delete();

        return redirect()->route('splits.index')
            ->with('success', 'Split excluído com sucesso!');
    }

    public function markAsPaid(SplitTable $split, SplitParticipant $participant)
    {
        // Verificar se o usuário tem permissão (apenas o pagador pode marcar como pago)
        if ($split->payer_user_id !== Auth::id()) {
            return redirect()->back()
                ->with('error', 'Apenas quem pagou pode marcar pagamentos.');
        }

        // Verificar se o participante já aprovou o split
        if ($participant->approval_status !== 'approved') {
            return redirect()->back()
                ->with('error', 'O participante deve aprovar o split antes de ser marcado como pago.');
        }

        DB::transaction(function () use ($participant, $split) {
            // Marcar como pago
            $participant->update([
                'status' => 'paid',
                'paid_at' => now()
            ]);

            // Atualizar saldos entre usuários
            $this->updateUserBalances($split, $participant);

            // Verificar se todos os participantes pagaram
            if ($split->isFullyPaid()) {
                $split->update([
                    'status' => 'completed',
                    'is_paid' => true,
                    'paid_at' => now()
                ]);
            }
        });

        // Executar compensação automática após marcar como pago
        CompensationService::checkAndCompleteCompensatedSplits();

        return redirect()->back()
            ->with('success', 'Pagamento marcado como realizado!');
    }

    public function markAsPending(SplitTable $split, SplitParticipant $participant)
    {
        // Verificar se o usuário tem permissão (deve ser o pagador)
        if ($split->payer_user_id !== Auth::id()) {
            return redirect()->back()
                ->with('error', 'Apenas quem pagou pode reverter o status do pagamento.');
        }

        DB::transaction(function () use ($participant, $split) {
            // Reverter o saldo (subtrair o valor que foi anteriormente adicionado)
            $this->revertUserBalances($split, $participant);

            // Marcar como pendente
            $participant->update([
                'status' => 'pending',
                'paid_at' => null
            ]);

            // Atualizar status do split
            $split->update([
                'status' => 'active',
                'is_paid' => false,
                'paid_at' => null
            ]);
        });

        return redirect()->back()
            ->with('success', 'Pagamento marcado como pendente!');
    }

    public function approve(SplitParticipant $participant)
    {
        // Verificar se o usuário pode aprovar (deve ser o próprio participante)
        if ($participant->user_id !== Auth::id()) {
            return redirect()->back()
                ->with('error', 'Você só pode aprovar seus próprios splits.');
        }

        DB::transaction(function () use ($participant) {
            $participant->update([
                'approval_status' => 'approved',
                'approved_at' => now()
            ]);

            // Verificar se todos aprovaram e atualizar status do split
            $split = $participant->split;
            if ($split->isFullyApproved()) {
                $split->update(['status' => 'active']);
            }
        });

        return redirect()->back()
            ->with('success', 'Split aprovado com sucesso!');
    }

    public function reject(SplitParticipant $participant)
    {
        // Verificar se o usuário pode rejeitar (deve ser o próprio participante)
        if ($participant->user_id !== Auth::id()) {
            return redirect()->back()
                ->with('error', 'Você só pode rejeitar seus próprios splits.');
        }

        $participant->update([
            'approval_status' => 'rejected',
            'approved_at' => null
        ]);

        return redirect()->back()
            ->with('success', 'Split rejeitado.');
    }

    private function updateUserBalances(SplitTable $split, SplitParticipant $participant)
    {
        $payerId = $split->payer_user_id;
        $debtorId = $participant->user_id;
        $amount = $participant->amount_owed;

        // Criar ou atualizar o saldo entre os usuários.
        // Para evitar SQL inválido em INSERT (ex: "balance + x" como valor na cláusula VALUES em SQLite),
        // primeiro tentamos incrementar quando existe, caso contrário criamos com o balance inicial igual ao amount.
        $balance = UserBalance::where('creditor_user_id', $payerId)
            ->where('debtor_user_id', $debtorId)
            ->first();

        if ($balance) {
            // increment já faz o update seguro; forçar cast para float
            $balance->increment('balance', (float) $amount);
            $balance->touch();
        } else {
            UserBalance::create([
                'creditor_user_id' => $payerId,
                'debtor_user_id' => $debtorId,
                'balance' => $amount,
            ]);
        }

        // Para splits ativos, verificar compensação automática
        if ($split->status === 'active') {
            CompensationService::checkAndCompleteCompensatedSplits();
        }
    }

    private function revertUserBalances(SplitTable $split, SplitParticipant $participant)
    {
        $payerId = $split->payer_user_id;
        $debtorId = $participant->user_id;
        $amount = $participant->amount_owed;

        // Reverter o saldo entre os usuários
        $balance = UserBalance::where('creditor_user_id', $payerId)
            ->where('debtor_user_id', $debtorId)
            ->first();

        if ($balance) {
            $newBalance = $balance->balance - $amount;
            if ($newBalance <= 0) {
                $balance->delete();
            } else {
                $balance->update(['balance' => $newBalance]);
            }
        }
    }

    public function pendingApprovals()
    {
        // Incluir payer e participantes do split para preencher a tela de aprovações
        $pendingSplits = SplitParticipant::with(['split.creator', 'split.payer', 'split.participants.user', 'user'])
            ->where('user_id', Auth::id())
            ->where('approval_status', 'pending')
            ->get()
            ->map(function ($participant) {
                $split = $participant->split;

                // Preparar array de participantes do split com user.id/name e amount
                $participantsArr = [];
                if ($split && $split->participants) {
                    $participantsArr = $split->participants->map(function ($p) {
                        return [
                            'id' => $p->id,
                            'user' => [
                                'id' => $p->user ? $p->user->id : null,
                                'name' => $p->user ? $p->user->name : 'Usuário'
                            ],
                            'amount_owed' => $p->amount_owed,
                        ];
                    })->toArray();
                }

                return [
                    'id' => $participant->id,
                    'split' => [
                        'id' => $split ? $split->id : null,
                        'description' => $split ? $split->description : null,
                        'total_amount' => $split ? $split->total_amount : null,
                        'expense_date' => $split ? $split->expense_date : null,
                        'payer' => $split && $split->payer ? [
                            'id' => $split->payer->id,
                            'name' => $split->payer->name,
                        ] : null,
                        'participants' => $participantsArr,
                        'created_at' => $split ? $split->created_at : null,
                        'creator' => [
                            'name' => $split && $split->creator ? $split->creator->name : null,
                        ],
                    ],
                    'amount_owed' => $participant->amount_owed,
                ];
            });

        return Inertia::render('Splits/PendingApprovals', [
            'pendingSplits' => $pendingSplits
        ]);
    }
}
