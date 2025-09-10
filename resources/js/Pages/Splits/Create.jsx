import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';

export default function SplitsCreate({ users, allUsers, auth }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        description: '',
        total_amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        payer_user_id: auth.user.id,
        participants: []
    });

    const [selectedUsers, setSelectedUsers] = useState([]); // armazenará números
    const [splitType, setSplitType] = useState('equal'); // equal, custom, percentage
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Debug (mantém apenas a linha desejada)
    console.log('Create props:', { users, allUsers, auth });

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (isSubmitting) return; // Prevenir duplo submit
        
        // Calcular valores baseado no tipo de divisão
        let participants = [];
        const totalAmount = parseFloat(data.total_amount);

        if (splitType === 'equal') {
            const amountPerPerson = totalAmount / selectedUsers.length;
            participants = selectedUsers.map(userId => ({
                user_id: Number(userId),
                amount_owed: parseFloat(amountPerPerson.toFixed(2))
            }));
        } else if (splitType === 'custom') {
            // Para custom, ler valores de inputs via state: vamos mapear os inputs por id
            participants = selectedUsers.map(userId => {
                const input = document.getElementById(`amount_${userId}`);
                const customAmount = input ? input.value : 0;
                return {
                    user_id: Number(userId),
                    amount_owed: parseFloat(customAmount) || 0
                };
            });
        }

        // Verificar se há participantes
        if (participants.length === 0) {
            alert('Selecione pelo menos um participante');
            return;
        }

        // Verificar se o total está correto (para divisão customizada)
        if (splitType === 'custom') {
            const totalAssigned = participants.reduce((sum, p) => sum + p.amount_owed, 0);
            if (Math.abs(totalAssigned - totalAmount) > 0.01) {
                alert(`A soma dos valores individuais (R$ ${totalAssigned.toFixed(2)}) deve ser igual ao valor total (R$ ${totalAmount.toFixed(2)})`);
                return;
            }
        }

        // Preparar payload explícito e enviar diretamente com router.post
        const payload = {
            description: data.description,
            total_amount: data.total_amount,
            expense_date: data.expense_date,
            payer_user_id: data.payer_user_id,
            split_type: splitType,
            participants: participants,
        };

        setIsSubmitting(true);

        console.log('selectedUsers at submit:', selectedUsers);
        console.log('Computed participants at submit:', participants);
        console.log('Submitting explicit payload:', payload);

        // Enviar payload explícito para evitar problemas de timing com setData
        router.post(route('splits.store'), payload, {
            onStart: (visit) => {
                console.log('Inertia visit started', visit);
            },
            onProgress: (progress) => {
                console.log('Inertia progress:', progress);
            },
            onCancel: (event) => {
                console.log('Inertia visit cancelled', event);
                setIsSubmitting(false);
            },
            onSuccess: () => {
                reset();
                setSelectedUsers([]);
            },
            onError: (errs) => {
                console.error('Erros de validação:', errs);
                // Garantir que o botão volte ao estado normal mesmo em erro
                setIsSubmitting(false);
            },
            onFinish: () => {
                console.log('Inertia visit finished');
                setIsSubmitting(false);
            }
        });
    };

    const handleUserToggle = (userId) => {
        // garantir que userId seja número
        const id = Number(userId);
        setSelectedUsers(prev => {
            if (prev.includes(id)) {
                return prev.filter(id2 => id2 !== id);
            } else {
                return [...prev, id];
            }
        });
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

    const getEqualAmount = () => {
        const totalAmount = parseFloat(data.total_amount) || 0;
        return selectedUsers.length > 0 ? (totalAmount / selectedUsers.length).toFixed(2) : 0;
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Criar Novo Split
                </h2>
            }
        >
            <Head title="Criar Split" />

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
                                            {allUsers.map(user => (
                                                <option key={user.id} value={user.id}>
                                                    {user.name} {user.id === auth.user.id ? '(Você)' : ''}
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
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                                                <div className="text-sm text-gray-600">Definir valor para cada pessoa</div>
                                            </div>
                                        </label>

                                        <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 opacity-50">
                                            <input
                                                type="radio"
                                                value="percentage"
                                                disabled
                                                className="mr-3"
                                            />
                                            <div>
                                                <div className="font-medium">Por Porcentagem</div>
                                                <div className="text-sm text-gray-600">Em breve...</div>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Seleção de Participantes */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Quem participou da despesa? *
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
                    {allUsers.map(user => (
                                            <div
                                                key={user.id}
                        className={`flex items-center justify-between p-3 border rounded-lg ${
                            selectedUsers.includes(user.id)
                            ? 'border-indigo-300 bg-indigo-50'
                            : 'border-gray-200'
                        }`}
                                            >
                                                <label className="flex items-center cursor-pointer flex-1">
                                                    <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => handleUserToggle(user.id)}
                                                        className="mr-3"
                                                    />
                                                    <div>
                                                        <div className="font-medium">{user.name}</div>
                                                        <div className="text-sm text-gray-600">{user.email}</div>
                                                    </div>
                                                </label>

                                                {splitType === 'custom' && selectedUsers.includes(user.id) && (
                                                    <div className="ml-4">
                                                        <div className="flex items-center">
                                                            <span className="text-sm text-gray-500 mr-2">R$</span>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                id={`amount_${user.id}`}
                                                                placeholder="0,00"
                                                                className="w-24 text-sm rounded border-gray-300"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {splitType === 'equal' && selectedUsers.includes(user.id) && (
                                                    <div className="ml-4 text-sm text-gray-600">
                                                        R$ {getEqualAmount()}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {selectedUsers.length === 0 && (
                                        <p className="text-sm text-red-600 mt-2">
                                            Selecione pelo menos um participante
                                        </p>
                                    )}
                                </div>

                                {/* Botões */}
                                <div className="flex justify-end space-x-3 pt-6 border-t">
                                    <button
                                        type="button"
                                        onClick={() => window.history.back()}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                        disabled={isSubmitting}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || selectedUsers.length === 0}
                                        className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                    >
                                        {isSubmitting && (
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        )}
                                        {isSubmitting ? 'Salvando...' : 'Criar Split'}
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
