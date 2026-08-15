import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { resourceApi } from '../services/api';
import {
  Boxes,
  PlusCircle,
  Search,
  Filter,
  Send,
  Edit,
  Trash2,
  AlertCircle,
  Layers,
  Sparkles
} from 'lucide-react';
import { InventoryBadge } from '../components/StatusBadge';
import { ResourceModal } from '../components/ResourceModal';
import { RequestModal } from '../components/RequestModal';

export function ResourceCatalogPage() {
  const { isAdmin } = useAuth();

  const [resources, setResources] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState(null);

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    setLoading(true);
    try {
      const res = await resourceApi.getAll();
      setResources(res.data.resources || []);
    } catch (err) {
      console.error('Error loading resources:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRequest = (resId) => {
    setSelectedResourceId(resId);
    setIsRequestModalOpen(true);
  };

  const handleEdit = (res) => {
    setEditingResource(res);
    setIsResourceModalOpen(true);
  };

  const filteredResources = resources.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? r.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(resources.map(r => r.category)));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-950/70 via-slate-850 to-purple-950/50 border border-indigo-500/25 backdrop-blur-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <Boxes className="w-3.5 h-3.5" />
            Central Resource Pool
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Available Limited Resources
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">
            Browse emergency supplies, IT hardware, sanitation units, and specialized equipment ready for crowd-demanded allocation.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setEditingResource(null);
              setIsResourceModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-xl shadow-purple-600/30 transition-all"
          >
            <PlusCircle className="w-5 h-5" />
            Add Resource
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-850 border border-slate-800">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search resources by name or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Resource Cards Grid */}
      {filteredResources.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 text-slate-400">
          <Boxes className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-50" />
          <h3 className="text-lg font-bold text-slate-300">No Resources Found</h3>
          <p className="text-xs text-slate-500 mt-1">Try clearing your search filters or check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((res) => {
            const availRatio = (res.available_quantity / (res.total_quantity || 1)) * 100;

            return (
              <div
                key={res.id}
                className="group relative p-6 rounded-3xl bg-slate-850/80 border border-slate-800 hover:border-indigo-500/40 backdrop-blur-md transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="px-3 py-1 rounded-lg bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-700">
                      {res.category}
                    </span>
                    <InventoryBadge available={res.available_quantity} total={res.total_quantity} />
                  </div>

                  <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {res.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                    {res.description || 'No detailed specifications recorded.'}
                  </p>

                  {/* Stock Bar Meter */}
                  <div className="mt-5 space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Available Stock:</span>
                      <span className="font-mono font-bold text-slate-200">
                        {res.available_quantity} of {res.total_quantity} units
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          res.available_quantity > 3
                            ? 'bg-emerald-500'
                            : res.available_quantity > 0
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${availRatio}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                    <span>In Active Allocation:</span>
                    <span className="font-mono font-bold text-indigo-400">{res.allocated_quantity} units</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-2">
                  <button
                    onClick={() => handleOpenRequest(res.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 hover:scale-[1.02] transition-all"
                  >
                    <Send className="w-4 h-4" />
                    Request Resource
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => handleEdit(res)}
                      className="p-2.5 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                      title="Edit Resource"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <ResourceModal
        isOpen={isResourceModalOpen}
        onClose={() => setIsResourceModalOpen(false)}
        resource={editingResource}
        onSaved={loadResources}
      />

      <RequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        preselectedResourceId={selectedResourceId}
        onSubmitted={loadResources}
      />

    </div>
  );
}
