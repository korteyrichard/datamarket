const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../resources/js/pages/PublicShop.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// The broken section starts at the product cards comment and ends at })()}
const oldSection = /(\s*\{\/\* Product cards \*\/\}[\s\S]*?>\s*\}\)\(\)\})/;

const newSection = `
                                                {/* Product cards - show all products at paid price (any network, no status filter) */}
                                                <p className="text-sm font-bold text-gray-700 mb-3">👇 Select the product you paid for:</p>
                                                {(() => {
                                                    const paidAmt = Number(trackingResult.payment_data.amount);

                                                    // Match by price only — no status filter so no products can be hidden
                                                    const priceMatches = products.filter(p =>
                                                        Math.abs(Number(p.agent_price) - paidAmt) <= 0.01
                                                    );

                                                    // Fallback: if absolutely no price match, show ALL shop products
                                                    const displayProducts = priceMatches.length > 0 ? priceMatches : products;
                                                    const isExact = priceMatches.length > 0;

                                                    if (displayProducts.length === 0) {
                                                        return (
                                                            <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl text-center">
                                                                <p className="text-orange-700 font-semibold text-sm">⚠ No products found in this shop.</p>
                                                                <p className="text-orange-600 text-xs mt-1">Please contact the shop agent for assistance.</p>
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <div className="space-y-3">
                                                            {isExact ? (
                                                                <div className="p-2 bg-green-50 border border-green-200 rounded-xl">
                                                                    <p className="text-green-700 text-xs font-semibold text-center">
                                                                        ✓ {priceMatches.length} product{priceMatches.length > 1 ? 's' : ''} found at ₵{paidAmt.toFixed(2)} — select your network below.
                                                                    </p>
                                                                </div>
                                                            ) : (
                                                                <div className="p-2 bg-orange-50 border border-orange-200 rounded-xl">
                                                                    <p className="text-orange-700 text-xs font-semibold text-center">
                                                                        ⚠ No exact price match for ₵{paidAmt.toFixed(2)}. Select the product you purchased:
                                                                    </p>
                                                                </div>
                                                            )}
                                                            {displayProducts.map((product) => {
                                                                const matched = Math.abs(Number(product.agent_price) - paidAmt) <= 0.01;
                                                                return (
                                                                    <div
                                                                        key={product.id}
                                                                        className={\`rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.01] \${
                                                                            matched
                                                                                ? 'border-2 border-green-400 bg-gradient-to-br from-green-50 to-white'
                                                                                : 'border-2 border-gray-200 bg-white hover:border-blue-400'
                                                                        }\`}
                                                                        onClick={() => !isCreatingOrder && handleCreateOrderFromReference(product.id)}
                                                                    >
                                                                        {matched && (
                                                                            <div className="bg-green-500 px-4 py-1.5 text-center">
                                                                                <span className="text-white text-xs font-bold tracking-wide">✓ MATCHES YOUR PAYMENT OF ₵{paidAmt.toFixed(2)}</span>
                                                                            </div>
                                                                        )}
                                                                        <div className="p-4">
                                                                            <div className="flex items-start justify-between mb-3">
                                                                                <div>
                                                                                    <p className="font-bold text-gray-900 text-lg leading-tight">{product.name}</p>
                                                                                    <p className="text-sm text-gray-500 font-medium mt-0.5">{product.network}</p>
                                                                                </div>
                                                                                <span className={\`text-2xl font-black \${matched ? 'text-green-600' : 'text-gray-500'}\`}>
                                                                                    ₵{Number(product.agent_price).toFixed(2)}
                                                                                </span>
                                                                            </div>
                                                                            <Button
                                                                                onClick={(e) => { e.stopPropagation(); handleCreateOrderFromReference(product.id); }}
                                                                                disabled={isCreatingOrder}
                                                                                className="w-full text-white font-bold py-3 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-base"
                                                                                style={{
                                                                                    background: matched
                                                                                        ? (shop.color
                                                                                            ? \`linear-gradient(135deg, \${shop.color}, \${shop.color}dd)\`
                                                                                            : 'linear-gradient(135deg, #10B981, #059669)')
                                                                                        : '#9CA3AF'
                                                                                }}
                                                                            >
                                                                                {isCreatingOrder ? '⏳ Creating...' : '🛒 Create Order'}
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    );
                                                })()}`;

if (oldSection.test(content)) {
    content = content.replace(oldSection, newSection);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ SUCCESS: Product filter section replaced.');
} else {
    console.log('❌ Pattern not found. Printing lines 568-580 for debug:');
    const lines = content.split('\n');
    lines.slice(567, 580).forEach((l, i) => console.log(`${568 + i}: ${JSON.stringify(l)}`));
}
