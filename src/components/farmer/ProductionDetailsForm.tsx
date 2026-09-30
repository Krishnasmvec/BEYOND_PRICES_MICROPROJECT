import React from 'react';
import { Calendar, CheckCircle, Clock, Package, HelpCircle } from 'lucide-react';
import type { FarmerProductSelection, HarvestStatus } from '../../../shared/types.ts';

interface ProductionDetailsFormProps {
  products: FarmerProductSelection[];
  onChange: (products: FarmerProductSelection[]) => void;
}

const HARVEST_STATUS_OPTIONS: { value: HarvestStatus; label: string; hint: string }[] = [
  { value: 'harvested', label: 'Already harvested', hint: 'Ready to transport now' },
  { value: 'ready', label: 'Ready to harvest', hint: 'Can harvest within days' },
  { value: 'expected', label: 'Expected harvest', hint: 'Future harvest date' },
];

const ProductionDetailsForm: React.FC<ProductionDetailsFormProps> = ({ products, onChange }) => {
  const update = (productId: string, patch: Partial<FarmerProductSelection>) => {
    onChange(products.map((p) => (p.productId === productId ? { ...p, ...patch } : p)));
  };

  if (products.length === 0) {
    return (
      <div className="py-14 text-center border-2 border-dashed border-neutral-200 rounded-xl bg-neutral-50/50">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-neutral-100">
          <Package size={20} className="text-neutral-400" />
        </div>
        <p className="text-sm font-medium text-neutral-600">No products selected yet.</p>
        <p className="text-xs text-neutral-400 mt-1">Go back and select at least one product.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {products.map((product, idx) => (
        <div key={product.productId} className="border border-neutral-200 bg-white rounded-xl overflow-hidden shadow-sm hover:border-agri-200 transition-colors">
          {/* Header */}
          <div className="flex items-center gap-4 px-6 py-4 border-b border-neutral-100 bg-gradient-to-r from-neutral-50 to-white">
            <span className="w-8 h-8 bg-agri-900 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 rounded-full shadow-sm">
              {idx + 1}
            </span>
            <div>
              <p className="font-bold text-base text-neutral-900 leading-tight">{product.productName}</p>
              {product.category && <p className="data-label mt-1">{product.category}</p>}
            </div>
          </div>

          {/* Fields */}
          <div className="p-6 md:p-8 space-y-8">
            {/* Harvest status */}
            <div>
              <label className="field-label mb-3 block">Harvest status</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {HARVEST_STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => update(product.productId, { harvestStatus: opt.value })}
                    className={`border text-left px-4 py-4 rounded-lg transition-all group ${
                      product.harvestStatus === opt.value
                        ? 'border-agri-600 bg-agri-50 shadow-sm'
                        : 'border-neutral-200 hover:border-agri-200 hover:bg-neutral-50'
                    }`}
                  >
                    <p className={`text-sm font-bold mb-1 transition-colors ${product.harvestStatus === opt.value ? 'text-agri-900' : 'text-neutral-700 group-hover:text-neutral-900'}`}>
                      {opt.label}
                    </p>
                    <p className="text-xs text-neutral-500 font-medium">{opt.hint}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Harvest date — shown when expected or ready */}
            <div className={`transition-all overflow-hidden duration-300 ${
              (product.harvestStatus === 'expected' || product.harvestStatus === 'ready') 
                ? 'max-h-32 opacity-100' 
                : 'max-h-0 opacity-0'
            }`}>
              <label className="field-label mb-2 block" htmlFor={`harvest-date-${product.productId}`}>
                {product.harvestStatus === 'expected' ? 'Expected harvest date' : 'Planned harvest date'}
              </label>
              <div className="relative max-w-sm shadow-sm rounded-md overflow-hidden">
                <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  id={`harvest-date-${product.productId}`}
                  type="date"
                  value={product.harvestDate ?? ''}
                  onChange={(e) => update(product.productId, { harvestDate: e.target.value })}
                  className="field-input pl-11 py-3 text-sm rounded-md w-full"
                />
              </div>
            </div>

            {/* Quantity + available */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <label className="field-label !mb-0" htmlFor={`qty-${product.productId}`}>
                    Total quantity
                  </label>
                  <span className="px-2 py-0.5 bg-neutral-100 text-[10px] font-bold text-neutral-500 rounded uppercase tracking-widest">{product.unit}</span>
                </div>
                <input
                  id={`qty-${product.productId}`}
                  type="number"
                  min={1}
                  value={product.quantity}
                  onChange={(e) => {
                    const qty = Math.max(1, Number(e.target.value));
                    update(product.productId, {
                      quantity: qty,
                      availableQuantity: Math.min(product.availableQuantity, qty),
                    });
                  }}
                  className="field-input text-lg rounded-md py-3 shadow-sm"
                />
              </div>
              
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <label className="field-label !mb-0" htmlFor={`avail-${product.productId}`}>
                    Available for sale
                  </label>
                  <span className="px-2 py-0.5 bg-neutral-100 text-[10px] font-bold text-neutral-500 rounded uppercase tracking-widest">{product.unit}</span>
                </div>
                <input
                  id={`avail-${product.productId}`}
                  type="number"
                  min={1}
                  max={product.quantity}
                  value={product.availableQuantity}
                  onChange={(e) => {
                    const val = Math.min(Math.max(1, Number(e.target.value)), product.quantity);
                    update(product.productId, { availableQuantity: val });
                  }}
                  className="field-input text-lg rounded-md py-3 shadow-sm"
                />
              </div>
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-2.5 pt-4 border-t border-neutral-100 text-xs font-medium text-neutral-500">
              {product.harvestStatus === 'harvested' ? (
                <><CheckCircle size={16} className="text-agri-600" /> Produce is considered ready for immediate transport.</>
              ) : (
                <><HelpCircle size={16} className="text-neutral-400" /> Date is required to analyze future market price trends.</>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductionDetailsForm;
