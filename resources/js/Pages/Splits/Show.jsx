import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Show({ auth, split }) {
    const handleMarkAsPaid = (participantId) => {
        router.patch(route('splits.mark-paid', [split.id, participantId]), {}, {
            onSuccess: () => {
                // Sucesso será tratado pelo flash message
            }
        });
    };

    const handleMarkAsPending = (participantId) => {
        router.patch(route('splits.mark-pending', [split.id, participantId]), {}, {
            onSuccess: () => {
                // Sucesso será tratado pelo flash message
            }
        });
    };

    const getApprovalStatusBadge = (approvalStatus) => {
        switch (approvalStatus) {
            case 'approved':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Aprovado</span>;
            case 'rejected':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Rejeitado</span>;
            default:
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pendente</span>;
        }
    };

    const getPaymentStatusBadge = (status) => {
        switch (status) {
            case 'paid':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Pago</span>;
            default:
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pendente</span>;
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'active':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Ativo</span>;
            case 'completed':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Finalizado</span>;
            case 'cancelled':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Cancelado</span>;
            default:
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Aguardando Aprovação</span>;
        }
    };

    const canMarkPayments = split.payer_user_id === auth.user.id;

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Detalhes do Split</h2>}
        >
            <Head title="Detalhes do Split" />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            {/* Cabeçalho */}
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{split.description}</h1>
                                    <div className="flex items-center space-x-4">
                                        <p className="text-gray-600">
                                            Pago por <span className="font-medium">{
                                                split.payer && split.payer.name
                                                    ? split.payer.name
                                                    : (Array.isArray(split.participants) && split.participants.length > 0
                                                        ? (() => {
                                                            const payer = split.participants.find(p => p.user && p.user.id === split.payer_user_id);
                                                            return payer && payer.user && payer.user.name ? payer.user.name : 'N/A';
                                                        })()
                                                        : 'N/A')
                                            }</span>
                                        </p>
                                        <p className="text-gray-600">
                                            em {new Date(split.expense_date).toLocaleDateString('pt-BR')}
                                        </p>
                                        {getStatusBadge(split.status)}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-bold text-gray-900">
                                        R$ {parseFloat(split.total_amount).toFixed(2)}
                                    </p>
                                    <p className="text-sm text-gray-500">Total</p>
                                </div>
                            </div>

                            {/* Participantes */}
                            <div className="border-t pt-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Participantes</h3>
                                <div className="space-y-4">
                                    {split.participants.map((participant) => (
                                        <div key={participant.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <div className="flex-shrink-0">
                                                    <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                                        <span className="text-indigo-600 font-medium text-sm">
                                                            {participant.user.name.charAt(0)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {participant.user.name}
                                                        {participant.user.id === split.payer_user_id && (
                                                            <span className="ml-2 text-xs text-indigo-600">(Pagador)</span>
                                                        )}
                                                        {participant.user.id === auth.user.id && (
                                                            <span className="ml-2 text-xs text-green-600">(Você)</span>
                                                        )}
                                                    </p>
                                                    <p className="text-sm text-gray-500">{participant.user.email}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-4">
                                                <div className="text-right">
                                                    <p className="text-lg font-semibold text-gray-900">
                                                        R$ {parseFloat(participant.amount_owed).toFixed(2)}
                                                    </p>
                                                    <div className="flex space-x-2">
                                                        {getApprovalStatusBadge(participant.approval_status)}
                                                        {getPaymentStatusBadge(participant.status)}
                                                    </div>
                                                </div>

                                                {/* Botões de ação para o pagador */}
                                                {canMarkPayments && participant.user.id !== auth.user.id && participant.approval_status === 'approved' && (
                                                    <div className="flex space-x-2">
                                                        {participant.status === 'pending' ? (
                                                            <button
                                                                onClick={() => handleMarkAsPaid(participant.id)}
                                                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
                                                            >
                                                                Marcar como Pago
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleMarkAsPending(participant.id)}
                                                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-yellow-600 hover:bg-yellow-700"
                                                            >
                                                                Marcar como Pendente
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Resumo */}
                            <div className="border-t pt-6 mt-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <p className="text-sm text-blue-600">Participantes</p>
                                        <p className="text-2xl font-bold text-blue-900">{split.participants.length}</p>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-lg">
                                        <p className="text-sm text-green-600">Aprovados</p>
                                        <p className="text-2xl font-bold text-green-900">
                                            {split.participants.filter(p => p.approval_status === 'approved').length}
                                        </p>
                                    </div>
                                    <div className="bg-yellow-50 p-4 rounded-lg">
                                        <p className="text-sm text-yellow-600">Pagos</p>
                                        <p className="text-2xl font-bold text-yellow-900">
                                            {split.participants.filter(p => p.status === 'paid').length}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Botões de ação */}
                            <div className="flex justify-between items-center pt-6 border-t">
                                <Link
                                    href={route('splits.index')}
                                    className="inline-flex items-center px-4 py-2 bg-gray-500 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700"
                                >
                                    Voltar
                                </Link>

                                {split.payer_user_id === auth.user.id && (
                                    <Link
                                        href={route('splits.edit', split.id)}
                                        className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700"
                                    >
                                        Editar Split
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
