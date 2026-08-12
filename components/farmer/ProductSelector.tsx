import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, Plus, Minus, Package } from 'lucide-react';
import { searchProducts } from '../../lib/api';
import type { ProductSummary, FarmerProductSelection } from '../../types';

interface ProductSelectorProps {
  selected: FarmerProductSelection[];
  onChange: (products: FarmerProductSelection[]) => void;
}

function debounce<T extends (...args: any[]) => any>(fn: T, ms: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

const ProductSelector: React.FC<ProductSelectorProps> = ({ selected, onChange }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const doSearch = useCallback(
    debounce(async (q: string) => {
      if (!q.trim() && q.length < 2) {
        setResults([]);
        setShowResults(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await searchProducts(q.trim() || undefined, undefined);
        setResults(data);
        setShowResults(true);
      } catch {
        setError('Could not load products. Please try again.');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    doSearch(query);
  }, [query, doSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isSelected = (productId: string) => selected.some((s) => s.productId === productId);

  const addProduct = (product: ProductSummary) => {
    if (isSelected(product.productId)) return;
    const newItem: FarmerProductSelection = {
      productId: product.productId,
      productName: product.productName,
      category: product.category,
      unit: product.unit,
      quantity: 100,
      harvestStatus: 'harvested',
      availableQuantity: 100,
    };
    onChange([...selected, newItem]);
    setQuery('');
    setShowResults(false);
  };

  const removeProduct = (productId: string) => {
    onChange(selected.filter((s) => s.productId !== productId));
  };

  const updateQuantity = (productId: string, qty: number) => {
    if (qty < 1) return;
    onChange(
      selected.map((s) =>
        s.productId === productId ? { ...s, quantity: qty, availableQuantity: qty } : s
      )
    );
  };

  const totalQuantity = selected.reduce((sum, s) => sum + s.quantity, 0);

  return (
    <div className="space-y-8">
      {/* ── Search box ──────────────────────────────────── */}
      <div ref={searchRef} className="relative z-20">
        <label className="field-label mb-2 block">Search products</label>
        <div className="relative shadow-sm rounded-md group">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-agri-600 transition-colors pointer-events-none"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (results.length > 0) setShowResults(true); }}
            placeholder="Type a crop or vegetable name..."
            className="field-input pl-12 pr-12 py-4 rounded-md text-base"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setResults([]); setShowResults(false); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-1 bg-neutral-100 hover:bg-neutral-200 rounded-full transition-colors"
            >
              <X size={14} strokeWidth={3} />
            </button>
          )}
        </div>

        {/* Dropdown */}
        {showResults && (
          <div className="absolute w-full mt-2 bg-white border border-neutral-200 shadow-xl rounded-md max-h-80 overflow-y-auto z-30">
            {loading && (
              <div className="px-5 py-4 text-sm text-neutral-400 font-medium animate-pulse">Loading products...</div>
            )}
            {!loading && error && (
              <div className="px-5 py-4 text-sm text-red-600 font-medium">{error}</div>
            )}
            {!loading && !error && results.length === 0 && (
              <div className="px-5 py-4 text-sm text-neutral-400">No products found for "{query}"</div>
            )}
            {!loading && results.map((product) => {
              const already = isSelected(product.productId);
              return (
                <button
                  key={product.productId}
                  onClick={() => !already && addProduct(product)}
                  disabled={already}
                  className={`w-full text-left px-5 py-4 flex items-center justify-between border-b border-neutral-100 last:border-0 transition-colors ${
                    already
                      ? 'bg-neutral-50 cursor-default opacity-60'
                      : 'hover:bg-agri-50 cursor-pointer'
                  }`}
                >
                  <div>
                    <p className="text-sm font-bold text-neutral-900">{product.productName}</p>
                    {product.category && (
                      <p className="data-label mt-1">{product.category} &middot; {product.unit}</p>
                    )}
                  </div>
                  {already ? (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Added</span>
                  ) : (
                    <span className="w-6 h-6 rounded-full bg-agri-100 flex items-center justify-center text-agri-700">
                      <Plus size={14} strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Selected products ───────────────────────────── */}
      {selected.length === 0 ? (
        <div className="border-2 border-dashed border-neutral-200 rounded-xl py-14 text-center bg-neutral-50/50">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-neutral-100">
            <Package size={20} className="text-neutral-400" />
          </div>
          <p className="text-sm font-medium text-neutral-600">No products selected yet.</p>
          <p className="text-xs text-neutral-400 mt-1">Search above to build your analysis basket.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="data-label">Selected Products</p>
          <div className="space-y-3">
            {selected.map((item, idx) => (
              <div
                key={item.productId}
                className="border border-neutral-200 bg-white rounded-lg p-5 animate-slide-in shadow-sm hover:border-agri-300 transition-colors group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                  
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <span className="flex-shrink-0 w-8 h-8 bg-neutral-100 text-neutral-500 text-xs font-bold flex items-center justify-center rounded-full">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-neutral-900 text-base truncate">{item.productName}</p>
                      {item.category && (
                        <p className="data-label mt-0.5">{item.category}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 border-neutral-100 pt-4 sm:pt-0">
                    <div className="flex items-center gap-3">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Qty ({item.unit})</label>
                      <div className="flex items-center border border-neutral-200 bg-neutral-50 rounded-md overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 50)}
                          className="px-3 py-2.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200 transition-colors"
                          aria-label="Decrease"
                        >
                          <Minus size={14} />
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.productId, Number(e.target.value))}
                          min={1}
                          className="w-20 text-center py-2.5 bg-white border-x border-neutral-200 text-sm font-black text-neutral-900 outline-none"
                          aria-label={`Quantity of ${item.productName}`}
                        />
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 50)}
                          className="px-3 py-2.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200 transition-colors"
                          aria-label="Increase"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => removeProduct(item.productId)}
                      className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-neutral-400 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors"
                      aria-label={`Remove ${item.productName}`}
                    >
                      <X size={16} strokeWidth={2.5} />
                    </button>
                  </div>

                </div>
              </div>
            ))}
          </div>

          {/* Summary strip */}
          <div className="flex items-center justify-between px-5 py-4 bg-agri-50 border border-agri-200 rounded-lg mt-6">
            <p className="data-label !text-agri-800">
              {selected.length} product{selected.length > 1 ? 's' : ''} in basket
            </p>
            <p className="text-sm font-black text-agri-900">
              Total: {totalQuantity.toLocaleString('en-IN')} {selected.length === 1 ? selected[0].unit : 'units'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductSelector;
