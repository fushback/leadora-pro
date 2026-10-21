import React, { useState, useEffect, useRef } from 'react';
import { LeadItem, SearchConfig, CategoryItem, InterestItem, ToastNotification } from './types';
import { DEFAULT_CATEGORIES } from './data/defaultCategories';
import { DEFAULT_INTERESTS } from './data/defaultInterests';
import { Header } from './components/Header';
import { SearchWorkflow } from './components/SearchWorkflow';
import { LeadTable } from './components/LeadTable';
import { VcfExporter } from './components/VcfExporter';
import { CategoryManagerModal } from './components/CategoryManagerModal';
import { CordovaAndroidModal } from './components/CordovaAndroidModal';
import { DeployGithubVercelModal } from './components/DeployGithubVercelModal';
import { EditProfileModal } from './components/EditProfileModal';
import { GitHubVercelConsole } from './components/GitHubVercelConsole';
import { SettingsModal } from './components/SettingsModal';
import { AdminPanel } from './components/AdminPanel';
import { Footer } from './components/Footer';
import { MobileFooterNav } from './components/MobileFooterNav';
import { ToastContainer } from './components/ToastContainer';
import { hasValidPhone } from './utils/formatters';
import { ImportLeadsModal } from './components/ImportLeadsModal';
import { 
  getRecentSearches, 
  saveRecentSearch, 
  clearRecentSearches, 
  RecentSearchItem 
} from './utils/recentSearches';
import { 
  UserProfile, 
  getStoredUserProfile 
} from './utils/userProfile';
import {
  SystemStatusConfig,
  getStoredSystemStatus
} from './utils/systemStatus';

// Helper to strictly deduplicate leads by ID, normalized business name, and authentic phone
export function deduplicateLeads(baseList: LeadItem[], incoming: LeadItem[]): LeadItem[] {
  const seenIds = new Set<string>();
  const seenNames = new Set<string>();
  const seenPhones = new Set<string>();
  const result: LeadItem[] = [];

  for (const item of [...baseList, ...incoming]) {
    if (!item) continue;
    const id = (item.id || '').trim();
    const normName = (item.businessName || '').toLowerCase().trim();
    const cleanPhone = (item.contactNumber || '').replace(/\D/g, '').slice(-10);

    if (id && seenIds.has(id)) continue;
    if (normName && seenNames.has(normName)) continue;
    if (cleanPhone && cleanPhone.length >= 7 && seenPhones.has(cleanPhone)) continue;

    if (id) seenIds.add(id);
    if (normName) seenNames.add(normName);
    if (cleanPhone && cleanPhone.length >= 7) seenPhones.add(cleanPhone);
    result.push(item);
  }
  return result;
}

export default function App() {
  const [currentView, setCurrentView] = useState<'workflow' | 'admin' | 'github-vercel'>('workflow');
  const [systemStatusConfig, setSystemStatusConfig] = useState<SystemStatusConfig>(getStoredSystemStatus);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const leadsRef = useRef<LeadItem[]>([]);

  useEffect(() => {
    leadsRef.current = leads;
  }, [leads]);
  const [categories, setCategories] = useState<CategoryItem[]>(DEFAULT_CATEGORIES);
  const [interests, setInterests] = useState<InterestItem[]>(DEFAULT_INTERESTS);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isCordovaModalOpen, setIsCordovaModalOpen] = useState<boolean>(false);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState<boolean>(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState<boolean>(false);
  const [profileInitialTab, setProfileInitialTab] = useState<'profile' | 'github-vercel'>('profile');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<UserProfile>(getStoredUserProfile);
  const [selectedLeadsForVcf, setSelectedLeadsForVcf] = useState<LeadItem[] | null>(null);
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>([]);

  // Handler for importing leads directly into Step 2 table with duplicate-free continuity
  const handleImportComplete = (
    importedLeads: LeadItem[],
    importMode: 'replace' | 'merge',
    detectedLocation?: string,
    detectedCategories?: string[]
  ) => {
    const currentBase = leadsRef.current;
    let duplicateCount = 0;
    const sampleDuplicateNames: string[] = [];

    // Compare imported leads against current table data for duplicates (Place ID, Business Name, Phone)
    if (importMode === 'merge' && currentBase.length > 0) {
      const seenBaseIds = new Set(currentBase.map(l => (l.id || '').trim()).filter(Boolean));
      const seenBaseNames = new Set(currentBase.map(l => (l.businessName || '').toLowerCase().trim()).filter(Boolean));
      const seenBasePhones = new Set(
        currentBase
          .map(l => (l.contactNumber || '').replace(/\D/g, '').slice(-10))
          .filter(p => p.length >= 7)
      );

      importedLeads.forEach(item => {
        const id = (item.id || '').trim();
        const normName = (item.businessName || '').toLowerCase().trim();
        const cleanPhone = (item.contactNumber || '').replace(/\D/g, '').slice(-10);

        const isDup = (id && seenBaseIds.has(id)) || 
                      (normName && seenBaseNames.has(normName)) || 
                      (cleanPhone && cleanPhone.length >= 7 && seenBasePhones.has(cleanPhone));

        if (isDup) {
          duplicateCount++;
          if (item.businessName && sampleDuplicateNames.length < 3) {
            sampleDuplicateNames.push(item.businessName);
          }
        }
      });
    }

    // Add imported data to existing table data (or replace if user explicitly selected replace)
    // Note: If duplicates exist, they are still added as requested, preserving all imported items
    const updated = (importMode === 'merge' && currentBase.length > 0)
      ? [...currentBase, ...importedLeads]
      : importedLeads;

    leadsRef.current = updated;
    setLeads(updated);

    if (detectedLocation && detectedLocation.trim()) {
      setSearchConfig((prev) => ({
        ...prev,
        searchMode: 'manual',
        manualLocation: detectedLocation.trim(),
        location: detectedLocation.trim()
      }));
    }

    if (detectedCategories && detectedCategories.length > 0) {
      setSearchConfig((prev) => {
        const combined = Array.from(new Set([...prev.categories, ...detectedCategories]));
        return {
          ...prev,
          category: combined[0] || prev.category,
          categories: combined
        };
      });
    }

    // Reset exhausted states so subsequent searches are ready immediately
    setIsGoogleMapsExhausted(false);
    setExhaustedCategories(new Set());
    setActiveStep(2);

    if (duplicateCount > 0) {
      addToast({
        type: 'warning',
        title: `Duplicate Data Found (${duplicateCount} ${duplicateCount === 1 ? 'Duplicate' : 'Duplicates'})`,
        message: `Added all ${importedLeads.length} leads (Total: ${updated.length}). Notice: ${duplicateCount} duplicate records found with existing table data (e.g. ${sampleDuplicateNames.join(', ')}). Click 'Validate Data' to clean duplicates anytime!`,
        duration: 7000
      });
    } else {
      addToast({
        type: 'success',
        title: 'Leads Added to Step 2',
        message: `Successfully added ${importedLeads.length} leads to table with 0 duplicates found! Total leads: ${updated.length}.`
      });
    }
  };

  // Toast Notification State
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const addToast = (toast: Omit<ToastNotification, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const duration = toast.duration || 3000;
    const newToast: ToastNotification = { ...toast, id, duration };
    // Flash message: show single active modern flash message for 3 seconds
    setToasts([newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const [isGoogleMapsExhausted, setIsGoogleMapsExhausted] = useState(false);
  const [exhaustedCategories, setExhaustedCategories] = useState<Set<string>>(new Set());
  const [activeCategoryForLoop, setActiveCategoryForLoop] = useState<string | undefined>(undefined);
  const activeCategoryForLoopRef = useRef<string | undefined>(undefined);
  const [pauseCountdown, setPauseCountdown] = useState<number | null>(null);
  const [autoSearchNext, setAutoSearchNext] = useState<boolean>(false);
  const autoSearchNextRef = useRef<boolean>(false);

  useEffect(() => {
    autoSearchNextRef.current = autoSearchNext;
    if (autoSearchNext && activeStep === 2 && !isLoading && pauseCountdown === null) {
      handleExecuteScraper(undefined, true, 'combined', activeCategoryForLoopRef.current);
    }
  }, [autoSearchNext]);

  const [searchConfig, setSearchConfig] = useState<SearchConfig>({
    searchMode: 'manual',
    manualLocation: '',
    country: '',
    tag: '',
    radiusKm: 5,
    category: '',
    categories: [],
    options: {
      enrichEmails: true,
      enrichSocials: false,
      enrichIndiaMart: false,
      verifyWhatsApp: true
    }
  });

  // Load initial data
  useEffect(() => {
    setRecentSearches(getRecentSearches());

    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data?.categories && Array.isArray(data.categories) && data.categories.length > 0) {
          setCategories(data.categories);
          setSearchConfig((prev) => ({
            ...prev,
            categories: prev.categories.length > 0 ? prev.categories : [data.categories[0].name],
            category: prev.category || data.categories[0].name
          }));
        }
      })
      .catch((e) => console.error('Error fetching categories:', e));

    fetch('/api/interests')
      .then((res) => res.json())
      .then((data) => {
        if (data?.interests && Array.isArray(data.interests) && data.interests.length > 0) {
          setInterests(data.interests);
        }
      })
      .catch((e) => console.error('Error fetching interests:', e));
  }, []);

  // Execute Scraping from Google Places API and Gemini AI (Unified single button call)
  const handleExecuteScraper = async (
    overrideConfig?: SearchConfig, 
    appendMode = false,
    engine: 'google' | 'gemini' | 'auto' | 'combined' = 'combined',
    specificCategory?: string
  ) => {
    let configToUse = overrideConfig || searchConfig;

    if (specificCategory) {
      configToUse = {
        ...configToUse,
        categories: [specificCategory],
        category: specificCategory
      };
      setActiveCategoryForLoop(specificCategory);
      activeCategoryForLoopRef.current = specificCategory;
    } else if (!appendMode) {
      setActiveCategoryForLoop(undefined);
      activeCategoryForLoopRef.current = undefined;
    }

    if (configToUse.searchMode === 'manual' && !configToUse.manualLocation.trim()) {
      addToast({
        type: 'warning',
        title: 'Location Missing',
        message: 'Please enter a target city or location.'
      });
      return;
    }
    if (configToUse.categories.length === 0) {
      addToast({
        type: 'warning',
        title: 'Category Missing',
        message: 'Please select at least one commercial category to search.'
      });
      return;
    }

    // Automatically take a pause of 3 seconds when starting again (append mode or subsequent searches)
    if (appendMode || leadsRef.current.length > 0) {
      setPauseCountdown(3);
      await new Promise((r) => setTimeout(r, 1000));
      setPauseCountdown(2);
      await new Promise((r) => setTimeout(r, 1000));
      setPauseCountdown(1);
      await new Promise((r) => setTimeout(r, 1000));
      setPauseCountdown(null);
    }

    setIsLoading(true);

    try {
      const currentBaseLeads = leadsRef.current;
      const existingPlaceIds = appendMode ? currentBaseLeads.map((l) => l.id).filter(Boolean) : [];
      const existingNames = appendMode ? currentBaseLeads.map((l) => l.businessName).filter(Boolean) : [];
      const existingPhones = appendMode ? currentBaseLeads.map((l) => l.contactNumber).filter(Boolean) : [];

      const payload = {
        searchType: configToUse.searchMode,
        manualLocation: configToUse.manualLocation,
        country: configToUse.country,
        tag: configToUse.tag || '',
        lat: configToUse.lat,
        lng: configToUse.lng,
        radiusKm: configToUse.radiusKm,
        category: configToUse.category || configToUse.categories[0] || '',
        categories: configToUse.categories,
        engine,
        existingPlaceIds,
        existingNames,
        existingPhones
      };

      const abortController = new AbortController();
      // 120s safety client timeout to allow thorough Google Maps and Gemini search across categories
      const timeoutId = setTimeout(() => {
        try {
          abortController.abort(new Error('Search request timed out after 120 seconds'));
        } catch {
          // ignore
        }
      }, 120000); 

      let response: Response;
      try {
        response = await fetch('/api/leads/scrape', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload),
          signal: abortController.signal
        });
      } catch (firstErr: any) {
        if (firstErr?.name === 'AbortError') {
          throw new Error('Search took longer than expected. Please click Search More to continue.');
        }
        console.warn('Initial scrape request failed, retrying once...', firstErr);
        await new Promise((r) => setTimeout(r, 800));
        response = await fetch('/api/leads/scrape', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        let errMessage = `Server responded with ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.error) errMessage = errorData.error;
        } catch {
          // ignore json parse error
        }
        throw new Error(errMessage);
      }

      const data = await response.json();
      const rawLeads: LeadItem[] = data.leads || [];

      if (appendMode) {
        // Step 2 Append mode: deduplicate against existing leads and within rawLeads using leadsRef.current
        const currentBaseLeads = leadsRef.current;
        const updatedLeads = deduplicateLeads(currentBaseLeads, rawLeads);
        const trulyNewCount = updatedLeads.length - currentBaseLeads.length;
        const currentCategory = specificCategory || activeCategoryForLoopRef.current;

        if (trulyNewCount > 0) {
          // Immediately update leadsRef so subsequent calls and closures have the full list
          leadsRef.current = updatedLeads;
          setLeads(updatedLeads);
          addToast({
            type: 'success',
            title: 'More Leads Discovered',
            message: `Added ${trulyNewCount} new contacts! Total leads: ${updatedLeads.length}.`
          });

          // If auto-search next is active, automatically start next search after short delay (with 3s pause)
          if (autoSearchNextRef.current) {
            setTimeout(() => {
              if (autoSearchNextRef.current) {
                handleExecuteScraper(undefined, true, 'combined', activeCategoryForLoopRef.current);
              }
            }, 600);
          }
        } else {
          // ZERO COUNT! Immediately halt auto-search and disable button!
          setAutoSearchNext(false);
          autoSearchNextRef.current = false;
          setActiveCategoryForLoop(undefined);
          activeCategoryForLoopRef.current = undefined;

          if (currentCategory) {
            setExhaustedCategories((prev) => new Set([...prev, currentCategory]));
          } else {
            setIsGoogleMapsExhausted(true);
            setExhaustedCategories((prev) => new Set([...prev, ...(configToUse.categories || [])]));
          }

          addToast({
            type: 'info',
            title: 'All Leads Discovered',
            message: `All available verified businesses ${currentCategory ? `for ${currentCategory}` : ''} have been discovered in this radius. Total leads: ${currentBaseLeads.length}.`
          });
        }
        setIsLoading(false);
      } else {
        // Step 1 Initial Search mode: reset exhaustion state
        setIsGoogleMapsExhausted(false);
        setExhaustedCategories(new Set());
        setAutoSearchNext(false);
        autoSearchNextRef.current = false;
        setActiveCategoryForLoop(undefined);
        activeCategoryForLoopRef.current = undefined;
        const initialUniqueLeads = deduplicateLeads([], rawLeads);
        leadsRef.current = initialUniqueLeads;
        setLeads(initialUniqueLeads);

        if (rawLeads.length > 0) {
          saveRecentSearch(configToUse, rawLeads.length);
          setRecentSearches(getRecentSearches());
          setActiveStep(2);
          setIsLoading(false);
          addToast({
            type: 'success',
            title: 'Search Completed',
            message: `Found ${rawLeads.length} verified leads combining Google Maps & Gemini AI in ${configToUse.manualLocation || 'target location'}.`
          });
        } else {
          setIsLoading(false);
          addToast({
            type: 'info',
            title: 'No Results',
            message: 'No commercial listings found in this radius. Try widening your radius or changing the search term.'
          });
        }
      }
    } catch (err: any) {
      setIsLoading(false);
      const isAbort = err?.name === 'AbortError' || err?.message?.includes('aborted') || err?.message?.includes('timed out');
      const isFetchError = err instanceof TypeError || err?.message?.includes('fetch') || err?.message?.includes('network');
      
      if (!isAbort) {
        console.warn('Scraping error:', err);
      }

      addToast({
        type: isAbort ? 'info' : 'warning',
        title: isAbort ? 'Search Timeout' : isFetchError ? 'Connection Busy' : 'Search Notice',
        message: isAbort 
          ? 'Search took longer than expected. Please click Search More to continue where you left off.' 
          : isFetchError
          ? 'The server took longer than usual or connection was interrupted. Please click Search again.'
          : (err.message || 'Failed to extract leads.')
      });
    }
  };

  const handleProceedToStep3 = (selectedList?: LeadItem[]) => {
    const listToExport = selectedList && selectedList.length > 0 ? selectedList : leads;
    setSelectedLeadsForVcf(listToExport);
    setActiveStep(3);
  };

  const handleRecentSearchSelect = (item: RecentSearchItem) => {
    const convertedConfig: SearchConfig = {
      ...searchConfig,
      searchMode: item.searchMode,
      manualLocation: item.manualLocation,
      country: item.country || '',
      radiusKm: item.radiusKm || 5,
      lat: item.lat,
      lng: item.lng,
      categories: item.categories,
      category: item.categories[0] || ''
    };
    setSearchConfig(convertedConfig);
    handleExecuteScraper(convertedConfig);
  };

  const handleClearHistory = () => {
    clearRecentSearches();
    setRecentSearches([]);
  };

  const handleLogout = () => {
    addToast({
      type: 'info',
      title: 'Logged Out',
      message: `You have signed out of ${userProfile.name}'s session.`
    });
  };

  const phoneCount = leads.filter(l => hasValidPhone(l.contactNumber)).length;

  return (
    <div className="min-vh-100 d-flex flex-column bg-body-tertiary">
      
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Modern Compact Header */}
      <Header
        activeStep={activeStep}
        setActiveStep={(step: number) => {
          setCurrentView('workflow');
          setActiveStep(step);
        }}
        leadsCount={leads.length}
        phoneCount={phoneCount}
        canAccessStep2And3={leads.length > 0}
        onOpenCategories={() => setIsCategoryModalOpen(true)}
        onOpenCordovaModal={() => setIsCordovaModalOpen(true)}
        onOpenDeployModal={() => setIsDeployModalOpen(true)}
        onOpenEditProfile={(tab?: 'profile' | 'github-vercel') => {
          setProfileInitialTab(tab || 'profile');
          setIsEditProfileModalOpen(true);
        }}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        userProfile={userProfile}
        onLogout={handleLogout}
        systemStatus={systemStatusConfig.status}
        onNavigateToAdmin={() => setCurrentView('admin')}
        onNavigateToGitHubVercel={() => setCurrentView('github-vercel')}
        onLogoClick={() => {
          setCurrentView('workflow');
          setActiveStep(1);
        }}
      />

      {/* Main Container Area */}
      <main className="flex-grow-1 py-3 py-md-4" style={{ paddingBottom: '76px' }}>
        <div className="container-xl px-2 px-sm-3 px-lg-4">
          
          {/* GitHub / Vercel Cloud Deployment Console */}
          {currentView === 'github-vercel' ? (
            <GitHubVercelConsole
              onBack={() => setCurrentView('workflow')}
              onToast={addToast}
            />
          ) : currentView === 'admin' ? (
            <AdminPanel
              systemStatusConfig={systemStatusConfig}
              onUpdateSystemStatus={(updated) => {
                setSystemStatusConfig(updated);
              }}
              onNavigateBack={() => setCurrentView('workflow')}
              onToast={addToast}
            />
          ) : (
            <>
              {/* Step 1: Intelligent Search Workflow with Google Maps & Categories */}
              {activeStep === 1 && (
                <div className="d-flex flex-column gap-3">
                  <SearchWorkflow
                    searchConfig={searchConfig}
                    setSearchConfig={setSearchConfig}
                    categories={categories}
                    onOpenCategories={() => setIsCategoryModalOpen(true)}
                    onOpenImportModal={() => setIsImportModalOpen(true)}
                    onExecuteScraper={(engine) => handleExecuteScraper(undefined, false, engine)}
                    isLoading={isLoading}
                    pauseCountdown={pauseCountdown}
                    recentSearches={recentSearches}
                    onSelectRecentSearch={handleRecentSearchSelect}
                    onClearRecentSearches={handleClearHistory}
                  />
                </div>
              )}

              {/* Step 2: Leads Table, Contact Verification & Spreadsheet Export */}
              {activeStep === 2 && (
                <LeadTable
                  leads={leads}
                  searchConfig={searchConfig}
                  onProceedToStep3={handleProceedToStep3}
                  onOpenImportModal={() => setIsImportModalOpen(true)}
                  onSearchLeads={(cat) => handleExecuteScraper(undefined, true, 'combined', cat)}
                  isSearchingLeads={isLoading}
                  isGoogleMapsExhausted={isGoogleMapsExhausted}
                  exhaustedCategories={exhaustedCategories}
                  pauseCountdown={pauseCountdown}
                  autoSearchNext={autoSearchNext}
                  onToggleAutoSearchNext={(enabled, cat) => {
                    setActiveCategoryForLoop(cat);
                    activeCategoryForLoopRef.current = cat;
                    setAutoSearchNext(enabled);
                    autoSearchNextRef.current = enabled;
                    if (enabled && !isLoading && pauseCountdown === null) {
                      handleExecuteScraper(undefined, true, 'combined', cat);
                    }
                  }}
                  onToast={addToast}
                  onUpdateLeads={(cleanedLeads) => {
                    leadsRef.current = cleanedLeads;
                    setLeads(cleanedLeads);
                  }}
                  onAddMoreLeads={(newLeads) => {
                    const currentBase = leadsRef.current;
                    const updated = deduplicateLeads(currentBase, newLeads);
                    leadsRef.current = updated;
                    setLeads(updated);
                    addToast({
                      type: 'success',
                      title: 'New Contacts Discovered',
                      message: `Added new verified business contacts! Total leads: ${updated.length}.`
                    });
                  }}
                  onLeadsEnriched={(enrichedLeads) => {
                    const updated = deduplicateLeads([], enrichedLeads);
                    leadsRef.current = updated;
                    setLeads(updated);
                    addToast({
                      type: 'success',
                      title: 'Leads Updated',
                      message: 'Contact list updated across table and exporter!'
                    });
                  }}
                />
              )}

              {/* Step 3: Google Pixel / Standard VCF Exporter Engine */}
              {activeStep === 3 && (
                <VcfExporter
                  leads={selectedLeadsForVcf && selectedLeadsForVcf.length > 0 ? selectedLeadsForVcf : leads}
                />
              )}
            </>
          )}

        </div>
      </main>

      {/* Clean Minimal Footer */}
      <Footer />

      {/* Manage Category & Interest CRUD Modal */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        setCategories={setCategories}
        interests={interests}
        setInterests={setInterests}
      />

      {/* Cordova Android App Builder & Package Modal */}
      <CordovaAndroidModal
        isOpen={isCordovaModalOpen}
        onClose={() => setIsCordovaModalOpen(false)}
      />

      {/* Web Deploy Modal */}
      <DeployGithubVercelModal
        isOpen={isDeployModalOpen}
        onClose={() => setIsDeployModalOpen(false)}
      />

      {/* Import B2B Leads Spreadsheet Modal */}
      <ImportLeadsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={handleImportComplete}
        currentLeadsCount={leads.length}
      />

      {/* Edit User Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        profile={userProfile}
        initialTab={profileInitialTab}
        onNavigateToGitHubVercel={() => {
          setIsEditProfileModalOpen(false);
          setCurrentView('github-vercel');
        }}
        onProfileUpdated={(updated) => {
          setUserProfile(updated);
          addToast({
            type: 'success',
            title: 'Profile Updated',
            message: 'User profile details have been saved.'
          });
        }}
      />

      {/* Application Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSettingsUpdated={(updatedSettings) => {
          setSearchConfig((prev) => ({
            ...prev,
            radiusKm: updatedSettings.defaultRadiusKm
          }));
          addToast({
            type: 'success',
            title: 'Settings Saved',
            message: 'Application preferences updated successfully.'
          });
        }}
      />

      {/* Mobile App Style Bottom Navigation Bar */}
      <MobileFooterNav
        activeStep={activeStep}
        onNavigateStep={(step) => {
          setCurrentView('workflow');
          setActiveStep(step);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        currentView={currentView}
        onToggleAdmin={() => {
          setCurrentView((prev) => (prev === 'admin' ? 'workflow' : 'admin'));
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenCategoriesAndInterests={() => setIsCategoryModalOpen(true)}
        leadCount={leads.length}
      />

    </div>
  );
}
