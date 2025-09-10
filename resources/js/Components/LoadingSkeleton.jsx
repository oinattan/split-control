/**
 * LoadingSkeleton Component
 * 
 * A reusable skeleton loading component for the dashboard
 * to show while data is being fetched.
 */
export default function LoadingSkeleton({ variant = 'card' }) {
    if (variant === 'card') {
        return (
            <div className="animate-pulse bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                        <div className="h-8 bg-gray-200 rounded w-32"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
            </div>
        );
    }
    
    if (variant === 'stat') {
        return (
            <div className="animate-pulse bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                    <div className="p-2 bg-gray-200 rounded-md w-12 h-12"></div>
                    <div className="ml-4 flex-1">
                        <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                        <div className="h-8 bg-gray-200 rounded w-16"></div>
                    </div>
                </div>
            </div>
        );
    }
    
    if (variant === 'userDebt') {
        return (
            <div className="animate-pulse rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                        <div>
                            <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                            <div className="h-3 bg-gray-200 rounded w-32"></div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="h-5 bg-gray-200 rounded w-20 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="animate-pulse bg-gray-200 h-20 rounded"></div>
    );
}