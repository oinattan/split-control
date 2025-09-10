import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

export default function SplitsIndex({ splits, users, auth }) {
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Debug (apenas esta linha)
    console.log('SplitsIndex props:', { splits, users, auth });

    // Filtros
    const filteredSplits = splits?.filter(split => {
        const matchesSearch = split.description?.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (filter === 'all') return matchesSearch;
        if (filter === 'paid_by_me') return matchesSearch && split.payer_user_id === auth?.user?.id;
        if (filter === 'i_participate') return matchesSearch && split.participants?.some(p => p.user_id === auth?.user?.id);
        if (filter === 'pending') return matchesSearch && split.participants?.some(p => p.status === 'pending');
        
        return matchesSearch;
    }) || [];

    const handleDeleteSplit = (splitId) => {
        if (confirm('Tem certeza que deseja excluir este split?')) {
            router.delete(route('splits.destroy', splitId));
        }
    };

    const handleMarkAsPaid = (splitId, participantId) => {
        router.patch(route('splits.mark-paid', { split: splitId, participant: participantId }));
    };

    const formatCurrency = (amount) => {
        return `R$ ${parseFloat(amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('pt-BR');
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Gerenciar Splits
                    </h2>
                    <Link
                        href={route('splits.create')}
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 focus:bg-indigo-700 active:bg-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150"
                    >
                        ➕ Novo Split
                    </Link>
                </div>
            }
        >
            <Head title="Gerenciar Splits" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Filtros e Busca */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
                        <div className="p-6">
                            <div className="flex flex-col md:flex-row gap-4">
                                {/* Busca */}
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        placeholder="Buscar por descrição..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                </div>
                                
                                {/* Filtros */}
                                <div className="flex gap-2">
                                    <select
                                        value={filter}
                                        onChange={(e) => setFilter(e.target.value)}
                                        className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="all">Todos</option>
                                        <option value="paid_by_me">Pago por mim</option>
                                        <option value="i_participate">Eu participo</option>
                                        <option value="pending">Pendentes</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Lista de Splits */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            {filteredSplits.length > 0 ? (
                                <div className="space-y-6">
                                    {filteredSplits.map((split) => (
                                        <div key={split.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                                            {/* Cabeçalho do Split */}
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <h3 className="text-lg font-semibold text-gray-900">
                                                            {split.description}
                                                        </h3>
                                                        {split.payer_user_id === auth?.user?.id && (
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                Criado por você
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                                                        <span>📅 {formatDate(split.expense_date || split.created_at)}</span>
                                                        <span>💰 {formatCurrency(split.total_amount)}</span>
                                                        <span>👤 Pago por: {split.creator?.name || 'N/A'}</span>
                                                    </div>
                                                </div>
                                                
                                                {/* Botões de ação - apenas para o criador do split */}
                                                {split.payer_user_id === auth?.user?.id ? (
                                                    <div className="flex space-x-2">
                                                        <Link
                                                            href={route('splits.edit', split.id)}
                                                            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                                                        >
                                                            ✏️ Editar
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDeleteSplit(split.id)}
                                                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                                                        >
                                                            🗑️ Excluir
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex space-x-2">
                                                        <Link
                                                            href={route('splits.show', split.id)}
                                                            className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                                                        >
                                                            👁️ Ver Detalhes
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Participantes */}
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-700 mb-3">
                                                    Participantes ({split.participants?.length ?? 0})
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {(split.participants || []).map((participant) => (
                                                        <div
                                                            key={participant.id}
                                                            className={`flex justify-between items-center p-3 rounded-md border ${
                                                                participant.status === 'paid'
                                                                    ? 'bg-green-50 border-green-200'
                                                                    : 'bg-yellow-50 border-yellow-200'
                                                            }`}
                                                        >
                                                            <div>
                                                                <div className="font-medium text-sm">
                                                                    {participant.user?.name || 'N/A'}
                                                                </div>
                                                                <div className="text-xs text-gray-600">
                                                                    {formatCurrency(participant.amount_owed)}
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="flex items-center space-x-2">
                                                                {participant.status === 'pending' ? (
                                                                    // Só mostrar botão de "Marcar como pago" se for o criador do split
                                                                    split.payer_user_id === auth?.user?.id ? (
                                                                        <button
                                                                            onClick={() => handleMarkAsPaid(split.id, participant.id)}
                                                                            className="text-green-600 hover:text-green-800 text-xs font-medium"
                                                                            title="Marcar como pago"
                                                                        >
                                                                            ✅ Pagar
                                                                        </button>
                                                                    ) : (
                                                                        <span className="text-yellow-600 text-xs font-medium">
                                                                            ⏳ Pendente
                                                                        </span>
                                                                    )
                                                                ) : (
                                                                    <span className="text-green-600 text-xs font-medium">
                                                                        ✅ Pago
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Status do Split */}
                                            <div className="mt-4 pt-3 border-t">
                                                {split.participants.every(p => p.status === 'paid') ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        ✅ Split Finalizado
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                        ⏳ Aguardando Pagamentos
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="text-gray-400 text-6xl mb-4">📊</div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        {searchTerm || filter !== 'all' ? 'Nenhum split encontrado' : 'Nenhum split criado ainda'}
                                    </h3>
                                    <p className="text-gray-600 mb-6">
                                        {searchTerm || filter !== 'all' 
                                            ? 'Tente alterar os filtros ou termo de busca'
                                            : 'Comece criando seu primeiro gasto compartilhado'
                                        }
                                    </p>
                                    {(!searchTerm && filter === 'all') && (
                                        <Link
                                            href={route('splits.create')}
                                            className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700"
                                        >
                                            ➕ Criar Primeiro Split
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
