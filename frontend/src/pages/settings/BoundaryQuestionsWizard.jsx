import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const BoundaryQuestionsWizard = () => {
  const { t } = useTranslation();
  const { periodId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedIndustry, setSelectedIndustry] = useState('');
  
  const [boundaryAnswers, setBoundaryAnswers] = useState({
    // Scope 1
    stationary_combustion: false,
    mobile_sources: false,
    refrigeration_ac: false,
    fire_suppression: false,
    purchased_gases: false,
    
    // Scope 2
    electricity: false,
    steam: false,
    market_based_factors: false,
    
    // Scope 3
    business_travel: false,
    commuting: false,
    transportation_distribution: false,
    waste: false,
    
    // Offsets
    offsets: false
  });

  const industryPresets = {
    manufacturing: {
      label: 'Manufacturing',
      description: 'Production facilities with machinery and equipment',
      defaults: {
        stationary_combustion: true,
        mobile_sources: true,
        refrigeration_ac: true,
        electricity: true,
        steam: true,
        business_travel: true,
        commuting: true,
        transportation_distribution: true,
        waste: true
      }
    },
    retail: {
      label: 'Retail',
      description: 'Shops, stores, and retail outlets',
      defaults: {
        refrigeration_ac: true,
        electricity: true,
        business_travel: true,
        commuting: true,
        transportation_distribution: true,
        waste: true
      }
    },
    technology: {
      label: 'Technology / IT',
      description: 'Software, tech services, data centers',
      defaults: {
        electricity: true,
        business_travel: true,
        commuting: true
      }
    },
    hospitality: {
      label: 'Hospitality',
      description: 'Hotels, restaurants, tourism',
      defaults: {
        stationary_combustion: true,
        refrigeration_ac: true,
        electricity: true,
        steam: true,
        business_travel: true,
        commuting: true,
        waste: true
      }
    },
    professional_services: {
      label: 'Professional Services',
      description: 'Consulting, legal, accounting, etc.',
      defaults: {
        electricity: true,
        business_travel: true,
        commuting: true
      }
    },
    transportation: {
      label: 'Transportation',
      description: 'Logistics, shipping, transport services',
      defaults: {
        mobile_sources: true,
        electricity: true,
        business_travel: true,
        commuting: true,
        transportation_distribution: true
      }
    }
  };

  const moduleInfo = {
    // Scope 1
    stationary_combustion: {
      name: 'Stationary Combustion',
      description: 'Emissions from burning fuels in fixed equipment (boilers, furnaces, generators)',
      examples: ['Natural gas for heating', 'Diesel generators', 'Coal-fired boilers']
    },
    mobile_sources: {
      name: 'Mobile Sources',
      description: 'Emissions from company-owned or leased vehicles',
      examples: ['Company cars', 'Delivery trucks', 'Forklifts']
    },
    refrigeration_ac: {
      name: 'Refrigeration & AC',
      description: 'Fugitive emissions from cooling systems',
      examples: ['Air conditioning units', 'Refrigerators', 'Chillers']
    },
    fire_suppression: {
      name: 'Fire Suppression',
      description: 'Emissions from fire suppression systems',
      examples: ['Fire extinguishers', 'Halon systems', 'FM-200 systems']
    },
    purchased_gases: {
      name: 'Purchased Gases',
      description: 'Industrial gases used in operations',
      examples: ['CO2 for carbonation', 'Nitrogen', 'Argon']
    },
    
    // Scope 2
    electricity: {
      name: 'Purchased Electricity',
      description: 'Emissions from electricity consumed from the grid',
      examples: ['Office lighting', 'Equipment power', 'HVAC systems']
    },
    steam: {
      name: 'Purchased Steam/Heat',
      description: 'Emissions from district heating or steam',
      examples: ['District heating', 'Purchased steam', 'Hot water supply']
    },
    market_based_factors: {
      name: 'Market-Based Factors',
      description: 'Use specific supplier emission factors (e.g., renewable energy contracts)',
      examples: ['Green energy certificates', 'Renewable PPAs']
    },
    
    // Scope 3
    business_travel: {
      name: 'Business Travel',
      description: 'Employee travel in non-company vehicles',
      examples: ['Flights', 'Rental cars', 'Taxis', 'Hotel stays']
    },
    commuting: {
      name: 'Employee Commuting',
      description: 'Employee travel between home and work',
      examples: ['Daily commute by car', 'Public transport', 'Carpooling']
    },
    transportation_distribution: {
      name: 'Transportation & Distribution',
      description: 'Shipping and logistics (upstream and downstream)',
      examples: ['Product shipping', 'Material delivery', 'Courier services']
    },
    waste: {
      name: 'Waste Disposal',
      description: 'Emissions from waste sent to landfill or incineration',
      examples: ['Municipal waste', 'Hazardous waste', 'Recycling']
    },
    
    // Offsets
    offsets: {
      name: 'Carbon Offsets',
      description: 'Track purchased carbon credits or offset projects',
      examples: ['Reforestation credits', 'Renewable energy certificates', 'Carbon capture projects']
    }
  };

  useEffect(() => {
    fetchExistingAnswers();
  }, [periodId]);

  const fetchExistingAnswers = async () => {
    try {
      const token = localStorage.getItem('token');
      const companyId = localStorage.getItem('selectedCompanyId');
      
      const response = await fetch(
        `/api/companies/${companyId}/reporting-periods/${periodId}/boundary-questions`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.boundaryQuestions) {
          setBoundaryAnswers(data.boundaryQuestions);
          setCurrentStep(4); // Skip to review if already exists
        }
      }
    } catch (error) {
      console.log('No existing boundary questions, starting fresh');
    }
  };

  const applyIndustryPreset = (industry) => {
    setSelectedIndustry(industry);
    const preset = industryPresets[industry];
    if (preset) {
      setBoundaryAnswers(prev => ({
        ...prev,
        ...preset.defaults
      }));
    }
  };

  const toggleModule = (module) => {
    setBoundaryAnswers(prev => ({
      ...prev,
      [module]: !prev[module]
    }));
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const companyId = localStorage.getItem('selectedCompanyId');

      const response = await fetch(
        `/api/companies/${companyId}/reporting-periods/${periodId}/boundary-questions`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(boundaryAnswers)
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save boundary questions');
      }

      toast.success('Boundary questions saved successfully!');
      navigate(`/settings/periods`);
    } catch (error) {
      console.error('Error saving boundary questions:', error);
      toast.error(error.message || 'Failed to save boundary questions');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Welcome to Boundary Setting</h2>
              <p className="text-gray-300">
                Let's determine which emissions sources are relevant for your organization.
                This helps us tailor the platform to your specific needs.
              </p>
            </div>

            <div className="bg-white/5 border border-cyan-mist/30 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Choose Your Industry (Optional)</h3>
              <p className="text-gray-300 mb-6">
                Select your industry for recommended settings, or skip and customize manually.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(industryPresets).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => applyIndustryPreset(key)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      selectedIndustry === key
                        ? 'border-cyan-mist bg-cyan-mist/10'
                        : 'border-gray-600 hover:border-cyan-mist/50'
                    }`}
                  >
                    <div className="font-semibold text-white mb-1">{preset.label}</div>
                    <div className="text-sm text-gray-400">{preset.description}</div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentStep(2)}
                className="mt-6 w-full py-2 px-4 border border-cyan-mist/50 rounded-lg text-white hover:bg-cyan-mist/10 transition-colors"
              >
                Skip and Customize Manually
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Scope 1: Direct Emissions</h2>
              <p className="text-gray-300">
                Emissions from sources owned or controlled by your organization.
              </p>
            </div>

            <div className="space-y-4">
              {['stationary_combustion', 'mobile_sources', 'refrigeration_ac', 'fire_suppression', 'purchased_gases'].map(module => {
                const info = moduleInfo[module];
                return (
                  <div
                    key={module}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      boundaryAnswers[module]
                        ? 'border-cyan-mist bg-cyan-mist/10'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                    onClick={() => toggleModule(module)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            checked={boundaryAnswers[module]}
                            onChange={() => {}}
                            className="w-5 h-5 rounded border-gray-600"
                          />
                          <h3 className="text-lg font-semibold text-white">{info.name}</h3>
                        </div>
                        <p className="text-sm text-gray-300 mb-2 ml-7">{info.description}</p>
                        <div className="text-xs text-gray-400 ml-7">
                          <span className="font-semibold">Examples: </span>
                          {info.examples.join(', ')}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Scope 2 & 3: Indirect Emissions</h2>
              <p className="text-gray-300">
                Emissions from purchased energy and your value chain.
              </p>
            </div>

            <div className="bg-white/5 border border-cyan-mist/30 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-cyan-mist mb-2">Scope 2: Energy Indirect</h3>
            </div>

            <div className="space-y-4 mb-8">
              {['electricity', 'steam', 'market_based_factors'].map(module => {
                const info = moduleInfo[module];
                return (
                  <div
                    key={module}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      boundaryAnswers[module]
                        ? 'border-cyan-mist bg-cyan-mist/10'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                    onClick={() => toggleModule(module)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            checked={boundaryAnswers[module]}
                            onChange={() => {}}
                            className="w-5 h-5 rounded border-gray-600"
                          />
                          <h3 className="text-lg font-semibold text-white">{info.name}</h3>
                        </div>
                        <p className="text-sm text-gray-300 mb-2 ml-7">{info.description}</p>
                        <div className="text-xs text-gray-400 ml-7">
                          <span className="font-semibold">Examples: </span>
                          {info.examples.join(', ')}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-white/5 border border-cyan-mist/30 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-cyan-mist mb-2">Scope 3: Value Chain</h3>
            </div>

            <div className="space-y-4">
              {['business_travel', 'commuting', 'transportation_distribution', 'waste'].map(module => {
                const info = moduleInfo[module];
                return (
                  <div
                    key={module}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      boundaryAnswers[module]
                        ? 'border-cyan-mist bg-cyan-mist/10'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                    onClick={() => toggleModule(module)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            checked={boundaryAnswers[module]}
                            onChange={() => {}}
                            className="w-5 h-5 rounded border-gray-600"
                          />
                          <h3 className="text-lg font-semibold text-white">{info.name}</h3>
                        </div>
                        <p className="text-sm text-gray-300 mb-2 ml-7">{info.description}</p>
                        <div className="text-xs text-gray-400 ml-7">
                          <span className="font-semibold">Examples: </span>
                          {info.examples.join(', ')}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-white/5 border border-cyan-mist/30 rounded-lg p-4 mt-6">
              <h3 className="text-lg font-semibold text-cyan-mist mb-2">Carbon Offsets</h3>
            </div>

            <div className="space-y-4">
              {['offsets'].map(module => {
                const info = moduleInfo[module];
                return (
                  <div
                    key={module}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      boundaryAnswers[module]
                        ? 'border-cyan-mist bg-cyan-mist/10'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                    onClick={() => toggleModule(module)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            checked={boundaryAnswers[module]}
                            onChange={() => {}}
                            className="w-5 h-5 rounded border-gray-600"
                          />
                          <h3 className="text-lg font-semibold text-white">{info.name}</h3>
                        </div>
                        <p className="text-sm text-gray-300 mb-2 ml-7">{info.description}</p>
                        <div className="text-xs text-gray-400 ml-7">
                          <span className="font-semibold">Examples: </span>
                          {info.examples.join(', ')}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 4:
        const enabledScope1 = Object.entries(boundaryAnswers)
          .filter(([key]) => ['stationary_combustion', 'mobile_sources', 'refrigeration_ac', 'fire_suppression', 'purchased_gases'].includes(key))
          .filter(([, value]) => value)
          .map(([key]) => moduleInfo[key].name);

        const enabledScope2 = Object.entries(boundaryAnswers)
          .filter(([key]) => ['electricity', 'steam', 'market_based_factors'].includes(key))
          .filter(([, value]) => value)
          .map(([key]) => moduleInfo[key].name);

        const enabledScope3 = Object.entries(boundaryAnswers)
          .filter(([key]) => ['business_travel', 'commuting', 'transportation_distribution', 'waste'].includes(key))
          .filter(([, value]) => value)
          .map(([key]) => moduleInfo[key].name);

        const enabledOffsets = boundaryAnswers.offsets;

        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Review Your Selection</h2>
              <p className="text-gray-300">
                Here's a summary of your organizational boundaries. You can go back to make changes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 border border-cyan-mist/30 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-cyan-mist mb-4">Scope 1: Direct Emissions</h3>
                {enabledScope1.length > 0 ? (
                  <ul className="space-y-2">
                    {enabledScope1.map(name => (
                      <li key={name} className="text-white flex items-center gap-2">
                        <span className="text-green-500">✓</span> {name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400 italic">No Scope 1 modules selected</p>
                )}
              </div>

              <div className="bg-white/5 border border-cyan-mist/30 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-cyan-mist mb-4">Scope 2: Energy Indirect</h3>
                {enabledScope2.length > 0 ? (
                  <ul className="space-y-2">
                    {enabledScope2.map(name => (
                      <li key={name} className="text-white flex items-center gap-2">
                        <span className="text-green-500">✓</span> {name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400 italic">No Scope 2 modules selected</p>
                )}
              </div>

              <div className="bg-white/5 border border-cyan-mist/30 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-cyan-mist mb-4">Scope 3: Value Chain</h3>
                {enabledScope3.length > 0 ? (
                  <ul className="space-y-2">
                    {enabledScope3.map(name => (
                      <li key={name} className="text-white flex items-center gap-2">
                        <span className="text-green-500">✓</span> {name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400 italic">No Scope 3 modules selected</p>
                )}
              </div>

              <div className="bg-white/5 border border-cyan-mist/30 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-cyan-mist mb-4">Carbon Offsets</h3>
                {enabledOffsets ? (
                  <p className="text-white flex items-center gap-2">
                    <span className="text-green-500">✓</span> Offset tracking enabled
                  </p>
                ) : (
                  <p className="text-gray-400 italic">Offset tracking disabled</p>
                )}
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mt-6">
              <p className="text-yellow-200 text-sm">
                <span className="font-semibold">Note:</span> You can always update these settings later from the Reporting Periods page.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-midnight-navy p-6">
      <div className="max-w-5xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4].map(step => (
              <div key={step} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    currentStep >= step
                      ? 'bg-cyan-mist text-midnight-navy'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {step}
                </div>
                {step < 4 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      currentStep > step ? 'bg-cyan-mist' : 'bg-gray-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>Industry</span>
            <span>Scope 1</span>
            <span>Scope 2 & 3</span>
            <span>Review</span>
          </div>
        </div>

        {/* Content */}
        <div className="bg-primary-light border border-gray-700 rounded-lg p-8">
          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-700">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className={`py-2 px-6 rounded-lg font-semibold transition-colors ${
                currentStep === 1
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              Back
            </button>

            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                className="py-2 px-6 rounded-lg font-semibold bg-cyan-mist text-midnight-navy hover:bg-cyan-mist/80 transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="py-2 px-6 rounded-lg font-semibold bg-cyan-mist text-midnight-navy hover:bg-cyan-mist/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save and Finish'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoundaryQuestionsWizard;
