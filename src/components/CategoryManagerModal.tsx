import React, { useState } from 'react';
import { X, Plus, Trash2, Edit2, Check, RefreshCcw, Layers, Sparkles } from 'lucide-react';
import { CategoryItem, InterestItem } from '../types';
import { DEFAULT_CATEGORIES } from '../data/defaultCategories';
import { DEFAULT_INTERESTS } from '../data/defaultInterests';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryItem[];
  setCategories: React.Dispatch<React.SetStateAction<CategoryItem[]>>;
  interests?: InterestItem[];
  setInterests?: React.Dispatch<React.SetStateAction<InterestItem[]>>;
  initialTab?: 'categories' | 'interests';
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  categories,
  setCategories,
  interests = [],
  setInterests,
  initialTab = 'categories'
}) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'interests'>(initialTab);

  // Category state
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');

  // Interest state
  const [newInterestName, setNewInterestName] = useState('');
  const [editingInterestId, setEditingInterestId] = useState<string | null>(null);
  const [editInterestName, setEditInterestName] = useState('');

  if (!isOpen) return null;

  // --- CATEGORY HANDLERS ---
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const newCategory: CategoryItem = {
      id: newCatName.toLowerCase().trim().replace(/\s+/g, '_') + '_' + Date.now(),
      name: newCatName.trim(),
      description: `${newCatName.trim()} establishments`,
      icon: 'Store',
      color: '#4285F4',
      isCustom: true
    };

    setCategories((prev) => {
      const updated = [...prev, newCategory];
      syncCategoriesToServer(updated);
      return updated;
    });
    setNewCatName('');
  };

  const syncCategoriesToServer = async (updated: CategoryItem[]) => {
    try {
      await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: updated })
      });
    } catch (e) {
      console.error('Failed to sync categories to server', e);
    }
  };

  const handleDeleteCategory = (id: string) => {
    if (categories.length <= 1) {
      alert('You must retain at least one category.');
      return;
    }
    setCategories((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      syncCategoriesToServer(updated);
      return updated;
    });
  };

  const handleStartEditCat = (cat: CategoryItem) => {
    setEditingCatId(cat.id);
    setEditCatName(cat.name);
  };

  const handleSaveEditCat = (id: string) => {
    if (!editCatName.trim()) return;
    setCategories((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, name: editCatName.trim() } : c));
      syncCategoriesToServer(updated);
      return updated;
    });
    setEditingCatId(null);
  };

  const handleRestoreDefaultCategories = () => {
    if (confirm('Restore default commercial categories?')) {
      setCategories(DEFAULT_CATEGORIES);
      syncCategoriesToServer(DEFAULT_CATEGORIES);
    }
  };

  // --- INTEREST HANDLERS ---
  const handleAddInterest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInterestName.trim()) return;

    const newInterest: InterestItem = {
      id: newInterestName.toLowerCase().trim().replace(/\s+/g, '_') + '_' + Date.now(),
      name: newInterestName.trim(),
      description: `${newInterestName.trim()} target niche`,
      icon: 'Sparkles',
      color: '#4F46E5',
      isCustom: true
    };

    if (setInterests) {
      setInterests((prev) => {
        const updated = [...prev, newInterest];
        syncInterestsToServer(updated);
        return updated;
      });
    }
    setNewInterestName('');
  };

  const syncInterestsToServer = async (updated: InterestItem[]) => {
    try {
      await fetch('/api/interests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interests: updated })
      });
    } catch (e) {
      console.error('Failed to sync interests to server', e);
    }
  };

  const handleDeleteInterest = (id: string) => {
    if (interests.length <= 1) {
      alert('You must retain at least one interest.');
      return;
    }
    if (setInterests) {
      setInterests((prev) => {
        const updated = prev.filter((item) => item.id !== id);
        syncInterestsToServer(updated);
        return updated;
      });
    }
  };

  const handleStartEditInterest = (interest: InterestItem) => {
    setEditingInterestId(interest.id);
    setEditInterestName(interest.name);
  };

  const handleSaveEditInterest = (id: string) => {
    if (!editInterestName.trim()) return;
    if (setInterests) {
      setInterests((prev) => {
        const updated = prev.map((item) => (item.id === id ? { ...item, name: editInterestName.trim() } : item));
        syncInterestsToServer(updated);
        return updated;
      });
    }
    setEditingInterestId(null);
  };

  const handleRestoreDefaultInterests = () => {
    if (confirm('Restore default commercial interests?')) {
      if (setInterests) {
        setInterests(DEFAULT_INTERESTS);
        syncInterestsToServer(DEFAULT_INTERESTS);
      }
    }
  };

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-2 p-sm-3"
      style={{ backgroundColor: 'rgba(32, 33, 36, 0.45)', zIndex: 1060 }}
    >
      <div className="bg-white border rounded-4 shadow-lg w-100" style={{ maxWidth: '520px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header */}
        <div className="p-3 p-sm-3.5 border-bottom d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <div
              className="p-1.5 rounded-3 d-flex align-items-center justify-content-center text-primary flex-shrink-0"
              style={{ backgroundColor: '#EBF2FE', width: '34px', height: '34px' }}
            >
              <Layers size={18} />
            </div>
            <div>
              <h6 className="mb-0 fw-bold text-dark" style={{ fontSize: '0.96rem' }}>Manage Category &amp; Interest</h6>
              <small className="text-muted" style={{ fontSize: '0.74rem' }}>
                Configure business categories and commercial interest niches
              </small>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm btn-light border-0 text-muted p-1.5 rounded-circle flex-shrink-0"
            title="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* 2 Navigation Tabs */}
        <div className="px-3 pt-2 pb-0 border-bottom bg-light-subtle d-flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`btn btn-sm pb-2 pt-1.5 px-3 fw-semibold border-0 rounded-0 d-inline-flex align-items-center gap-2 ${
              activeTab === 'categories'
                ? 'text-primary border-bottom border-2 border-primary'
                : 'text-muted'
            }`}
            style={{ fontSize: '0.84rem' }}
          >
            <Layers size={15} />
            <span>Category Management</span>
            <span
              className={`badge rounded-pill ${
                activeTab === 'categories' ? 'bg-primary text-white' : 'bg-secondary-subtle text-secondary'
              }`}
              style={{ fontSize: '0.68rem' }}
            >
              {categories.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('interests')}
            className={`btn btn-sm pb-2 pt-1.5 px-3 fw-semibold border-0 rounded-0 d-inline-flex align-items-center gap-2 ${
              activeTab === 'interests'
                ? 'text-primary border-bottom border-2 border-primary'
                : 'text-muted'
            }`}
            style={{ fontSize: '0.84rem' }}
          >
            <Sparkles size={15} />
            <span>Interest Management</span>
            <span
              className={`badge rounded-pill ${
                activeTab === 'interests' ? 'bg-primary text-white' : 'bg-secondary-subtle text-secondary'
              }`}
              style={{ fontSize: '0.68rem' }}
            >
              {interests.length}
            </span>
          </button>
        </div>

        {/* Tab 1: Category Management Body */}
        {activeTab === 'categories' && (
          <div className="p-3 p-sm-3.5 overflow-auto flex-grow-1">
            {/* Add Category form */}
            <form onSubmit={handleAddCategory} className="d-flex gap-2 mb-3">
              <input
                type="text"
                placeholder="e.g. Pharmacy, Clinic, Hardware Store"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="form-control form-control-sm"
                style={{ fontSize: '0.84rem' }}
              />
              <button
                type="submit"
                disabled={!newCatName.trim()}
                className="btn btn-g-blue btn-sm px-3 text-nowrap fw-semibold d-inline-flex align-items-center gap-1 shadow-xs"
                style={{ fontSize: '0.8rem' }}
              >
                <Plus size={14} />
                <span>Add Category</span>
              </button>
            </form>

            <div className="d-flex align-items-center justify-content-between mb-2">
              <small className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.4px' }}>
                All Categories ({categories.length})
              </small>
              <button
                type="button"
                onClick={handleRestoreDefaultCategories}
                className="btn btn-link p-0 small text-decoration-none text-muted d-flex align-items-center gap-1"
                style={{ fontSize: '0.74rem' }}
              >
                <RefreshCcw size={11} />
                <span>Reset Defaults</span>
              </button>
            </div>

            <div className="d-flex flex-column gap-1.5" style={{ maxHeight: '320px', overflowY: 'auto' }}>
              {categories.map((cat) => {
                const isEditing = editingCatId === cat.id;

                return (
                  <div
                    key={cat.id}
                    className="p-2 rounded border bg-light d-flex align-items-center justify-content-between"
                    style={{ fontSize: '0.82rem' }}
                  >
                    {isEditing ? (
                      <div className="d-flex align-items-center gap-2 flex-grow-1 me-2">
                        <input
                          type="text"
                          value={editCatName}
                          onChange={(e) => setEditCatName(e.target.value)}
                          className="form-control form-control-sm py-0"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEditCat(cat.id)}
                          className="btn btn-sm btn-success py-0 px-2"
                        >
                          <Check size={12} />
                        </button>
                      </div>
                    ) : (
                      <span className="fw-medium text-dark">{cat.name}</span>
                    )}

                    <div className="d-flex align-items-center gap-1">
                      {!isEditing && (
                        <button
                          type="button"
                          onClick={() => handleStartEditCat(cat)}
                          className="btn btn-sm btn-link text-muted p-1"
                          title="Edit category"
                        >
                          <Edit2 size={13} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="btn btn-sm btn-link text-danger p-1"
                        title="Delete category"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Interest Management Body */}
        {activeTab === 'interests' && (
          <div className="p-3 p-sm-3.5 overflow-auto flex-grow-1">
            {/* Add Interest form */}
            <form onSubmit={handleAddInterest} className="d-flex gap-2 mb-3">
              <input
                type="text"
                placeholder="e.g. B2B Wholesalers, Corporate Procurement"
                value={newInterestName}
                onChange={(e) => setNewInterestName(e.target.value)}
                className="form-control form-control-sm"
                style={{ fontSize: '0.84rem' }}
              />
              <button
                type="submit"
                disabled={!newInterestName.trim()}
                className="btn btn-sm px-3 text-nowrap fw-semibold d-inline-flex align-items-center gap-1 shadow-xs text-white"
                style={{ fontSize: '0.8rem', backgroundColor: '#4F46E5', borderColor: '#4338CA' }}
              >
                <Plus size={14} />
                <span>Add Interest</span>
              </button>
            </form>

            <div className="d-flex align-items-center justify-content-between mb-2">
              <small className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.4px' }}>
                All Interests ({interests.length})
              </small>
              <button
                type="button"
                onClick={handleRestoreDefaultInterests}
                className="btn btn-link p-0 small text-decoration-none text-muted d-flex align-items-center gap-1"
                style={{ fontSize: '0.74rem' }}
              >
                <RefreshCcw size={11} />
                <span>Reset Defaults</span>
              </button>
            </div>

            <div className="d-flex flex-column gap-1.5" style={{ maxHeight: '320px', overflowY: 'auto' }}>
              {interests.map((item) => {
                const isEditing = editingInterestId === item.id;

                return (
                  <div
                    key={item.id}
                    className="p-2 rounded border bg-light d-flex align-items-center justify-content-between"
                    style={{ fontSize: '0.82rem' }}
                  >
                    {isEditing ? (
                      <div className="d-flex align-items-center gap-2 flex-grow-1 me-2">
                        <input
                          type="text"
                          value={editInterestName}
                          onChange={(e) => setEditInterestName(e.target.value)}
                          className="form-control form-control-sm py-0"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEditInterest(item.id)}
                          className="btn btn-sm btn-success py-0 px-2"
                        >
                          <Check size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="d-flex flex-column">
                        <span className="fw-medium text-dark">{item.name}</span>
                        {item.description && (
                          <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                            {item.description}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="d-flex align-items-center gap-1">
                      {!isEditing && (
                        <button
                          type="button"
                          onClick={() => handleStartEditInterest(item)}
                          className="btn btn-sm btn-link text-muted p-1"
                          title="Edit interest"
                        >
                          <Edit2 size={13} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteInterest(item.id)}
                        className="btn btn-sm btn-link text-danger p-1"
                        title="Delete interest"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3 border-top d-flex align-items-center justify-content-between bg-white">
          <small className="text-muted" style={{ fontSize: '0.74rem' }}>
            {categories.length} categories &bull; {interests.length} interests saved
          </small>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm btn-light border px-3 fw-semibold"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
