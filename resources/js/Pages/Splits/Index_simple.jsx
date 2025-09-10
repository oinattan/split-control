import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function SplitsIndex({ splits, auth }) {
    // mantenho nenhum log extra aqui para evitar duplicação

    if (!splits || !Array.isArray(splits)) {
        return (
            <AuthenticatedLayout
                header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Gerenciar Splits</h2>}
            >
                <Head title="Splits" />
                <div className="py-12">
                    <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                        <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                            <div className="p-6 text-gray-900">
                                <p>Erro: dados de splits não foram carregados corretamente.</p>
                                <p>Splits recebidos: {JSON.stringify(splits)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Gerenciar Splits</h2>}
        >
            <Head title="Splits" />
            
            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <div className="mb-6">
                                <Link 
                                    href={route('splits.create')}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                >
                                    Novo Split
                                </Link>
                            </div>

                            <h3 className="text-lg font-medium mb-4">
                                Seus Splits ({splits.length})
                            </h3>

                            {splits.length === 0 ? (
                                <p className="text-gray-500">Nenhum split encontrado.</p>
                            ) : (
                                <div className="space-y-4">
                                    {splits.map((split) => (
                                        <div key={split.id} className="border rounded-lg p-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-medium">{split.description}</h4>
                                                    <p className="text-sm text-gray-600">
                                                        Valor total: R$ {parseFloat(split.total_amount).toFixed(2)}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        Status: {split.status}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        Criado por: {split.creator?.name || 'N/A'}
                                                    </p>
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {new Date(split.created_at).toLocaleDateString('pt-BR')}
                                                </div>
                                            </div>
                                            
                                            {split.participants && split.participants.length > 0 && (
                                                <div className="mt-3">
                                                    <p className="text-sm font-medium">Participantes:</p>
                                                    <ul className="mt-1 space-y-1">
                                                        {split.participants.map((participant) => (
                                                            <li key={participant.id} className="text-sm text-gray-600">
                                                                {participant.user?.name || 'N/A'} - 
                                                                R$ {parseFloat(participant.amount_owed).toFixed(2)} - 
                                                                {participant.status}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
