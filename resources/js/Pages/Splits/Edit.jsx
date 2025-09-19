import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function SplitsEdit({ split, users, auth }) {
    const { data, setData, put, processing, errors } = useForm({
        description: split.description,
        total_amount: split.total_amount,
        expense_date: split.expense_date,
        payer_user_id: split.payer_user_id,
        participants: split.participants
    });

    const [selectedUsers, setSelectedUsers] = useState(
        split.participants.map(p => Number(p.user_id))
    );
    const [splitType, setSplitType] = useState('custom');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        setIsSubmitting(true);
        
        // Pequeno delay para garantir que o usuário veja o feedback visual
        await new Promise(resolve => setTimeout(resolve, 100));
        
        let participants = [];
        const totalAmount = parseFloat(data.total_amount);

        if (splitType === 'equal') {
            const amountPerPerson = totalAmount / selectedUsers.length;
            participants = selectedUsers.map(userId => ({
                user_id: parseInt(userId),
                amount_owed: amountPerPerson.toFixed(2)
            }));
        } else if (splitType === 'custom') {
            participants = selectedUsers.map(userId => {
                const existingParticipant = split.participants.find(p => p.user_id === Number(userId));
                const input = document.getElementById(`amount_${userId}`);
                const customAmount = input ? input.value : (existingParticipant?.amount_owed || 0);
                
                return {
                    user_id: Number(userId),
                    amount_owed: parseFloat(customAmount)
                };
            });
        }

        // Enviar payload no formato esperado pelo backend (campos no root)
        put(route('splits.update', split.id), {
            description: data.description,
            total_amount: data.total_amount,
            expense_date: data.expense_date,
            payer_user_id: data.payer_user_id,
            participants: participants
        }, {
            onFinish: () => setIsSubmitting(false)
        });
    };

    const handleUserToggle = (userId) => {
        const id = Number(userId);
        setSelectedUsers(prev => {
            if (prev.includes(id)) {
                return prev.filter(id2 => id2 !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    const getEqualAmount = () => {
        const totalAmount = parseFloat(data.total_amount) || 0;
        return selectedUsers.length > 0 ? (totalAmount / selectedUsers.length).toFixed(2) : 0;
    };

    const calculateRemainingAmount = () => {
        if (splitType !== 'custom') return 0;
        
        const totalAmount = parseFloat(data.total_amount) || 0;
        const assignedAmount = selectedUsers.reduce((sum, userId) => {
            const customAmount = document.getElementById(`amount_${userId}`)?.value || 0;
            return sum + parseFloat(customAmount);
        }, 0);
        
        return totalAmount - assignedAmount;
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Editar Split: {split.description}
                </h2>
            }
        >
            <Head title="Editar Split" />

            <div >
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8 mt-6 bg-red-200 shadow-sm rounded-lg py-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Em fase de testes</h1>
                        <p className="mt-1 text-gray-600">
                            Edição ainda em desenvolvimento. Algumas funcionalidades podem não estar completas.
                        </p>
                    </div>
        
                    <button
                        onClick={() => router.visit(route('splits.index'))}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                    >
                        &larr; Voltar para Splits
                    </button>
                </div>
            </div>

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Informações Básicas */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Descrição *
                                        </label>
                                        <input
                                            type="text"
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            placeholder="Ex: Almoço no restaurante X"
                                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            required
                                        />
                                        {errors.description && (
                                            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Valor Total *
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={data.total_amount}
                                                onChange={(e) => setData('total_amount', e.target.value)}
                                                placeholder="0,00"
                                                className="w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                required
                                            />
                                        </div>
                                        {errors.total_amount && (
                                            <p className="mt-1 text-sm text-red-600">{errors.total_amount}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Data da Despesa *
                                        </label>
                                        <input
                                            type="date"
                                            value={data.expense_date}
                                            onChange={(e) => setData('expense_date', e.target.value)}
                                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            required
                                        />
                                        {errors.expense_date && (
                                            <p className="mt-1 text-sm text-red-600">{errors.expense_date}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Quem Pagou *
                                        </label>
                                        <select
                                            value={data.payer_user_id}
                                            onChange={(e) => setData('payer_user_id', e.target.value)}
                                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            required
                                        >
                                            {users.map(user => (
                                                <option key={user.id} value={user.id}>
                                                    {user.name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.payer_user_id && (
                                            <p className="mt-1 text-sm text-red-600">{errors.payer_user_id}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Tipo de Divisão */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Como dividir a conta?
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                            <input
                                                type="radio"
                                                value="equal"
                                                checked={splitType === 'equal'}
                                                onChange={(e) => setSplitType(e.target.value)}
                                                className="mr-3"
                                            />
                                            <div>
                                                <div className="font-medium">Dividir Igualmente</div>
                                                <div className="text-sm text-gray-600">Todos pagam o mesmo valor</div>
                                            </div>
                                        </label>

                                        <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                            <input
                                                type="radio"
                                                value="custom"
                                                checked={splitType === 'custom'}
                                                onChange={(e) => setSplitType(e.target.value)}
                                                className="mr-3"
                                            />
                                            <div>
                                                <div className="font-medium">Valores Personalizados</div>
                                                <div className="text-sm text-gray-600">Manter valores atuais ou editar</div>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Seleção de Participantes */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Participantes da despesa *
                                    </label>
                                    
                                    {splitType === 'equal' && selectedUsers.length > 0 && (
                                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                            <div className="text-sm text-blue-700">
                                                💡 Cada pessoa pagará: <strong>R$ {getEqualAmount()}</strong>
                                            </div>
                                        </div>
                                    )}

                                    {splitType === 'custom' && selectedUsers.length > 0 && (
                                        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                            <div className="text-sm text-yellow-700">
                                                ⚠️ Restante para distribuir: <strong>R$ {calculateRemainingAmount().toFixed(2)}</strong>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        {users.map(user => {
                                            const existingParticipant = split.participants.find(p => p.user_id === user.id);
                                            const isSelected = selectedUsers.includes(user.id.toString());
                                            
                                            return (
                                                <div
                                                    key={user.id}
                                                    className={`flex items-center justify-between p-3 border rounded-lg ${
                                                        isSelected
                                                            ? 'border-indigo-300 bg-indigo-50'
                                                            : 'border-gray-200'
                                                    }`}
                                                >
                                                    <label className="flex items-center cursor-pointer flex-1">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => handleUserToggle(user.id.toString())}
                                                            className="mr-3"
                                                        />
                                                        <div className="flex-1">
                                                            <div className="font-medium">{user.name}</div>
                                                            <div className="text-sm text-gray-600">{user.email}</div>
                                                            {existingParticipant && (
                                                                <div className="text-xs text-gray-500 mt-1">
                                                                    Status: {existingParticipant.status === 'paid' ? '✅ Pago' : '⏳ Pendente'}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </label>

                                                    {splitType === 'custom' && isSelected && (
                                                        <div className="ml-4">
                                                            <div className="flex items-center">
                                                                <span className="text-sm text-gray-500 mr-2">R$</span>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    id={`amount_${user.id}`}
                                                                    defaultValue={existingParticipant?.amount_owed || ''}
                                                                    placeholder="0,00"
                                                                    className="w-24 text-sm rounded border-gray-300"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {splitType === 'equal' && isSelected && (
                                                        <div className="ml-4 text-sm text-gray-600">
                                                            R$ {getEqualAmount()}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {selectedUsers.length === 0 && (
                                        <p className="text-sm text-red-600 mt-2">
                                            Selecione pelo menos um participante
                                        </p>
                                    )}
                                </div>

                                {/* Aviso sobre alterações */}
                                <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <span className="text-amber-400">⚠️</span>
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-amber-800">
                                                Atenção ao editar
                                            </h3>
                                            <div className="mt-2 text-sm text-amber-700">
                                                <p>
                                                    Alterações nos valores ou participantes podem afetar os pagamentos já realizados. 
                                                    Certifique-se de comunicar as mudanças aos envolvidos.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Botões */}
                                <div className="flex justify-end space-x-3 pt-6 border-t">
                                    <button
                                        type="button"
                                        onClick={() => window.history.back()}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || selectedUsers.length === 0}
                                        className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                    >
                                        {isSubmitting && (
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        )}
                                        <span>{isSubmitting ? 'Salvando...' : 'Atualizar Split'}</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
