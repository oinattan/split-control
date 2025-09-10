import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function PendingApprovals({ auth, pendingSplits }) {
    const handleApprove = (participantId) => {
        router.patch(route('participants.approve', participantId), {}, {
            onSuccess: () => {
                // Sucesso será tratado pelo flash message
            }
        });
    };

    const handleReject = (participantId) => {
        if (confirm('Tem certeza que deseja rejeitar este split?')) {
            router.patch(route('participants.reject', participantId), {}, {
                onSuccess: () => {
                    // Sucesso será tratado pelo flash message
                }
            });
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Splits Pendentes de Aprovação</h2>}
        >
            <Head title="Aprovações Pendentes" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {pendingSplits.length === 0 ? (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6 text-gray-900 text-center">
                                <div className="mb-4">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum split pendente</h3>
                                <p className="text-gray-500">Você não tem nenhum split aguardando sua aprovação.</p>
                                <div className="mt-6">
                                    <Link
                                        href={route('dashboard')}
                                        className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700"
                                    >
                                        Voltar ao Dashboard
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {pendingSplits.map((participant) => (
                                <div key={participant.id} className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                    <div className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0">
                                                            <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                                                <span className="text-indigo-600 font-medium text-sm">
                                                                    {participant.split && participant.split.payer && participant.split.payer.name
                                                                        ? participant.split.payer.name.charAt(0)
                                                                        : '?'
                                                                    }
                                                                </span>
                                                            </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        <h3 className="text-lg font-medium text-gray-900">
                                                            {participant.split.description}
                                                        </h3>
                                                        <p className="text-sm text-gray-500">
                                                            Pago por {participant.split && participant.split.payer && participant.split.payer.name ? participant.split.payer.name : 'N/A'} em {' '}
                                                            {participant.split && participant.split.expense_date ? new Date(participant.split.expense_date).toLocaleDateString('pt-BR') : 'N/A'}
                                                        </p>
                                                        <div className="mt-2 flex items-center space-x-4">
                                                            <span className="text-sm text-gray-500">
                                                                Total: R$ {parseFloat(participant.split.total_amount).toFixed(2)}
                                                            </span>
                                                            <span className="text-sm font-medium text-indigo-600">
                                                                Sua parte: R$ {parseFloat(participant.amount_owed).toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex space-x-3">
                                                <button
                                                    onClick={() => handleApprove(participant.id)}
                                                    className="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700 focus:bg-green-700 active:bg-green-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                                >
                                                    <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Aprovar
                                                </button>
                                                <button
                                                    onClick={() => handleReject(participant.id)}
                                                    className="inline-flex items-center px-4 py-2 bg-red-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-red-700 focus:bg-red-700 active:bg-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                                >
                                                    <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                    Rejeitar
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                            <h4 className="text-sm font-medium text-gray-900 mb-2">Participantes deste split:</h4>
                                            <div className="space-y-1">
                                                {(participant.split && Array.isArray(participant.split.participants) ? participant.split.participants : []).map((p) => (
                                                    <div key={p.id} className="flex justify-between text-sm">
                                                        <span className={p.user && p.user.id === auth.user.id ? 'font-medium text-indigo-600' : 'text-gray-600'}>
                                                            {p.user && p.user.name ? p.user.name : 'Usuário'} {p.user && p.user.id === auth.user.id && '(Você)'}
                                                        </span>
                                                        <span className="text-gray-500">
                                                            R$ {parseFloat(p.amount_owed || 0).toFixed(2)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
