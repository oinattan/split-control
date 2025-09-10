export default function SummaryCard({ title, amount, variant = 'default', children }) {
    const variants = {
        default: 'bg-white border-gray-200',
        success: 'bg-green-50 border-green-200',
        warning: 'bg-yellow-50 border-yellow-200',
        danger: 'bg-red-50 border-red-200'
    };

    const textVariants = {
        default: 'text-gray-900',
        success: 'text-green-900',
        warning: 'text-yellow-900',
        danger: 'text-red-900'
    };

    const amountVariants = {
        default: 'text-gray-600',
        success: 'text-green-600',
        warning: 'text-yellow-600',
        danger: 'text-red-600'
    };

    return (
        <div className={`rounded-lg border p-6 shadow-sm ${variants[variant]}`}>
            <div className="flex items-center justify-between">
                <div>
                    <h3 className={`text-sm font-medium ${textVariants[variant]}`}>
                        {title}
                    </h3>
                    <p className={`text-2xl font-bold ${amountVariants[variant]}`}>
                        R$ {((typeof amount === 'number' && !isNaN(amount)) ? amount : 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                </div>
                {children && (
                    <div className="text-right">
                        {children}
                    </div>
                )}
            </div>
        </div>
    );
}
