export default function UserDebtCard({ user, amountOwed, amountOwing, balance, rawOwed, rawOwing, onPayClick }) {
    // Usar o saldo direto quando disponível
    const netAmount = balance !== undefined ? balance : (amountOwed - amountOwing);
    const isPositive = netAmount > 0;
    const isZero = netAmount === 0;

    // Para simplificar, vamos focar no valor líquido apenas
    const absAmount = Math.abs(netAmount);
    
    // Verificar se houve compensação (valores brutos diferentes dos finais)
    const hasCompensation = rawOwed && rawOwing && (rawOwed > 0 && rawOwing > 0);

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                        <span className="text-sm font-medium text-gray-700">
                            {user.name.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <h4 className="text-sm font-medium text-gray-900">{user.name}</h4>
                        <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                </div>
                
                <div className="text-right">
                    {isZero ? (
                        <span className="text-sm text-gray-500">Em dia</span>
                    ) : (
                        <>
                            <div className={`text-lg font-semibold ${
                                isPositive ? 'text-green-600' : 'text-red-600'
                            }`}>
                                {isPositive ? '+' : ''}R$ {absAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <p className="text-xs text-gray-500">
                                {isPositive ? 'Te deve' : 'Você deve'}
                            </p>
                        </>
                    )}
                </div>
            </div>
            
            {/* Mostrar compensação automática se houver */}
            {hasCompensation && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-500 space-y-2">
                        <div className="font-medium text-gray-700 mb-2">💱 Compensação automática:</div>
                        
                        <div className="bg-gray-50 p-2 rounded space-y-1">
                            <div className="flex justify-between">
                                <span>💰 {user.name.split(' ')[0]} te devia:</span>
                                <span className="text-green-600">R$ {rawOwed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>💳 Você devia para {user.name.split(' ')[0]}:</span>
                                <span className="text-red-600">R$ {rawOwing.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="border-t pt-1 flex justify-between font-medium">
                                <span>🧮 Saldo final:</span>
                                <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
                                    {isPositive ? '+' : ''}R$ {absAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Mostrar valores simples se não houver compensação */}
            {!hasCompensation && (amountOwed > 0 || amountOwing > 0) && !isZero && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-500 space-y-1">
                        {amountOwed > 0 && (
                            <div>
                                💰 Te deve: R$ {amountOwed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                        )}
                        {amountOwing > 0 && (
                            <div>
                                💳 Você deve: R$ {amountOwing.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
