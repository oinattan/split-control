import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SummaryCard from '@/Components/SummaryCard';
import UserDebtCard from '@/Components/UserDebtCard';
import { Head, Link } from '@inertiajs/react';

export default function Dashboard({ totalOwed, totalOwing, userDebts, stats, pendingApprovals }) {
    // Usar dados reais do backend
    const data = {
        totalOwed: totalOwed || 0,
        totalOwing: totalOwing || 0,
        userDebts: userDebts || []
    };

    const dashboardStats = stats || {
        splitsAsPayer: 0,
        splitsAsParticipant: 0,
        totalSplits: 0,
        pendingSplits: 0,
        totalPaid: 0,
        totalInvolved: 0,
        recentSplits: 0
    };

    const netBalance = data.totalOwed - data.totalOwing;

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
                    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
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
                                        <p className="text-2xl font-bold text-gray-900">{pendingApprovals || 0}</p>
                                    </div>
                                </div>
                                {pendingApprovals > 0 && (
                                    <Link
                                        href={route('splits.pending-approvals')}
                                        className="text-xs bg-orange-500 text-white px-2 py-1 rounded-full hover:bg-orange-600"
                                    >
                                        Ver
                                    </Link>
                                )}
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
                                        R$ {dashboardStats.totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Link
                                    href={route('splits.create')}
                                    className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
                                >
                                    <span className="text-3xl mr-4">➕</span>
                                    <div>
                                        <h4 className="font-medium text-gray-900">Novo Split</h4>
                                        <p className="text-sm text-gray-600">Criar um novo gasto compartilhado</p>
                                    </div>
                                </Link>

                                <Link
                                    href={route('splits.index')}
                                    className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
                                >
                                    <span className="text-3xl mr-4">📋</span>
                                    <div>
                                        <h4 className="font-medium text-gray-900">Ver Todos</h4>
                                        <p className="text-sm text-gray-600">Gerenciar splits existentes</p>
                                    </div>
                                </Link>

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
                                        <UserDebtCard
                                            key={debt.user.id}
                                            user={debt.user}
                                            amountOwed={debt.amountOwed}
                                            amountOwing={debt.amountOwing}
                                            balance={debt.balance}
                                            rawOwed={debt.rawOwed}
                                            rawOwing={debt.rawOwing}
                                        />
                                    ))}
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
                                    {dashboardStats.totalSplits === 0 && (
                                        <Link
                                            href={route('splits.create')}
                                            className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                                        >
                                            ➕ Adicionar Primeiro Gasto
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
