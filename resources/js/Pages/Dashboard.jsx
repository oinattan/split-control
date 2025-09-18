import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SummaryCard from '@/Components/SummaryCard';
import UserDebtCard from '@/Components/UserDebtCard';
import { Head, Link } from '@inertiajs/react';

export default function Dashboard({ totalOwed, totalOwing, userDebts, stats, pendingApprovals, error }) {
    // Usar dados reais do backend com validação e fallbacks seguros
    const data = {
        totalOwed: (typeof totalOwed === 'number' && !isNaN(totalOwed)) ? totalOwed : 0,
        totalOwing: (typeof totalOwing === 'number' && !isNaN(totalOwing)) ? totalOwing : 0,
        userDebts: Array.isArray(userDebts) ? userDebts : []
    };

    const dashboardStats = {
        splitsAsPayer: (stats?.splitsAsPayer && !isNaN(stats.splitsAsPayer)) ? stats.splitsAsPayer : 0,
        splitsAsParticipant: (stats?.splitsAsParticipant && !isNaN(stats.splitsAsParticipant)) ? stats.splitsAsParticipant : 0,
        totalSplits: (stats?.totalSplits && !isNaN(stats.totalSplits)) ? stats.totalSplits : 0,
        pendingSplits: (stats?.pendingSplits && !isNaN(stats.pendingSplits)) ? stats.pendingSplits : 0,
        totalPaid: (stats?.totalPaid && !isNaN(stats.totalPaid)) ? stats.totalPaid : 0,
        totalInvolved: (stats?.totalInvolved && !isNaN(stats.totalInvolved)) ? stats.totalInvolved : 0,
        recentSplits: (stats?.recentSplits && !isNaN(stats.recentSplits)) ? stats.recentSplits : 0
    };

    const netBalance = data.totalOwed - data.totalOwing;
    const safePendingApprovals = (typeof pendingApprovals === 'number' && !isNaN(pendingApprovals)) ? pendingApprovals : 0;

    // Função para criar links seguros que não quebram se a rota não existir
    const createSafeLink = (routeName, content, className) => {
        try {
            return (
                <Link href={route(routeName)} className={className}>
                    {content}
                </Link>
            );
        } catch (error) {
            // Se a rota não existir, retornar um botão desabilitado
            return (
                <div className={`${className} opacity-50 cursor-not-allowed`}>
                    {content}
                </div>
            );
        }
    };

    // Função segura para formatação de moeda
    const formatCurrency = (value) => {
        const safeValue = (typeof value === 'number' && !isNaN(value)) ? value : 0;
        return safeValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Dashboard - Controle de Gastos
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Mostrar erro se houver */}
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <span className="text-red-500 text-xl">⚠️</span>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">
                                        Erro ao carregar dados
                                    </h3>
                                    <div className="mt-2 text-sm text-red-700">
                                        {error}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Cards de Resumo Principal */}
                    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                        <SummaryCard
                            title="Saldo Total"
                            amount={netBalance}
                            variant={netBalance > 0 ? 'success' : netBalance < 0 ? 'danger' : 'default'}
                        >
                            <div className="text-xs text-gray-500">
                                {netBalance > 0 ? '🎉 Você está no positivo!' : 
                                 netBalance < 0 ? '⚠️ Você deve dinheiro' : 
                                 '✅ Você está em dia'}
                            </div>
                        </SummaryCard>

                        <SummaryCard
                            title="Te devem"
                            amount={data.totalOwed}
                            variant="success"
                        >
                            <div className="text-xs text-gray-500">
                                💰 A receber
                            </div>
                        </SummaryCard>

                        <SummaryCard
                            title="Você deve"
                            amount={data.totalOwing}
                            variant="danger"
                        >
                            <div className="text-xs text-gray-500">
                                💳 A pagar
                            </div>
                        </SummaryCard>
                    </div>

                    {/* Estatísticas Detalhadas */}
                    <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                        <div className="bg-white p-6 rounded-lg shadow-sm border">
                            <div className="flex items-center">
                                <div className="p-2 bg-blue-100 rounded-md">
                                    <span className="text-2xl">📊</span>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Total de Splits</p>
                                    <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalSplits}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-sm border">
                            <div className="flex items-center">
                                <div className="p-2 bg-yellow-100 rounded-md">
                                    <span className="text-2xl">⏳</span>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Pendentes</p>
                                    <p className="text-2xl font-bold text-gray-900">{dashboardStats.pendingSplits}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-sm border">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="p-2 bg-orange-100 rounded-md">
                                        <span className="text-2xl">✋</span>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Aguardando Aprovação</p>
                                        <p className="text-2xl font-bold text-gray-900">{safePendingApprovals}</p>
                                    </div>
                                </div>
                                {safePendingApprovals > 0 && 
                                    createSafeLink('splits.pending-approvals', 'Ver', 'text-xs bg-orange-500 text-white px-2 py-1 rounded-full hover:bg-orange-600')
                                }
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-sm border">
                            <div className="flex items-center">
                                <div className="p-2 bg-green-100 rounded-md">
                                    <span className="text-2xl">💳</span>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Você pagou</p>
                                    <p className="text-lg font-bold text-gray-900">
                                        R$ {formatCurrency(dashboardStats.totalPaid)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-sm border">
                            <div className="flex items-center">
                                <div className="p-2 bg-purple-100 rounded-md">
                                    <span className="text-2xl">📅</span>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Esta semana</p>
                                    <p className="text-2xl font-bold text-gray-900">{dashboardStats.recentSplits}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Ações Rápidas */}
                    <div className="mb-8 bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Ações Rápidas</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {createSafeLink('splits.create', 
                                    <>
                                        <span className="text-3xl mr-4">➕</span>
                                        <div>
                                            <h4 className="font-medium text-gray-900">Novo Split</h4>
                                            <p className="text-sm text-gray-600">Criar um novo gasto compartilhado</p>
                                        </div>
                                    </>,
                                    'flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors'
                                )}

                                {createSafeLink('splits.index',
                                    <>
                                        <span className="text-3xl mr-4">📋</span>
                                        <div>
                                            <h4 className="font-medium text-gray-900">Ver Todos</h4>
                                            <p className="text-sm text-gray-600">Gerenciar splits existentes</p>
                                        </div>
                                    </>,
                                    'flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors'
                                )}

                                <div className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg opacity-50">
                                    <span className="text-3xl mr-4">📈</span>
                                    <div>
                                        <h4 className="font-medium text-gray-900">Relatórios</h4>
                                        <p className="text-sm text-gray-600">Em breve...</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Lista de Usuários e Débitos */}
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="border-b border-gray-200 bg-white px-6 py-4">
                            <h3 className="text-lg font-medium text-gray-900">
                                Resumo por Pessoa
                            </h3>
                            <p className="text-sm text-gray-600">
                                Saldos com compensação automática - dívidas mútuas são canceladas
                            </p>
                            <div className="mt-2 flex items-center space-x-6 text-xs text-gray-500">
                                <div className="flex items-center space-x-1">
                                    <span className="w-3 h-3 bg-green-100 rounded-full"></span>
                                    <span>💰 Verde = Te devem (após compensação)</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <span className="w-3 h-3 bg-red-100 rounded-full"></span>
                                    <span>💳 Vermelho = Você deve (após compensação)</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <span>💱</span>
                                    <span>Compensação automática ativa</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-6">
                            {data.userDebts.length > 0 ? (
                                <div className="space-y-4">
                                    {data.userDebts.map((debt) => (
                                        debt && debt.user && debt.user.id ? (
                                            <UserDebtCard
                                                key={debt.user.id}
                                                user={debt.user}
                                                amountOwed={debt.amountOwed}
                                                amountOwing={debt.amountOwing}
                                                balance={debt.balance}
                                                rawOwed={debt.rawOwed}
                                                rawOwing={debt.rawOwing}
                                            />
                                        ) : null
                                    )).filter(Boolean)}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="text-gray-400 text-6xl mb-4">📊</div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        {dashboardStats.totalSplits > 0 ? 'Tudo em dia!' : 'Nenhum gasto registrado'}
                                    </h3>
                                    <p className="text-gray-600 mb-6">
                                        {dashboardStats.totalSplits > 0 
                                            ? 'Não há pendências financeiras no momento'
                                            : 'Comece adicionando seus primeiros gastos compartilhados'
                                        }
                                    </p>
                                    {dashboardStats.totalSplits === 0 && 
                                        createSafeLink('splits.create',
                                            '➕ Adicionar Primeiro Gasto',
                                            'inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700'
                                        )
                                    }
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
